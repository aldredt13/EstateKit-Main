/**
 * Posts funnel events to the Google Apps Script web app that backs the
 * tracking sheet. See scripts/estatekit-sheet.gs for the receiving end.
 *
 * Apps Script answers a POST with a 302 to googleusercontent, which no
 * amount of CORS headers will survive — so every call is fire-and-forget:
 * `no-cors` for live posts, sendBeacon for ones sent as the page unloads.
 * A plain-text body keeps both off the preflight path.
 */

const DEFAULT_SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzSvn6zpdwiyfiEcOo93uyHsDfIp9o3edJXJ90yRj1PqXYkrBJ9qFZsrCdJ7PiGw55n5w/exec";

export const SHEETS_ENDPOINT =
  import.meta.env.VITE_SHEETS_ENDPOINT || DEFAULT_SHEETS_ENDPOINT;

function send(type, payload, keepalive) {
  if (!SHEETS_ENDPOINT) return;

  try {
    fetch(SHEETS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      keepalive,
      body: JSON.stringify({ type, ...payload }),
    }).catch(() => {});
  } catch {
    /* tracking must never break the funnel */
  }
}

export function postToSheet(type, payload) {
  send(type, payload, false);
}

/**
 * Same payload, but survives the document going away.
 *
 * This used `navigator.sendBeacon` and silently delivered nothing — Apps
 * Script answers with a cross-origin 302, which beacons don't carry through.
 * `keepalive` is the modern equivalent and uses the exact fetch path that the
 * other events already prove works against this endpoint.
 */
export function beaconToSheet(type, payload) {
  send(type, payload, true);
}
