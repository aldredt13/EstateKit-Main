/**
 * Posts funnel leads into the EstateKit client dashboard.
 *
 * The dashboard is the system of record now, not a spreadsheet. Writing a row
 * into its `leads` table is the whole integration: database triggers there
 * fire the confirmation email to the lead, the WhatsApp ping to Kieran, and
 * the booked-call reminder sequence. Nothing here has to know about any of
 * that, which is the point.
 *
 * The endpoint is public by design, the same posture as the dashboard's own
 * lead pages. It validates the page id and allowlists attribution keys
 * server-side, and the browser never gets database credentials.
 */

const ENDPOINT =
  "https://yfcnsvrhojpysrzqrkdi.supabase.co/functions/v1/estatekit-funnel-lead";

/** The /pitch funnel's lead page, which carries the pipeline and owner. */
const PAGE_ID = "f721d60c-c2a6-4987-854c-6dfafc5b685d";

/** Ad and campaign params worth keeping, read off the landing URL. */
const ATTRIBUTION_KEYS = [
  "ad_id",
  "adset_id",
  "campaign_id",
  "ad_name",
  "campaign_name",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
];

function readCookie(name) {
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${name}=([^;]*)`),
    );
    return match ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

function readAttribution() {
  try {
    const q = new URLSearchParams(window.location.search);
    const out = {};
    for (const key of ATTRIBUTION_KEYS) {
      const value = q.get(key);
      if (value) out[key] = value;
    }
    if (document.referrer) out.referrer = document.referrer;

    // The Pixel sets these first-party cookies itself once it loads. Server
    // side, the Conversions API send uses them to match the same visitor
    // Meta already has a browser-side event for, which is most of what
    // makes a CAPI event raise match quality rather than just duplicate
    // the client one.
    const fbp = readCookie("_fbp");
    const fbc = readCookie("_fbc") || (q.get("fbclid")
      ? `fb.1.${Date.now()}.${q.get("fbclid")}`
      : undefined);
    if (fbp) out.fbp = fbp;
    if (fbc) out.fbc = fbc;

    return out;
  } catch {
    return {};
  }
}

/**
 * Creates or updates the lead on the dashboard. Never throws: a booking that
 * already has a calendar event must not fail because the CRM write did.
 *
 * @param {object} lead
 * @param {string} lead.name
 * @param {string} lead.phone
 * @param {string} [lead.email]
 * @param {{q: string, a: string}[]} [lead.answers] - qualifying Q&A
 * @param {boolean} [lead.disqualified] - lands as quality "weak"
 * @param {string} [lead.startsAt] - ISO start of the booked call. Omit for
 *   someone who filled the form but never picked a time.
 * @param {string} [lead.engagement] - what they watched, written to the lead's
 *   note. Sent on its own it updates nothing else on the row, so it cannot
 *   reset a booking or re-fire its workflows.
 * @param {boolean} [lead.keepalive] - for sends during page unload
 * @param {string} [lead.metaEventId] - from trackLead()/trackSchedule() in
 *   metaPixel.js. Passed straight through so the server-side Conversions API
 *   send can be deduped against the client-side pixel fire that used the
 *   same ID.
 * @param {"Lead"|"Schedule"} [lead.metaEventName] - which standard event
 *   metaEventId belongs to
 */
export async function submitFunnelLead({
  name,
  phone,
  email,
  answers = [],
  disqualified = false,
  startsAt,
  engagement,
  keepalive = false,
  metaEventId,
  metaEventName,
}) {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive,
      body: JSON.stringify({
        pageId: PAGE_ID,
        name,
        phone,
        email: email || null,
        formAnswers: answers,
        attribution: readAttribution(),
        disqualified,
        startsAt: startsAt || null,
        engagement: engagement || null,
        metaEventId: metaEventId || null,
        metaEventName: metaEventName || null,
        pageUrl: typeof window !== "undefined" ? window.location.href : null,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Dashboard lead write failed:", body?.error || res.status);
      return null;
    }
    return body;
  } catch (err) {
    console.error("Dashboard lead write failed:", err);
    return null;
  }
}

/** Turns the scorer's breakdown into the {q, a} shape the dashboard stores. */
export function toFormAnswers(breakdown = []) {
  return breakdown
    .filter((row) => row?.question && row?.answer)
    .map((row) => ({ q: String(row.question), a: String(row.answer) }));
}
