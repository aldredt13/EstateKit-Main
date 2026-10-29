/**
 * EstateKit booking backend — Google Calendar + Sheet, no third party.
 * =====================================================================
 * The only job left here is Google Calendar: which times are free, and
 * writing the event when someone books. Leads, follow-up emails and
 * reporting all live in the client dashboard now, so there is no spreadsheet
 * and no doPost.
 *
 * Paste as the only file in the Apps Script project, then redeploy
 * (Deploy > Manage deployments > Edit > New version).
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

/** "secondary". Discovery calls are written here and invites come from it. */
var CAL_ID = "ac1d5b1bbbf21211adaadcbf04fcd48c8c34cdae4650758e2c8121de18747f40@group.calendar.google.com";

/**
 * Calendars that only block time out. They never receive the event, they
 * just stop a lead booking over something already in the diary.
 *
 * Empty on purpose. "Main" and the personal calendar were listed here but
 * were never shared with the account this script runs as, so every run
 * warned that it could not read them. A calendar only counts once it is
 * both listed here AND shared, so listing an unshared one buys nothing but
 * the alert.
 *
 * Availability is therefore whatever "secondary" says. Anything booked
 * elsewhere does not block a slot. To change that: share the calendar with
 * the script account, add its id below, then run acceptCalendars().
 *
 *   // "Main"
 *   "dbee8d5019e1c19b69d7e1a2f27968195adfa23a947a6db2078bbd4f2a03cf54@group.calendar.google.com",
 *   // "Low Quality", the personal calendar
 *   "ousebk@gmail.com",
 */
var BUSY_CALENDARS = [];

var SLOT_MINUTES = 45;
var GAP_MINUTES = 40; // break between calls
var MIN_NOTICE_HOURS = 24; // 1 day
var WINDOW_DAYS = 4; // bookable days ahead
var DAY_START_HOUR = 9;
var DAY_END_HOUR = 17; // last slot must END by this hour
var WORK_DAYS = [0, 1, 2, 3, 4, 5, 6]; // every day, incl. weekends
var OVERFLOW_MAX_DAYS = 14; // how far past WINDOW_DAYS to search if fully booked

/** Where a broken booking system shouts. Swap for a dedicated #alerts hook. */
var ALERT_WEBHOOK = "https://discord.com/api/webhooks/1559251256273276939/LfnomQcmfdc4tkyliaRFmgb--lnR0v36Hr5LxkOS1Mh735KiYClhZG0naByP_-Am1eWH";

// ── Failure alerts ─────────────────────────────────────────────────────────

/**
 * A booking backend that fails quietly is worse than one that fails loudly:
 * the calendar just stays empty and nobody finds out until Friday. Every
 * caught error routes through here.
 *
 * Throttled per location, because a quota breach or an expired auth fails on
 * every single request and would otherwise post hundreds of identical cards.
 * Never throws: an alert that breaks the thing it's reporting on is useless.
 */
function notifyFailure(where, err, extra, opts) {
  try {
    var warn = opts && opts.warning;

    var cache = CacheService.getScriptCache();
    var key = "alerted_" + where;
    if (cache.get(key)) return;
    // A warning is a standing config gap, not an incident, so it repeats far
    // less often. Six hours is enough to stay on the radar without becoming
    // noise you learn to scroll past.
    cache.put(key, "1", warn ? 21600 : 600);

    var fields = [
      { name: "Where", value: String(where), inline: true },
      { name: "When", value: new Date().toUTCString(), inline: true },
      { name: "Error", value: String(err).slice(0, 1000), inline: false },
    ];
    if (extra) {
      fields.push({ name: "Detail", value: String(extra).slice(0, 1000), inline: false });
    }

    UrlFetchApp.fetch(ALERT_WEBHOOK, {
      method: "post",
      contentType: "application/json",
      muteHttpExceptions: true,
      payload: JSON.stringify({
        content: warn ? undefined : "@everyone booking backend error",
        allowed_mentions: warn ? undefined : { parse: ["everyone"] },
        embeds: [{
          title: warn
            ? "⚠️ EstateKit booking needs attention"
            : "🚨 EstateKit booking backend failed",
          description: warn
            ? "Bookings are still working. Something is configured in a " +
              "way that could bite later."
            : "A lead may have just been unable to book. Check the Apps " +
              "Script executions log.",
          color: warn ? 0xf59e0b : 0xef4444,
          fields: fields,
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (e) {
    // Nothing useful left to do; swallow so the caller still responds.
  }
}

/**
 * Run once by hand after the calendars have been shared with this account.
 *
 * Sharing a calendar only grants permission. Until the account also
 * subscribes to it, getCalendarById returns null and the calendar reads as
 * though it does not exist, which is indistinguishable from "not shared".
 * Normally you accept by clicking a link in an invitation email; this does
 * the same thing without the email hunt.
 */
function acceptCalendars() {
  var ids = [CAL_ID].concat(BUSY_CALENDARS);
  var me = Session.getEffectiveUser().getEmail();
  var report = ["Running as: " + me, ""];

  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    try {
      if (CalendarApp.getCalendarById(id)) {
        report.push("already readable: " + id);
        continue;
      }
      CalendarApp.subscribeToCalendar(id);
      report.push(
        CalendarApp.getCalendarById(id)
          ? "subscribed: " + id
          : "STILL UNREADABLE, check the share: " + id,
      );
    } catch (err) {
      report.push("FAILED " + id + " -> " + err);
    }
  }

  say(report.join("\n"));
}

/**
 * Shows a result both ways. A popup needs the script to be bound to a
 * spreadsheet, which this one no longer has any other reason to be, so the
 * log is the reliable copy and the popup is a convenience when it works.
 */
function say(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    // Standalone script, or run from the editor rather than the sheet.
  }
}

/** Run once by hand after deploying, to prove the alert path works. */
function testAlert() {
  CacheService.getScriptCache().remove("alerted_manual-test");
  notifyFailure("manual-test", "This is a test, nothing is broken.");
}

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
    notifyFailure(p.action === "book" ? "doGet/book" : "doGet/slots", err, p.payload);
    payload = { ok: false, error: String(err), slots: {} };
  }

  return ContentService.createTextOutput(
    cb + "(" + JSON.stringify(payload) + ");",
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// ── Availability ───────────────────────────────────────────────────────────

/** `{ "2026-10-13": ["2026-10-13T09:00:00+02:00", ...] }` */
function getSlots() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get("slots");
  if (hit) return JSON.parse(hit);

  var tz = Session.getScriptTimeZone();
  var now = new Date();
  var horizon = new Date(now.getTime() + WINDOW_DAYS * 86400000);

  // MIN_NOTICE_HOURS used to gate each slot against a raw now+ms cutoff,
  // which interacts badly with DAY_END_HOUR: evaluated after mid-afternoon,
  // now+24h lands in the evening of the next day, after the last bookable
  // slot, silently wiping all of tomorrow every single evening. Notice is
  // applied in whole calendar days instead, so tomorrow stays fully
  // available regardless of what time the page loads.
  var minNoticeDays = Math.ceil(MIN_NOTICE_HOURS / 24);

  var busy = collectBusy(now, horizon);
  var out = {};

  for (var day = minNoticeDays; day <= WINDOW_DAYS; day++) {
    addDaySlots(out, day, now, tz, busy, horizon);
  }

  // Fully booked inside the normal window: rather than hand back an empty
  // calendar, look further out and surface the first open day, so a lead
  // who lands here during a packed stretch still sees a real time to pick.
  // One extra calendar read, and only when the common case has failed.
  if (!Object.keys(out).length) {
    var farHorizon = new Date(now.getTime() + (WINDOW_DAYS + OVERFLOW_MAX_DAYS) * 86400000);
    var farBusy = collectBusy(now, farHorizon);

    for (var day2 = WINDOW_DAYS + 1; day2 <= WINDOW_DAYS + OVERFLOW_MAX_DAYS; day2++) {
      addDaySlots(out, day2, now, tz, farBusy, farHorizon);
      if (Object.keys(out).length) break;
    }
  }

  cache.put("slots", JSON.stringify(out), CACHE_SECONDS);
  return out;
}

/** Appends one calendar day's open slots to `out`, keyed by yyyy-MM-dd. */
function addDaySlots(out, dayOffset, now, tz, busy, horizon) {
  var d = new Date(now.getTime() + dayOffset * 86400000);
  if (WORK_DAYS.indexOf(d.getDay()) === -1) return;

  var key = Utilities.formatDate(d, tz, "yyyy-MM-dd");
  var slots = [];

  for (var h = DAY_START_HOUR * 60; h + SLOT_MINUTES <= DAY_END_HOUR * 60; h += SLOT_MINUTES + GAP_MINUTES) {
    var start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, h, 0);
    var end = new Date(start.getTime() + SLOT_MINUTES * 60000);

    if (start > horizon) break;
    if (overlapsBusy(start, end, busy)) continue;

    slots.push(Utilities.formatDate(start, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"));
  }

  if (slots.length) out[key] = slots;
}

/**
 * Every busy interval across the booking calendar and the blockers.
 *
 * A calendar this account cannot see returns null, and skipping it quietly
 * would make it read as completely free, so a lead could book straight over
 * a real appointment with no error anywhere. That is the likeliest fault
 * after moving the script to a different Google account, so an unreadable
 * calendar shouts instead: fatal for the booking calendar, because nothing
 * can be written without it, and a Discord alert for a blocker.
 */
function collectBusy(from, to) {
  var ids = [CAL_ID].concat(BUSY_CALENDARS);
  var busy = [];

  for (var i = 0; i < ids.length; i++) {
    var cal = CalendarApp.getCalendarById(ids[i]);
    if (!cal) {
      if (ids[i] === CAL_ID) {
        throw new Error(
          "Booking calendar is not readable by " +
          Session.getEffectiveUser().getEmail() + ". Share it with that " +
          "account, with 'Make changes to events'.");
      }
      notifyFailure("calendar-unreadable",
        "Cannot read " + ids[i] + " as " +
        Session.getEffectiveUser().getEmail() +
        ". It reads as free, so a lead could book over something already " +
        "in it. Share it with that account and run acceptCalendars().",
        null, { warning: true });
      continue;
    }
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

  // No row is written here. The site posts the lead to the dashboard, which
  // owns the record and every follow-up that comes off it.
  return { ok: true, eventId: event.getId() };
}
