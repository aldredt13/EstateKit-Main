/**
 * EstateKit booking backend — Google Calendar + Sheet, no third party.
 * =====================================================================
 * Paste into the bound Apps Script of the tracking sheet, alongside
 * estatekit-sheet.gs, then redeploy (Deploy > Manage deployments > Edit >
 * New version). This file owns doGet and doPost; delete those two functions
 * from estatekit-sheet.gs so they don't collide.
 *
 * Why JSONP for reads: an Apps Script web app sends no
 * Access-Control-Allow-Origin header, so a browser can POST to it blind but
 * can never read the reply. A <script> tag isn't subject to CORS at all, so
 * availability is served as `callback({...})` instead of plain JSON.
 *
 * Scale: slots are cached for CACHE_SECONDS, so a hundred people loading the
 * page in the same minute cost one calendar read, not a hundred. Apps Script
 * allows 30 concurrent executions and tens of thousands of calendar reads a
 * day — far beyond a lead funnel. The cache can go briefly stale, which is
 * why createBooking re-checks the calendar at write time; that check, not the
 * slot list, is what actually prevents a double booking.
 */

// ── Settings ───────────────────────────────────────────────────────────────
var CAL_ID = "dbee8d5019e1c19b69d7e1a2f27968195adfa23a947a6db2078bbd4f2a03cf54@group.calendar.google.com";
/** Calendars that merely block time (don't receive the event). */
var BUSY_CALENDARS = [
  "ousebk@gmail.com",
  "ac1d5b1bbbf21211adaadcbf04fcd48c8c34cdae4650758e2c8121de18747f40@group.calendar.google.com",
];

var SLOT_MINUTES = 45;
var GAP_MINUTES = 10; // breathing room after each call
var MIN_NOTICE_HOURS = 24; // 1 day
var WINDOW_DAYS = 4; // bookable days ahead
var DAY_START_HOUR = 9;
var DAY_END_HOUR = 17; // last slot must END by this hour
var WORK_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri
var CACHE_SECONDS = 15; // short enough to read as live, long enough to absorb a burst

// ── Entry points ───────────────────────────────────────────────────────────

/**
 * Serves both availability and the booking itself, because each needs a reply
 * the browser can actually read — and JSONP is the only route that gives us
 * one. A booking over GET is unusual, but the conflict re-check inside
 * createBooking makes a repeated request harmless rather than a duplicate.
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var cb = p.callback || "callback";
  var payload;

  try {
    if (p.action === "book") {
      var lock = LockService.getScriptLock();
      lock.waitLock(25000);
      try {
        payload = createBooking(JSON.parse(p.payload || "{}"));
      } finally {
        lock.releaseLock();
      }
    } else {
      payload = { ok: true, slots: getSlots() };
    }
  } catch (err) {
    payload = { ok: false, error: String(err), slots: {} };
  }

  return ContentService.createTextOutput(
    cb + "(" + JSON.stringify(payload) + ");",
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    var body = JSON.parse(e.postData.contents);
    var out = { ok: true };

    if (body.type === "booking") out = createBooking(body);
    else if (body.type === "dropoff") recordDropoff(body);
    else if (body.type === "pageview") bumpTraffic(2);
    else if (body.type === "form_start") bumpTraffic(3);
    else if (body.type === "engagement") recordEngagement(body);

    return ContentService.createTextOutput(
      JSON.stringify(out),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ── Availability ───────────────────────────────────────────────────────────

/** `{ "2026-10-13": ["2026-10-13T09:00:00+02:00", ...] }` */
function getSlots() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get("slots");
  if (hit) return JSON.parse(hit);

  var tz = Session.getScriptTimeZone();
  var now = new Date();
  var earliest = new Date(now.getTime() + MIN_NOTICE_HOURS * 3600000);
  var horizon = new Date(now.getTime() + WINDOW_DAYS * 86400000);

  var busy = collectBusy(now, horizon);
  var out = {};

  for (var day = 0; day <= WINDOW_DAYS; day++) {
    var d = new Date(now.getTime() + day * 86400000);
    if (WORK_DAYS.indexOf(d.getDay()) === -1) continue;

    var key = Utilities.formatDate(d, tz, "yyyy-MM-dd");
    var slots = [];

    for (var h = DAY_START_HOUR * 60; h + SLOT_MINUTES <= DAY_END_HOUR * 60; h += SLOT_MINUTES + GAP_MINUTES) {
      var start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, h, 0);
      var end = new Date(start.getTime() + SLOT_MINUTES * 60000);

      if (start < earliest || start > horizon) continue;
      if (overlapsBusy(start, end, busy)) continue;

      slots.push(Utilities.formatDate(start, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"));
    }

    if (slots.length) out[key] = slots;
  }

  cache.put("slots", JSON.stringify(out), CACHE_SECONDS);
  return out;
}

/** Every busy interval across the booking calendar and the blockers. */
function collectBusy(from, to) {
  var ids = [CAL_ID].concat(BUSY_CALENDARS);
  var busy = [];

  for (var i = 0; i < ids.length; i++) {
    var cal = CalendarApp.getCalendarById(ids[i]);
    if (!cal) continue;
    var events = cal.getEvents(from, to);
    for (var j = 0; j < events.length; j++) {
      if (events[j].isAllDayEvent()) continue;
      busy.push({
        start: events[j].getStartTime().getTime(),
        end: events[j].getEndTime().getTime(),
      });
    }
  }
  return busy;
}

function overlapsBusy(start, end, busy) {
  var s = start.getTime();
  var e = end.getTime();
  for (var i = 0; i < busy.length; i++) {
    if (s < busy[i].end && e > busy[i].start) return true;
  }
  return false;
}

// ── Booking ────────────────────────────────────────────────────────────────

function createBooking(d) {
  var start = new Date(d.start);
  if (isNaN(start.getTime())) return { ok: false, error: "Bad start time" };
  var end = new Date(start.getTime() + SLOT_MINUTES * 60000);

  // The slot list may be up to CACHE_SECONDS stale, so the calendar is the
  // authority at the moment of writing. This is the real double-book guard.
  var busy = collectBusy(
    new Date(start.getTime() - 3600000),
    new Date(end.getTime() + 3600000),
  );
  if (overlapsBusy(start, end, busy)) {
    CacheService.getScriptCache().remove("slots");
    return { ok: false, error: "That time was just taken — please pick another." };
  }

  var cal = CalendarApp.getCalendarById(CAL_ID);
  var event = cal.createEvent(
    "EstateKit Discovery Call — " + (d.name || "Lead"),
    start,
    end,
    {
      description: [
        "Name: " + (d.name || ""),
        "Phone: " + (d.phone || ""),
        "Email: " + (d.email || ""),
        "PPRA: " + (d.q1 || ""),
        "Transactions (6mo): " + (d.q2 || ""),
        "Score: " + (d.score == null ? "" : d.score),
      ].join("\n"),
      guests: d.email || "",
      sendInvites: true,
    },
  );

  CacheService.getScriptCache().remove("slots");
  recordBookingRow(d, start);

  return { ok: true, eventId: event.getId() };
}

// ── Sheet ──────────────────────────────────────────────────────────────────

var LEADS = "Closer";
var NO_SHOWS = "Not booked"; // filled in the form, never picked a time

var LEAD_HEADERS = [
  "When they booked", "Booking date and time", "Name", "Phone", "Email",
  "PPRA status", "Transactions (6mo)", "Score", "Qualified",
  "Breakout videos played", "Reached", "Showed", "Outcome",
  "Deal value", "Notes",
];

var DEFAULT_DEAL_VALUE = 3000;

/** Newest first — new rows go in at the top, not appended. */
function insertLeadRow(values) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEADS);
  if (!sheet) throw new Error("Run setupBookingSheet() first.");

  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, values.length).setValues([values]);

  // "Monday 6:26pm" on screen, a real timestamp underneath so it still sorts.
  sheet.getRange(2, 1).setNumberFormat('dddd h:mm am/pm');
  sheet.getRange(2, 2).setNumberFormat('ddd d mmm, h:mm am/pm');
  sheet.getRange(2, 14).setNumberFormat("R#,##0");
  applyLeadValidation(sheet, 2);
  return 2;
}

function recordBookingRow(d, start) {
  insertLeadRow([
    new Date(), start, d.name || "", d.phone || "", (d.email || "").toLowerCase(),
    d.q1 || "", d.q2 || "", d.score == null ? "" : d.score,
    d.qualified ? "Yes" : "No", "", "", "", "Pending", DEFAULT_DEAL_VALUE, "",
  ]);
}

/**
 * A lead who gave their details but never picked a time. Kept on its own tab
 * rather than mixed into Closer — these are a callable follow-up list, not
 * appointments, and the KPI rollup would otherwise count them as bookings.
 */
function recordDropoff(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(NO_SHOWS);
  if (!sheet) sheet = buildNotBooked(ss);

  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, 9).setValues([[
    new Date(), d.name || "", d.phone || "", (d.email || "").toLowerCase(),
    d.q1 || "", d.q2 || "", d.score == null ? "" : d.score,
    d.qualified ? "Yes" : "No", "",
  ]]);
  sheet.getRange(2, 1).setNumberFormat('dddd h:mm am/pm');
  sheet.getRange(2, 9).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(["Not yet", "Called", "Booked later", "Dead"], true)
      .setAllowInvalid(false).build());

  bumpTraffic(5);
}

var NOT_BOOKED_HEADERS = [
  "When", "Name", "Phone", "Email", "PPRA status",
  "Transactions (6mo)", "Score", "Qualified", "Followed up",
];

function buildNotBooked(ss) {
  var sheet = ss.getSheetByName(NO_SHOWS) || ss.insertSheet(NO_SHOWS);
  sheet.clear();
  sheet.getRange(1, 1, 1, NOT_BOOKED_HEADERS.length)
    .setValues([NOT_BOOKED_HEADERS])
    .setFontWeight("bold").setBackground("#7C2D12").setFontColor("#FFFFFF")
    .setWrap(true).setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 40);
  var w = [150, 150, 130, 210, 190, 140, 60, 80, 120];
  for (var i = 0; i < w.length; i++) sheet.setColumnWidth(i + 1, w[i]);
  return sheet;
}

function recordEngagement(d) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEADS);
  if (!sheet || !d.email) return;
  var last = sheet.getLastRow();
  if (last < 2) return;

  var emails = sheet.getRange(2, 5, last - 1, 1).getValues();
  var target = String(d.email).toLowerCase().trim();
  for (var i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).toLowerCase().trim() === target) {
      sheet.getRange(i + 2, 10).setValue(d.detail || "");
      return;
    }
  }
}

function applyLeadValidation(sheet, row) {
  var yesNo = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Yes", "No"], true).setAllowInvalid(false).build();
  var outcome = SpreadsheetApp.newDataValidation()
    .requireValueInList(
      ["Pending", "Won", "Lost", "No-show", "Dropped off", "Rescheduled"], true)
    .setAllowInvalid(false).build();

  sheet.getRange(row, 11).setDataValidation(yesNo);
  sheet.getRange(row, 12).setDataValidation(yesNo);
  sheet.getRange(row, 13).setDataValidation(outcome);
}

function setupBookingSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  buildNotBooked(ss);

  var sheet = ss.getSheetByName(LEADS) || ss.insertSheet(LEADS);
  sheet.clear();
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns())
    .clearDataValidations();

  sheet.getRange(1, 1, 1, LEAD_HEADERS.length).setValues([LEAD_HEADERS])
    .setFontWeight("bold").setBackground("#1F223C").setFontColor("#FFFFFF")
    .setWrap(true).setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);
  sheet.setRowHeight(1, 40);

  var widths = [150, 160, 150, 130, 210, 190, 140, 60, 80, 280, 85, 70, 110, 110, 300];
  for (var i = 0; i < widths.length; i++) sheet.setColumnWidth(i + 1, widths[i]);

  SpreadsheetApp.getUi().alert(
    "Closer tab rebuilt. Now: Deploy > Manage deployments > Edit > New version.",
  );
}
