/** Shared booking rules and CORS. Mirrors what estatekit-booking.gs used. */

/** "secondary". Discovery calls are written here. */
export const CAL_ID =
  "ac1d5b1bbbf21211adaadcbf04fcd48c8c34cdae4650758e2c8121de18747f40@group.calendar.google.com";

/**
 * Only the booking calendar. The blockers were dropped: they were never
 * shared with the script account, so they read as empty and only produced
 * a warning on every run. Add one back by sharing it first.
 */
export const BUSY_CALENDARS = [CAL_ID];

export const SLOT_MINUTES = 45;
export const GAP_MINUTES = 40;
export const MIN_NOTICE_HOURS = 24;
export const WINDOW_DAYS = 4;
export const DAY_START_HOUR = 9;
export const DAY_END_HOUR = 17; // the last slot must END by this hour
export const WORK_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri
export const OVERFLOW_MAX_DAYS = 14; // how far past WINDOW_DAYS to search if fully booked

/**
 * South Africa and Namibia are both UTC+2 all year with no daylight saving,
 * so a fixed offset is correct here and avoids pulling in a timezone library.
 * This is the one assumption to revisit if the offer ever leaves +02:00.
 */
export const TZ_OFFSET_HOURS = 2;

const ALLOWED_ORIGINS = [
  "https://estatekit.co",
  "https://www.estatekit.co",
  "http://localhost:5173",
];

/**
 * The actual reason for leaving Apps Script: a real CORS header. Apps Script
 * sends none, which is why availability had to be fetched over JSONP.
 */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

/** A yyyy-mm-dd plus minutes-into-day, as a real instant at UTC+2. */
export function localInstant(dayKey: string, minutesIntoDay: number): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(
    Date.UTC(y, m - 1, d, 0, minutesIntoDay) - TZ_OFFSET_HOURS * 3600000,
  );
}

/** The yyyy-mm-dd a given instant falls on, in local (+02:00) terms. */
export function localDayKey(at: Date): string {
  const shifted = new Date(at.getTime() + TZ_OFFSET_HOURS * 3600000);
  return shifted.toISOString().slice(0, 10);
}

export function localDayOfWeek(dayKey: string): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
