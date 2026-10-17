/**
 * The Apps Script web app, which now does one thing: Google Calendar.
 *
 * It serves availability and writes the event. Leads, emails and reporting
 * all live in the client dashboard, so nothing writes to a spreadsheet any
 * more and there is no POST path left here.
 *
 * Reads go over JSONP because an Apps Script web app sends no
 * Access-Control-Allow-Origin header, so a browser can post to it blind but
 * can never read the reply.
 */

export const SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzSvn6zpdwiyfiEcOo93uyHsDfIp9o3edJXJ90yRj1PqXYkrBJ9qFZsrCdJ7PiGw55n5w/exec";
