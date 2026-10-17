const DEFAULT_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1551998418816073749/MDiABK7BH0xQU1XoqJE-fva9EDU3Zk4phMD7rNUg5pddkQZRlktsY3BrNS2UHwIW-585";

export const DISCORD_WEBHOOK_URL =
  import.meta.env.VITE_DISCORD_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

/**
 * Posts a raw Discord embed. Never throws.
 *
 * @param {object} embed
 * @param {object} [opts]
 * @param {string} [opts.username]
 * @param {string} [opts.url] - override the webhook, for events that belong
 *   in their own channel
 * @param {string} [opts.content] - message text above the embed; this is
 *   where a mention has to go, since embeds don't trigger notifications
 */
export async function postDiscordEmbed(embed, { username, url, content } = {}) {
  try {
    await fetch(url || DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        content,
        embeds: [embed],
        allowed_mentions: content?.includes("@everyone")
          ? { parse: ["everyone"] }
          : undefined,
      }),
    });
  } catch (err) {
    console.error("Discord log failed:", err);
  }
}


