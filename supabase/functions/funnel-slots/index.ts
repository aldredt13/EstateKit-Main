import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { freeBusy } from "../_shared/google.ts";
import {
  BUSY_CALENDARS,
  DAY_END_HOUR,
  DAY_START_HOUR,
  GAP_MINUTES,
  MIN_NOTICE_HOURS,
  SLOT_MINUTES,
  WINDOW_DAYS,
  WORK_DAYS,
  corsHeaders,
  json,
  localDayKey,
  localDayOfWeek,
  localInstant,
} from "../_shared/config.ts";

/**
 * Live availability: the working grid, minus anything busy on Kieran's three
 * Google calendars, minus anything already in funnel.bookings.
 *
 * Both subtractions matter. Google covers events booked by hand or in a
 * personal calendar; the table covers the gap between an event being written
 * here and Google reflecting it.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const now = new Date();
    const earliest = now.getTime() + MIN_NOTICE_HOURS * 3600000;
    const horizon = new Date(now.getTime() + WINDOW_DAYS * 86400000);

    const [google, booked] = await Promise.all([
      freeBusy(BUSY_CALENDARS, now, horizon),
      existingBookings(now, horizon),
    ]);

    // A calendar the service account cannot read reports as entirely free,
    // which would let a slot be sold over a real appointment. Refuse rather
    // than hand back availability we know is wrong.
    if (google.unreadable.length) {
      return json(req, {
        ok: false,
        error:
          "Calendar not readable, so availability cannot be trusted. Share it " +
          "with the service account.",
        unreadable: google.unreadable,
        slots: {},
      }, 503);
    }

    const busy = [...google.busy, ...booked];
    const slots: Record<string, string[]> = {};

    for (let day = 0; day <= WINDOW_DAYS; day++) {
      const dayKey = localDayKey(new Date(now.getTime() + day * 86400000));
      if (!WORK_DAYS.includes(localDayOfWeek(dayKey))) continue;

      const open: string[] = [];
      const lastStart = DAY_END_HOUR * 60 - SLOT_MINUTES;

      for (
        let m = DAY_START_HOUR * 60;
        m <= lastStart;
        m += SLOT_MINUTES + GAP_MINUTES
      ) {
        const start = localInstant(dayKey, m);
        const end = new Date(start.getTime() + SLOT_MINUTES * 60000);

        if (start.getTime() < earliest) continue;
        if (start > horizon) continue;
        if (overlaps(start.getTime(), end.getTime(), busy)) continue;

        open.push(start.toISOString());
      }

      if (open.length) slots[dayKey] = open;
    }

    return json(req, { ok: true, slots });
  } catch (err) {
    console.error("funnel-slots failed:", err);
    return json(req, { ok: false, error: String(err), slots: {} }, 500);
  }
});

async function existingBookings(from: Date, to: Date) {
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "funnel" } },
  );

  const { data, error } = await db
    .from("bookings")
    .select("starts_at, ends_at")
    .neq("status", "cancelled")
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString());

  if (error) throw new Error(`Reading bookings failed: ${error.message}`);

  return (data ?? []).map((b) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }));
}

function overlaps(
  start: number,
  end: number,
  busy: { start: number; end: number }[],
): boolean {
  return busy.some((b) => start < b.end && end > b.start);
}
