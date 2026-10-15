/**
 * EstateKit pre-call emails.
 * =====================================================================
 * Paste alongside estatekit-booking.gs and estatekit-sheet.gs, then:
 *   1. setupEmails()          builds the "Emails" tab and seeds the copy
 *   2. previewAllEmails()     sends all four to yourself
 *   3. installEmailTrigger()  starts the hourly schedule
 *
 * GmailApp, not MailApp: GmailApp sends through Gmail proper, so every email
 * lands in the Sent folder and a reply threads under it. MailApp delivers
 * fine but leaves no trace in the mailbox, which defeats the point.
 *
 * Mail goes out as whoever authorised this script. Run whoAmI() to see which
 * address that is. To send as a different one, add it as a verified
 * "Send mail as" alias on that mailbox and set SEND_AS below.
 *
 * The copy lives on the "Emails" tab of this sheet rather than in a separate
 * document, so there is one place to edit and nothing extra to share.
 */

// ── Settings ───────────────────────────────────────────────────────────────

var EMAIL_TAB = "Emails";
var FROM_NAME = "Kieran | EstateKit";

/**
 * Leave empty to send from the account that owns the script. To send from a
 * different address, add it to that mailbox under Gmail settings > Accounts >
 * "Send mail as", verify it, then put it here.
 */
var SEND_AS = "";

var VIDEOS_LINK = "https://estatekit.co/thank-you";
var REBOOK_LINK = "https://estatekit.co/rebook";

/** The Meet or Zoom room for the call. Email 4 will not send until this is set. */
var CALL_LINK = "SET ME";

/** Breakout videos, in the order we would rather they watched them. */
var BREAKOUT_NAMES = [
  "what you do?",
  "another agency?",
  "cost?",
  "if it fails?",
  "my area?",
];

/** Closer column holding the comma-list of emails already sent. */
var SENT_COL = 16;

// ── Entry point ────────────────────────────────────────────────────────────

/** The address every email will actually come from. */
function whoAmI() {
  return SEND_AS || Session.getEffectiveUser().getEmail();
}

/** Run once to install the schedule. Safe to re-run. */
function installEmailTrigger() {
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === "sendPreCallEmails") {
      ScriptApp.deleteTrigger(existing[i]);
    }
  }
  ScriptApp.newTrigger("sendPreCallEmails").timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert(
    "Hourly email trigger installed.\n\nSending as: " + whoAmI(),
  );
}

/**
 * Walks Closer and sends whatever is due. Each send is stamped in SENT_COL
 * the moment it goes out, so a trigger that overlaps or re-runs cannot send
 * the same thing twice.
 */
function sendPreCallEmails() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEADS);
  if (!sheet) return 0;

  var last = sheet.getLastRow();
  if (last < 2) return 0;

  var templates = loadTemplates();
  if (!templates) {
    notifyFailure("emails/templates",
      "The " + EMAIL_TAB + " tab is missing or empty. Run setupEmails().");
    return 0;
  }

  var rows = sheet.getRange(2, 1, last - 1, SENT_COL).getValues();
  var now = new Date().getTime();
  var sent = 0;

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
      due = 2; // skipped entirely for anyone who booked inside the window
    } else if (hoursOut >= 18 && hoursOut <= 30) {
      due = 3;
    } else if (hoursOut >= 1 && hoursOut <= 3) {
      due = 4;
    }

    if (!due) continue;
    if (already.split(",").indexOf(String(due)) !== -1) continue;

    var t = templates[String(due)];
    if (!t || !t.enabled) continue;

    var lead = {
      name: firstName(row[2]),
      fullName: String(row[2] || ""),
      email: email,
      phone: String(row[3] || ""),
      start: start,
      unwatched: pickUnwatched(row[9]),
    };

    var subject = fill(t.subject, lead);
    var body = fill(t.body, lead);

    // Last line of defence. An unfilled placeholder reaching a lead is worse
    // than a missed send, so the email is held and the gap is reported.
    var bad = unfilled(subject + "\n" + body);
    if (bad) {
      notifyFailure("emails/placeholder-" + due,
        "Email " + due + " held back: it still contains " + bad +
        ". Fix it on the " + EMAIL_TAB + " tab, or set CALL_LINK.");
      continue;
    }

    try {
      var options = { name: FROM_NAME };
      if (SEND_AS) options.from = SEND_AS;
      GmailApp.sendEmail(email, subject, body, options);

      sheet.getRange(i + 2, SENT_COL)
        .setValue(already ? already + "," + due : String(due));
      sent++;
    } catch (err) {
      notifyFailure("emails/send-" + due, err, email);
    }
  }

  return sent;
}

/** Returns the offending placeholder, or empty string when the copy is clean. */
function unfilled(text) {
  if (text.indexOf("SET ME") !== -1) return "SET ME (CALL_LINK is not set)";
  var m = text.match(/\[NEED[^\]]*\]|\[[a-z ]+\]/);
  return m ? m[0] : "";
}

// ── Copy, stored on the Emails tab ─────────────────────────────────────────

var EMAIL_TAB_HEADERS = ["#", "Send when", "On/off", "Subject", "Body"];

function loadTemplates() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMAIL_TAB);
  if (!sheet) return null;

  var last = sheet.getLastRow();
  if (last < 2) return null;

  var rows = sheet.getRange(2, 1, last - 1, 5).getValues();
  var out = {};

  for (var i = 0; i < rows.length; i++) {
    var n = String(rows[i][0]).trim();
    if (!n) continue;
    out[n] = {
      enabled: String(rows[i][2]).trim().toLowerCase() === "on",
      subject: String(rows[i][3] || ""),
      body: String(rows[i][4] || ""),
    };
  }

  return Object.keys(out).length ? out : null;
}

/**
 * Builds the Emails tab and seeds the copy. Email 2 ships switched off: it
 * still carries placeholders for the guarantee KPIs, the cases where it did
 * not work, and the refund rate. Those have to be real before it sends.
 */
function setupEmails() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EMAIL_TAB) || ss.insertSheet(EMAIL_TAB);
  sheet.clear();
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns())
    .clearDataValidations();

  sheet.getRange(1, 1, 1, 5).setValues([EMAIL_TAB_HEADERS])
    .setFontWeight("bold").setBackground("#1F223C").setFontColor("#FFFFFF")
    .setWrap(true).setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 36);

  sheet.getRange(2, 1, 4, 5).setValues([
    ["1", "about 5 min after they book", "on",
     "those 5 videos on the page you just landed on",
     "Hey [name],\n\n" +
     "You probably noticed the page after you booked had five short videos on it. Those aren't there to fill space. Each one answers a question we get asked on almost every call, so we don't spend your 45 minutes on something a two minute video handles better.\n\n" +
     "If you only watch one before [day], watch \"what do you actually do\".\n\n" +
     "The most common thing people get wrong about us is thinking we sell leads. We don't. Running the ad is about 10% of this. The rest is the filter sitting between the ad and your WhatsApp, the questions a nosy browser won't bother answering but someone who is actually selling in six months will.\n\n" +
     "That's the difference between 50 \"what's my house worth\" enquiries and four people who want to sign a mandate.\n\n" +
     "The rest of the videos are here: [link]\n\n" +
     "On [day] we'll go through your actual suburbs and I'll tell you straight if it won't work there.\n\n" +
     "Kieran"],

    ["2", "about 48h before, skipped if booked inside that window", "off",
     "how we make this safe for you, including who it hasn't worked for",
     "Hey [name],\n\n" +
     "You've probably been burned by an agency before. Most agents I speak to have. So instead of sending you another win, here's the other half of the picture.\n\n" +
     "How the guarantee works. At the start we agree on the numbers you need to hit on your side, which is [NEED: KPI 1] and [NEED: KPI 2]. If you hit those and you still haven't made your money back, you get 50% of what you paid us refunded. We agree the numbers before you sign anything so there's nothing to argue about later.\n\n" +
     "Where it hasn't worked. [NEED: two or three real cases and what went wrong]\n\n" +
     "Our refund rate so far: [NEED: number]\n\n" +
     "I'm sending this instead of another testimonial because when you Google an agency you don't go looking for the good reviews. You go looking for the bad ones. I'd rather tell you our worst case myself than have you wonder what I left out.\n\n" +
     "[day] at [time].\n\n" +
     "Kieran"],

    ["3", "about 24h before", "on",
     "the one you skipped",
     "Hey [name],\n\n" +
     "Call's tomorrow at [time].\n\n" +
     "Of the five videos on that page, the one you didn't open was [unwatched]. That's usually the one that matters most, because it's the thing people don't want to ask out loud.\n\n" +
     "It's two minutes: [link]\n\n" +
     "And if you want a second opinion that isn't mine, Juani got 11 listings and one closed deal out of this. Not a huge number, but a real one, from an agent who was in the same position you're in now:\n" +
     "youtube.com/watch?v=vjQp-IXkHpA\n\n" +
     "She's easy to find if you want to check I'm not making it up.\n\n" +
     "See you tomorrow.\n\n" +
     "Kieran"],

    ["4", "about 2h before", "on",
     "[time] today",
     "[name], we're on at [time] today.\n\n" +
     "[call link]\n\n" +
     "Worth having ready: what you're spending on leads at the moment, and how many deals you've got moving right now. Makes the 45 minutes a lot more useful.\n\n" +
     "If you can't make it, pick another time here and we'll send a fresh invite: [rebook link]\n\n" +
     "Or just WhatsApp me on +264 85 287 8236.\n\n" +
     "Kieran"],
  ]);

  sheet.getRange(2, 3, 4, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(["on", "off"], true)
      .setAllowInvalid(false).build());

  sheet.setColumnWidth(1, 40);
  sheet.setColumnWidth(2, 240);
  sheet.setColumnWidth(3, 60);
  sheet.setColumnWidth(4, 320);
  sheet.setColumnWidth(5, 720);
  sheet.getRange(2, 4, 4, 2).setWrap(true).setVerticalAlignment("top");
  sheet.getRange(2, 1, 4, 5).setFontSize(10);

  SpreadsheetApp.getUi().alert(
    "Emails tab built with 4 emails.\n\n" +
    "Email 2 is OFF until you replace the [NEED] placeholders.\n" +
    "Email 4 will not send until CALL_LINK is set in the script.\n\n" +
    "Sending as: " + whoAmI(),
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
    .replace(/\[unwatched\]/g, lead.unwatched)
    .replace(/\[link\]/g, VIDEOS_LINK);
}

/** Carries their details so /rebook shows the calendar with no form. */
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
 * The engagement column holds the terse "5s . cost?, my area?" string, so a
 * name missing from it was never played. Falls back to the first in
 * BREAKOUT_NAMES when they watched nothing, which is the one we would pick.
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

// ── Preview ────────────────────────────────────────────────────────────────

/**
 * Sends every enabled email to you, with fake lead data, so you read them in
 * your own inbox before a real lead does. Costs a few of the daily quota.
 */
function previewAllEmails() {
  var ui = SpreadsheetApp.getUi();
  var templates = loadTemplates();
  if (!templates) {
    ui.alert("No " + EMAIL_TAB + " tab found. Run setupEmails() first.");
    return;
  }

  var lead = {
    name: "Thabo",
    fullName: "Thabo Mokoena",
    email: "thabo@example.com",
    phone: "+27831234567",
    start: new Date(new Date().getTime() + 26 * 3600000),
    unwatched: "if it fails?",
  };

  var to = whoAmI();
  var report = [];

  var keys = Object.keys(templates).sort();
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var t = templates[k];

    if (!t.enabled) {
      report.push(k + ": skipped, switched off");
      continue;
    }

    var subject = fill(t.subject, lead);
    var body = fill(t.body, lead);
    var bad = unfilled(subject + "\n" + body);
    if (bad) {
      report.push(k + ": HELD, contains " + bad);
      continue;
    }

    var options = { name: FROM_NAME };
    if (SEND_AS) options.from = SEND_AS;
    GmailApp.sendEmail(to, "[PREVIEW " + k + "] " + subject, body, options);
    report.push(k + ": sent");
  }

  ui.alert(
    "Previews to " + to + "\n\n" + report.join("\n") +
    "\n\nRemaining quota today: " + MailApp.getRemainingDailyQuota(),
  );
}
