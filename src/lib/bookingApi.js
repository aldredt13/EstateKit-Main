import { SHEETS_ENDPOINT } from "./sheets";

/**
 * Booking backend: the Apps Script bound to the tracking sheet, which reads
 * and writes the real Google Calendar.
 *
 * Reads go over JSONP. An Apps Script web app sends no CORS header, so a
 * browser can POST to it blind but can never read the reply — a <script> tag
 * isn't subject to CORS at all, which is the one route that works without
 * standing up a proxy.
 */

let jsonpSeq = 0;

function jsonp(url, { timeout = 12000 } = {}) {
  return new Promise((resolve, reject) => {
    const name = `__ekCb${Date.now()}${jsonpSeq++}`;
    const script = document.createElement("script");

    const cleanup = () => {
      delete window[name];
      script.remove();
      clearTimeout(timer);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Availability request timed out"));
    }, timeout);

    window[name] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Could not reach the booking service"));
    };

    script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${name}`;
    document.head.appendChild(script);
  });
}

/** Local time label for a slot, e.g. "4:30pm" in the visitor's own zone. */
export function timeLabel(iso) {
  return new Date(iso)
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?([AP])M/i, (_, p) => p.toLowerCase() + "m")
    .replace(/\s+/g, "");
}

/**
 * Open slots keyed by date:
 * `{ "2026-10-13": [{ label: "4:30pm", start: "<iso>" }] }`
 */
export async function fetchSlots() {
  if (!SHEETS_ENDPOINT) return {};

  const body = await jsonp(SHEETS_ENDPOINT);
  if (!body?.ok) throw new Error(body?.error || "No availability returned");

  return Object.fromEntries(
    Object.entries(body.slots || {}).map(([date, list]) => [
      date,
      list.map((start) => ({ start, label: timeLabel(start) })),
    ]),
  );
}

/**
 * Writes the booking. The script re-checks the calendar before creating the
 * event, so a slot taken since the list was fetched comes back as an error
 * rather than a double booking.
 */
export async function createBooking(payload) {
  if (!SHEETS_ENDPOINT) throw new Error("Booking is not configured");

  // Readable reply needed here, so this one also goes over JSONP.
  const params = new URLSearchParams({
    action: "book",
    payload: JSON.stringify(payload),
  });
  const body = await jsonp(`${SHEETS_ENDPOINT}?${params}`, { timeout: 20000 });

  if (!body?.ok) throw new Error(body?.error || "Booking failed");
  return body;
}

