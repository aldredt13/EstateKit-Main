/**
 * EstateKit pre-call emails — sent from kieran@estatekit.co.
 * =====================================================================
 * Paste alongside estatekit-booking.gs and estatekit-sheet.gs, then run
 * installEmailTrigger() once. After that an hourly trigger does the work.
 *
 * GmailApp, not MailApp: GmailApp sends through Gmail proper, so every email
 * lands in the Sent folder and a reply threads under it normally. MailApp
 * delivers fine but leaves no trace in the mailbox, which defeats the point.
 *
 * The copy lives in a Google Doc, not in here. Kieran edits the Doc and the
 * next send picks it up, with no redeploy. The Doc is the source of truth.
 *
 * IMPORTANT: email goes out as whoever authorised this script. Check with
 * whoAmI() below. If it says anything other than kieran@estatekit.co, the
 * mail will come from that address instead, capped at 100 recipients/day
 * instead of 1,500.
 */

// ── Settings ───────────────────────────────────────────────────────────────

/** The Doc holding the copy. Must be readable by the authorising account. */
var EMAIL_DOC_ID = "1RYZQgt8DY00DZiZPi1ATKaeNivUufHro4XR0BXpFOrc";

var FROM_NAME = "Kieran | EstateKit";
var VIDEOS_LINK = "https://estatekit.co/thank-you";
var CALL_LINK = "SET ME"; // Meet or Zoom room used for the discovery call

/**
 * Calendar-only page, not the pitch page: a lead moving a time has already
 * applied and already passed the score, so sending them back through the
 * questions is friction for no gain. Their details ride along in the query
 * string so /rebook shows nothing but the calendar.
 */
var REBOOK_LINK = "https://estatekit.co/rebook";

/** Breakout videos, in the order we'd rather they watched them. */
var BREAKOUT_NAMES = [
  "what you do?",
  "another agency?",
  "cost?",
  "if it fails?",
  "my area?",
];

/** Closer column holding the comma-list of emails already sent. */
var SENT_COL = 16;

// ── Entry point (hourly trigger) ───────────────────────────────────────────

/** Run once by hand to install the schedule. Safe to re-run. */
function installEmailTrigger() {
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === "sendPreCallEmails") {
      ScriptApp.deleteTrigger(existing[i]);
    }
  }
  ScriptApp.newTrigger("sendPreCallEmails").timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert(
    "Hourly email trigger installed. Sending as: " + whoAmI(),
  );
}

/** The address every email will actually come from. */
function whoAmI() {
  return Session.getEffectiveUser().getEmail();
}

/**
 * Walks Closer and sends whatever is due. Each email is stamped in SENT_COL
 * the moment it goes out, so a trigger that overlaps or re-runs can't send
 * the same thing twice.
 */
function sendPreCallEmails() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Closer");
  if (!sheet) return;

  var last = sheet.getLastRow();
  if (last < 2) return;

  var templates = loadEmailTemplates();
  if (!templates) {
    notifyFailure("emails/doc", "Could not read the email copy Doc.");
    return;
  }

  var rows = sheet.getRange(2, 1, last - 1, SENT_COL).getValues();
  var now = new Date().getTime();
  var sentCount = 0;

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var bookedAt = row[0];
    var start = row[1];
    var email = String(row[4] || "").trim();
    if (!email || !start || !(start instanceof Date)) continue;

    var already = String(row[SENT_COL - 1] || "");
    var hoursOut = (start.getTime() - now) / 3600000;
    var bookedHoursBefore = bookedAt instanceof Date
      ? (start.getTime() - bookedAt.getTime()) / 3600000
      : 999;
    // No no-show email by design: a missed call is a phone call, not an
    // automated nudge. Nothing fires once the appointment time has passed.
    var due = 0;
    if (bookedAt instanceof Date && (now - bookedAt.getTime()) / 60000 <= 70) {
      due = 1;
    } else if (hoursOut >= 42 && hoursOut <= 54 && bookedHoursBefore > 54) {
      // Skipped entirely for anyone who booked inside the window.
      due = 2;
    } else if (hoursOut >= 18 && hoursOut <= 30) {
      due = 3;
    } else if (hoursOut >= 1 && hoursOut <= 3) {
      due = 4;
    }

    if (!due) continue;
    if (already.split(",").indexOf(String(due)) !== -1) continue;
    if (!templates[due]) continue;

    try {
      var lead = {
        name: firstName(row[2]),
        fullName: String(row[2] || ""),
        email: email,
        phone: String(row[3] || ""),
        start: start,
        unwatched: pickUnwatched(row[9]),
      };
      GmailApp.sendEmail(email, fill(templates[due].subject, lead), fill(templates[due].body, lead), {
        name: FROM_NAME,
      });

      sheet.getRange(i + 2, SENT_COL)
        .setValue(already ? already + "," + due : String(due));
      sentCount++;
    } catch (err) {
      notifyFailure("emails/send-" + due, err, email);
    }
  }

  return sentCount;
}

// ── Copy, read from the Doc ────────────────────────────────────────────────

/**
 * Parses the Doc into { 1: {subject, body}, 2: {...}, ... }.
 *
 * Keys off the EMAIL n / SUBJECT: / BODY: headings rather than position, so
 * Kieran can reword freely as long as those lines survive. Cached for an
 * hour because the Doc is read on every trigger run.
 */
function loadEmailTemplates() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get("email_copy");
  if (hit) return JSON.parse(hit);

  var text;
  try {
    text = DocumentApp.openById(EMAIL_DOC_ID).getBody().getText();
  } catch (err) {
    return null;
  }

  var out = {};
  var blocks = text.split(/EMAIL\s+(\d)\s*\n/);

  // split() yields [preamble, "1", block, "2", block, ...]
  for (var i = 1; i < blocks.length; i += 2) {
    var n = blocks[i];
    var block = blocks[i + 1] || "";

    var subjectMatch = block.match(/SUBJECT:\s*(.+)/);
    var bodyIndex = block.indexOf("BODY:");
    if (!subjectMatch || bodyIndex === -1) continue;

    var body = block.slice(bodyIndex + 5);
    // Everything up to the next section divider belongs to this email.
    body = body.split(/\n=====/)[0].replace(/^\s+|\s+$/g, "");

    out[n] = { subject: subjectMatch[1].replace(/^\s+|\s+$/g, ""), body: body };
  }

  if (!Object.keys(out).length) return null;
  cache.put("email_copy", JSON.stringify(out), 3600);
  return out;
}

/** Clears the copy cache so the next run re-reads the Doc immediately. */
function refreshEmailCopy() {
  CacheService.getScriptCache().remove("email_copy");
  var t = loadEmailTemplates();
  SpreadsheetApp.getUi().alert(
    t ? "Loaded " + Object.keys(t).length + " emails from the Doc."
      : "Could not read the Doc. Check EMAIL_DOC_ID and that " + whoAmI() +
        " has access to it.",
  );
}

// ── Merge fields ───────────────────────────────────────────────────────────

function fill(template, lead) {
  var tz = Session.getScriptTimeZone();
  return String(template)
    .replace(/\[name\]/g, lead.name)
    .replace(/\[day\]/g, Utilities.formatDate(lead.start, tz, "EEEE"))
    .replace(/\[time\]/g, timeLabel(lead.start, tz))
    .replace(/\[call link\]/g, CALL_LINK)
    .replace(/\[rebook link\]/g, rebookUrl(lead))
    .replace(/\[link\]/g, VIDEOS_LINK)
    .replace(/\[unwatched\]/g, lead.unwatched);
}

/**
 * Carries their details so /rebook renders the calendar with no form. Must
 * run before [link] is substituted, since [rebook link] contains it.
 */
function rebookUrl(lead) {
  return REBOOK_LINK +
    "?name=" + encodeURIComponent(lead.fullName || "") +
    "&email=" + encodeURIComponent(lead.email || "") +
    "&phone=" + encodeURIComponent(lead.phone || "");
}

/** "2:30pm", not "14:30". */
function timeLabel(date, tz) {
  return Utilities.formatDate(date, tz, "h:mma").toLowerCase();
}

function firstName(full) {
  return String(full || "there").replace(/^\s+/, "").split(/\s+/)[0];
}

/**
 * The breakout video this lead did NOT watch, for email 3.
 *
 * The engagement column holds the terse "5s · cost?, my area?" string, so a
 * name missing from it was never played. Falls back to the first in
 * BREAKOUT_NAMES when they watched nothing, which is the one we'd pick anyway.
 */
function pickUnwatched(engagement) {
  var seen = String(engagement || "").toLowerCase();
  for (var i = 0; i < BREAKOUT_NAMES.length; i++) {
    if (seen.indexOf(BREAKOUT_NAMES[i].toLowerCase()) === -1) {
      return BREAKOUT_NAMES[i];
    }
  }
  return BREAKOUT_NAMES[0];
}

// ── Test helpers ───────────────────────────────────────────────────────────

/**
 * Sends all five to you, with fake lead data, so you can read them in your
 * own inbox before a single real lead gets one. Costs 5 of the daily quota.
 */
function previewAllEmails() {
  var templates = loadEmailTemplates();
  if (!templates) {
    SpreadsheetApp.getUi().alert("Could not read the Doc.");
    return;
  }

  var lead = {
    name: "Thabo",
    start: new Date(new Date().getTime() + 26 * 3600000),
    unwatched: "if it fails?",
  };

  var to = whoAmI();
  var keys = Object.keys(templates).sort();
  for (var i = 0; i < keys.length; i++) {
    GmailApp.sendEmail(
      to,
      "[PREVIEW " + keys[i] + "] " + fill(templates[keys[i]].subject, lead),
      fill(templates[keys[i]].body, lead),
      { name: FROM_NAME },
    );
  }

  SpreadsheetApp.getUi().alert(
    "Sent " + keys.length + " previews to " + to +
    ". Remaining daily quota: " + MailApp.getRemainingDailyQuota(),
  );
}
