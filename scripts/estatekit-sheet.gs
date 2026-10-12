/**
 * EstateKit reporting tabs — Traffic counters and the daily KPI rollup.
 * =====================================================================
 * Paste this alongside estatekit-booking.gs in the same Apps Script project.
 *
 * estatekit-booking.gs owns doGet, doPost and the Closer tab. This file owns
 * only Traffic and KPIs, and must not declare doGet or doPost — two copies in
 * one project is a silent conflict where whichever loads last wins.
 *
 * Setup order:
 *   1. setupBookingSheet()   (in estatekit-booking.gs) — builds Closer
 *   2. setupReporting()      (here)                    — builds Traffic + KPIs
 *   3. Deploy > Manage deployments > Edit > New version
 */

var TRAFFIC = "Traffic";
var KPIS = "KPIs";
var DAYS = 120;

var TRAFFIC_HEADERS = [
  "Date", "Pageviews", "Form starts", "Applications", "Drop-offs",
];

/**
 * Our funnel end to end. Every rate is the conversion between two adjacent
 * steps, so a bad number points at the exact stage that caused it.
 *
 * No spend, cost-per or ROAS columns: Meta Ads Manager owns spend and already
 * computes cost per result against it. Duplicating it here means typing the
 * number in twice and trusting whichever copy was updated last.
 */
var KPI_HEADERS = [
  "Date",
  "Pageviews", "Form starts", "Start rate",
  "Applications", "Completion rate",
  "Qualified", "Qualified %", "Avg score",
  "Booked", "Booked % of qual.",
  "Reached", "Showed", "Show rate",
  "Closed", "Close rate",
  "Revenue",
];

// ── Traffic counters (called from estatekit-booking.gs) ────────────────────

/** Adds 1 to a counter on today's Traffic row, creating the row if needed. */
function bumpTraffic(column, amount) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TRAFFIC);
  if (!sheet) return;

  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  var last = sheet.getLastRow();
  var row = 0;

  if (last >= 2) {
    var dates = sheet.getRange(2, 1, last - 1, 1).getDisplayValues();
    for (var i = 0; i < dates.length; i++) {
      if (dates[i][0] === today) { row = i + 2; break; }
    }
  }
  if (!row) {
    row = last + 1;
    sheet.getRange(row, 1).setValue(today);
  }

  var cell = sheet.getRange(row, column);
  cell.setValue((Number(cell.getValue()) || 0) + (amount || 1));
}

// ── Setup ──────────────────────────────────────────────────────────────────

function setupReporting() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  buildTraffic(ss);
  buildKpis(ss);
  SpreadsheetApp.getUi().alert(
    "Traffic and KPIs rebuilt. Now: Deploy > Manage deployments > Edit > New version.",
  );
}

function buildTraffic(ss) {
  var sheet = ss.getSheetByName(TRAFFIC) || ss.insertSheet(TRAFFIC);
  sheet.clear();

  sheet.getRange(1, 1, 1, TRAFFIC_HEADERS.length).setValues([TRAFFIC_HEADERS])
    .setFontWeight("bold").setBackground("#1F223C").setFontColor("#FFFFFF")
    .setWrap(true).setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 40);
  sheet.setColumnWidth(1, 95);
  for (var c = 2; c <= TRAFFIC_HEADERS.length; c++) sheet.setColumnWidth(c, 100);

  var tz = ss.getSpreadsheetTimeZone();
  var today = new Date();
  var rows = [];
  for (var i = 0; i < DAYS; i++) {
    var d = new Date(today.getTime() - i * 86400000);
    rows.push([Utilities.formatDate(d, tz, "yyyy-MM-dd")]);
  }
  sheet.getRange(2, 1, rows.length, 1).setValues(rows);

  // Applications is derived — it already lives on Closer.
  for (var r = 2; r < 2 + DAYS; r++) {
    sheet.getRange(r, 4).setFormula(
      '=COUNTIFS(Closer!$A:$A,">="&A' + r + ',Closer!$A:$A,"<"&A' + r + '+1)');
  }
  sheet.getRange(2, 2, DAYS, TRAFFIC_HEADERS.length - 1).setNumberFormat("0");
}

function buildKpis(ss) {
  var sheet = ss.getSheetByName(KPIS) || ss.insertSheet(KPIS, 0);
  sheet.clear();

  sheet.getRange(1, 1, 1, KPI_HEADERS.length).setValues([KPI_HEADERS])
    .setFontWeight("bold").setBackground("#1F223C").setFontColor("#FFFFFF")
    .setWrap(true).setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  sheet.setRowHeight(1, 46);

  var tz = ss.getSpreadsheetTimeZone();
  var today = new Date();
  var rows = [];
  for (var i = 0; i < DAYS; i++) {
    var d = new Date(today.getTime() - i * 86400000);
    rows.push([Utilities.formatDate(d, tz, "yyyy-MM-dd")]);
  }
  sheet.getRange(2, 1, rows.length, 1).setValues(rows);

  for (var r = 2; r < 2 + DAYS; r++) writeKpiFormulas(sheet, r);

  sheet.getRange(2, 17, DAYS, 1).setNumberFormat("R#,##0");

  var pct = [4, 6, 8, 11, 14, 16];
  for (var p = 0; p < pct.length; p++) {
    sheet.getRange(2, pct[p], DAYS, 1).setNumberFormat("0.0%");
  }

  sheet.setColumnWidth(1, 95);
  for (var c = 2; c <= KPI_HEADERS.length; c++) sheet.setColumnWidth(c, 95);
}

/**
 * Closer columns referenced: A booked-at timestamp, B appointment time,
 * H score, I qualified, K reached, L showed, M outcome, N deal value.
 */
function writeKpiFormulas(sheet, r) {
  var d = "A" + r;
  var views = "B" + r;
  var starts = "C" + r;
  var apps = "E" + r;
  var qualified = "G" + r;
  var booked = "J" + r;
  var showed = "M" + r;
  var closed = "O" + r;

  // Column A holds a full timestamp, so a day is a half-open range.
  var onDay =
    'Closer!$A:$A,">="&' + d + ',Closer!$A:$A,"<"&' + d + "+1";

  var fromTraffic = function (col) {
    return "=IFERROR(SUMIFS(Traffic!$" + col + ":$" + col +
      ",Traffic!$A:$A," + d + "),0)";
  };
  var safe = function (num, den) {
    return '=IFERROR(IF(' + den + '=0,"",' + num + "/" + den + '),"")';
  };
  var countWhere = function (col, test) {
    return "=COUNTIFS(" + onDay + ",Closer!$" + col + ":$" + col +
      "," + test + ")";
  };

  sheet.getRange(r, 2).setFormula(fromTraffic("B"));
  sheet.getRange(r, 3).setFormula(fromTraffic("C"));
  sheet.getRange(r, 4).setFormula(safe(starts, views));

  sheet.getRange(r, 5).setFormula("=COUNTIFS(" + onDay + ")");
  sheet.getRange(r, 6).setFormula(safe(apps, starts));

  sheet.getRange(r, 7).setFormula(countWhere("I", '"Yes"'));
  sheet.getRange(r, 8).setFormula(safe(qualified, apps));
  sheet.getRange(r, 9).setFormula(
    '=IFERROR(IF(COUNTIFS(' + onDay + ',Closer!$H:$H,">0")=0,"",' +
    'AVERAGEIFS(Closer!$H:$H,' + onDay + ',Closer!$H:$H,">0")),"")');

  // A booked lead is one with an appointment time; a drop-off leaves B blank.
  sheet.getRange(r, 10).setFormula(countWhere("B", '"<>"'));
  sheet.getRange(r, 11).setFormula(safe(booked, qualified));

  sheet.getRange(r, 12).setFormula(countWhere("K", '"Yes"'));
  sheet.getRange(r, 13).setFormula(countWhere("L", '"Yes"'));
  sheet.getRange(r, 14).setFormula(safe(showed, booked));

  sheet.getRange(r, 15).setFormula(countWhere("M", '"Won"'));
  sheet.getRange(r, 16).setFormula(safe(closed, showed));

  sheet.getRange(r, 17).setFormula(
    "=SUMIFS(Closer!$N:$N," + onDay + ',Closer!$M:$M,"Won")');
}
