import { DISCORD_WEBHOOK_URL, postDiscordEmbed } from "./discord";

/**
 * Activity-feed cards, shaped like the EstateKit lead notifications: a status
 * title, a coloured left edge that tells you the event at a glance, and the
 * detail as inline fields rather than a paragraph.
 *
 * Bookings go to their own channel and ping, because they're the only event
 * anyone needs to act on immediately.
 */

const BOOKINGS_WEBHOOK =
  "https://discord.com/api/webhooks/1559251256273276939/LfnomQcmfdc4tkyliaRFmgb--lnR0v36Hr5LxkOS1Mh735KiYClhZG0naByP_-Am1eWH";

export const ACTIVITY = {
  started: { title: "▶️ Started the form", color: 0x3b82f6 },
  reached: { title: "🔥 Reached contact details", color: 0xf59e0b },
  booked: { title: "🌱 New booking", color: 0x22c55e },
  disqualified: { title: "🚫 Lead disqualified", color: 0xef4444 },
  dropped: { title: "🚪 Did not book", color: 0x6b7280 },
};

/**
 * @param {string} kind - key of ACTIVITY
 * @param {object} opts
 * @param {string} opts.who - name shown above the title
 * @param {Record<string,string>} [opts.fields] - rendered as inline columns
 * @param {string} [opts.note] - full-width detail under the fields
 * @param {string} [opts.link]
 */
export function postActivity(kind, { who, fields = {}, note, link } = {}) {
  const meta = ACTIVITY[kind] || ACTIVITY.started;

  const embedFields = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([name, value]) => ({ name, value: String(value), inline: true }));

  if (note) embedFields.push({ name: "Detail", value: note, inline: false });
  if (link) embedFields.push({ name: "Link", value: link, inline: false });

  const embed = {
    author: { name: who ? `${who} · EstateKit` : "EstateKit" },
    title: meta.title,
    color: meta.color,
    fields: embedFields,
    footer: { text: `EstateKit Activity${who ? ` · ${who}` : ""}` },
    timestamp: new Date().toISOString(),
  };

  // Bookings are the one event worth interrupting people for.
  if (kind === "booked") {
    return postDiscordEmbed(embed, { url: BOOKINGS_WEBHOOK, content: "@everyone" });
  }
  return postDiscordEmbed(embed);
}

export { DISCORD_WEBHOOK_URL };
