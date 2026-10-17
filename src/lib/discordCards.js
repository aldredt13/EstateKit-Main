import { DISCORD_WEBHOOK_URL, postDiscordEmbed } from "./discord";

/**
 * Activity-feed cards, shaped like the ones the client dashboard already
 * posts for agents: an author line naming the funnel, an emoji title for the
 * step, a coloured left edge you can read at a glance, then Pipeline, Source
 * and Page as inline columns with the link underneath.
 *
 * Matching that layout matters because these land in the same feed. A card
 * shaped differently reads as coming from a different system.
 *
 * Bookings go to their own channel and ping, because they're the only event
 * anyone needs to act on immediately.
 */

const BOOKINGS_WEBHOOK =
  "https://discord.com/api/webhooks/1559251256273276939/LfnomQcmfdc4tkyliaRFmgb--lnR0v36Hr5LxkOS1Mh735KiYClhZG0naByP_-Am1eWH";

/** What the dashboard calls this funnel, shown on every card. */
const FUNNEL = {
  owner: "EstateKit · Kieran Ouseb",
  pipeline: "EstateKit Agents",
  link: "https://estatekit.co",
};

/**
 * Readable names for the Page column. The path alone is fine to read but
 * "/pitch/res" tells you less at a glance than "Pitch (RES)" when a dozen
 * cards are stacked up, and the whole point of the column is skimming.
 */
const PAGE_NAMES = {
  "/": "Home",
  "/pitch": "Pitch",
  "/pitch-vsl": "Pitch (VSL)",
  "/pitch/res": "Pitch (RES)",
  "/thank-you": "Thank you",
  "/rebook": "Rebook",
  "/results": "Results",
  "/webinar": "Webinar",
  "/training": "Training",
  "/training-vsl": "Training (VSL)",
  "/training/thank-you": "Training thank you",
  "/juani-results": "Juani results",
  "/sakhile-results": "Sakhile results",
};

function pagePath() {
  try {
    return window.location.pathname.replace(/\/+$/, "") || "/";
  } catch {
    return "/";
  }
}

/** Which page the visitor is on right now, named rather than pathed. */
export function currentPage() {
  const path = pagePath();
  return PAGE_NAMES[path] || path;
}

export const ACTIVITY = {
  viewed: { title: "👀 Landing page viewed", color: 0x94a3b8 },
  started: { title: "▶️ Started the form", color: 0x3b82f6 },
  reached: { title: "✍️ Reached contact details", color: 0xf59e0b },
  played: { title: "🎬 Played a video", color: 0x8b5cf6 },
  booked: { title: "🌱 Booked a call", color: 0x22c55e },
  disqualified: { title: "🚫 Lead disqualified", color: 0xef4444 },
  dropped: { title: "🚪 Did not book", color: 0x6b7280 },
};

/** Where the traffic came from, read off the landing URL. */
function trafficSource() {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("ad_id") || q.get("fbclid")) return "Facebook ad";
    const utm = q.get("utm_source");
    if (utm) return utm;
    if (document.referrer) {
      return new URL(document.referrer).hostname.replace(/^www\./, "");
    }
    return "Direct";
  } catch {
    return "Direct";
  }
}

/**
 * @param {string} kind - key of ACTIVITY
 * @param {object} opts
 * @param {string} [opts.who] - the lead, when we know who they are yet
 * @param {Record<string,string>} [opts.fields] - extra inline columns
 * @param {string} [opts.note] - full-width detail under the fields
 * @param {string} [opts.link] - e.g. a WhatsApp link to the lead
 */
export function postActivity(kind, { who, fields = {}, note, link } = {}) {
  const meta = ACTIVITY[kind] || ACTIVITY.started;

  // Pipeline / Source / Page first, so every card in the feed lines up.
  const embedFields = [
    { name: "Pipeline", value: FUNNEL.pipeline, inline: true },
    { name: "Source", value: trafficSource(), inline: true },
    { name: "Page", value: currentPage(), inline: true },
  ];

  for (const [name, value] of Object.entries(fields)) {
    if (value) embedFields.push({ name, value: String(value), inline: true });
  }

  if (note) embedFields.push({ name: "Detail", value: note, inline: false });
  embedFields.push({
    name: "Link",
    value: link || `${FUNNEL.link}${pagePath()}`,
    inline: false,
  });

  const embed = {
    author: { name: who ? `${who} · ${FUNNEL.pipeline}` : FUNNEL.owner },
    title: meta.title,
    color: meta.color,
    fields: embedFields,
    footer: { text: `EstateKit Activity${who ? ` · ${who}` : ""}` },
    timestamp: new Date().toISOString(),
  };

  // A booking goes to both: the activity feed so the funnel reads end to end
  // in one place, and its own channel with a ping because it's the only event
  // anyone has to act on.
  if (kind === "booked") {
    return Promise.all([
      postDiscordEmbed(embed),
      postDiscordEmbed(embed, {
        url: BOOKINGS_WEBHOOK,
        content: "@everyone",
      }),
    ]);
  }
  return postDiscordEmbed(embed);
}

export { DISCORD_WEBHOOK_URL };
