/**
 * Lead intake for the estatekit.co /pitch funnel.
 *
 * DEPLOYS TO THE AGENT APP PROJECT (yfcnsvrhojpysrzqrkdi), not the marketing
 * site's own project. It lives in this repo because the caller does.
 *
 * Why this exists rather than reusing public-submit-lead: that function
 * hardcodes stage "New Lead" and accepts no call time, and it is the intake
 * for every client lead page in the product. Extending it to carry a booking
 * would put this funnel in the blast radius of their whole business, so this
 * is a separate door into the same table.
 *
 * Everything downstream is already built. An insert into leads fires
 * enqueue_workflows, enqueue_automations, queue_lead_confirmation and
 * record_lead_event, so the confirmation email, the agent ping and the
 * reminder sequence all run without this function knowing they exist.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "content-type,authorization,apikey,x-client-info",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

/**
 * track_appointment() is a BEFORE trigger that nulls appointment_at unless
 * the stage is Booked and next_label starts with "appt", copying the value
 * from reminder_at. Setting appointment_at directly does nothing, so the
 * prefix here is load-bearing rather than cosmetic.
 */
const BOOKED_LABEL = "appt - 45 min discovery call";

interface Body {
  pageId?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  formAnswers?: { q: string; a: string }[];
  attribution?: Record<string, unknown>;
  /** Below the PPRA/volume threshold. Lands as quality "weak". */
  disqualified?: boolean;
  /** ISO start of the booked call. Absent means they never picked a time. */
  startsAt?: string | null;
  /**
   * What they watched before the call, for the lead's note. Sent on its own
   * from the thank-you page, so a note-only call updates nothing else.
   */
  engagement?: string | null;
}

/** Marks the line this function owns, so Kieran's own notes survive. */
const ENGAGEMENT_MARKER = "Watched before the call:";

function mergeNote(existing: string, engagement: string): string {
  const kept = String(existing || "")
    .split("\n")
    .filter((line) => !line.startsWith(ENGAGEMENT_MARKER))
    .join("\n")
    .trim();

  const line = `${ENGAGEMENT_MARKER} ${engagement}`;
  return kept ? `${line}\n${kept}` : line;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  if (!body.pageId || !name || !phone) {
    return json({ error: "pageId, name and phone are required" }, 400);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: page } = await db
    .from("lead_pages")
    .select("id, agent_id, pipeline_id")
    .eq("id", body.pageId)
    .maybeSingle();

  if (!page) return json({ error: "page not found" }, 404);

  // Same allowlist as public-submit-lead: this is visitor-supplied and lands
  // in a jsonb column an operator reads, so an unbounded query string must
  // not end up in the row.
  const ALLOWED = [
    "ad_id", "adset_id", "campaign_id", "ad_name", "campaign_name",
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "fbclid", "gclid", "referrer", "fbp", "fbc",
  ];
  const attribution: Record<string, string> = {};
  for (const key of ALLOWED) {
    const v = body.attribution?.[key];
    if (typeof v === "string" && v.trim()) attribution[key] = v.slice(0, 200);
  }

  const booked = typeof body.startsAt === "string" && body.startsAt.length > 0
    ? new Date(body.startsAt)
    : null;
  if (booked && isNaN(booked.getTime())) {
    return json({ error: "startsAt is not a valid date" }, 400);
  }

  const row = {
    agent_id: page.agent_id,
    pipeline_id: page.pipeline_id,
    source_page_id: page.id,
    name,
    phone,
    email: body.email?.trim() || null,
    form_answers: body.formAnswers ?? [],
    attribution,
    fb_ad_id: attribution.ad_id ?? null,
    quality: body.disqualified ? "weak" : "good",
    due: true,
    ...(booked
      ? {
        stage: "Booked",
        next_label: BOOKED_LABEL,
        reminder_at: booked.toISOString(),
        // Drives the "Call time" workflows: the reminder email to the lead,
        // the 15-minute warning, and the missed-call check.
        call_at: booked.toISOString(),
      }
      : {
        stage: "New Lead",
        next_label: "Filled the form, never picked a time",
      }),
  };

  // Someone who abandons and later comes back to book is one person, so the
  // second visit updates the first row rather than making a second card.
  //
  // The match is done here rather than in the query because the stored phone
  // keeps whatever punctuation the lead typed: a SQL LIKE compares against
  // "+27 83 000 0002" with its spaces intact and never lines up with a
  // digits-only needle. This pipeline holds only the /pitch funnel, so
  // scanning it is cheap.
  const tail = (value: string) => value.replace(/[^0-9]/g, "").slice(-9);
  const needle = tail(phone);

  const { data: candidates } = await db
    .from("leads")
    .select("id, phone, note")
    .eq("pipeline_id", page.pipeline_id)
    .order("created_at", { ascending: false })
    .limit(2000);

  const existing = needle.length >= 7
    ? (candidates ?? []).find((c) => tail(String(c.phone ?? "")) === needle)
    : undefined;

  // An engagement report arrives after the call is already booked, so it must
  // only touch the note. Rewriting the row would reset the stage and re-fire
  // the workflows the booking already started.
  if (body.engagement) {
    if (!existing) return json({ error: "no matching lead" }, 404);

    const { error } = await db
      .from("leads")
      .update({ note: mergeNote(String(existing.note ?? ""), body.engagement) })
      .eq("id", existing.id);

    if (error) return json({ error: error.message }, 500);
    return json({ id: existing.id, updated: true, noteOnly: true });
  }

  const result = existing
    ? await db.from("leads").update(row).eq("id", existing.id).select("id")
      .single()
    : await db.from("leads").insert(row).select("id").single();

  if (result.error || !result.data) {
    console.error("funnel lead write failed", result.error);
    return json({ error: result.error?.message ?? "write failed" }, 500);
  }

  return json({
    id: result.data.id,
    updated: Boolean(existing),
    booked: Boolean(booked),
  });
});
