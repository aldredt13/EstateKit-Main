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

/**
 * Fire-and-forget embed post that survives page unload.
 *
 * Sent as multipart/form-data with a `payload_json` part: that content type is
 * CORS-safelisted, so sendBeacon can dispatch it without a preflight it would
 * be unable to perform. A plain fetch here is routinely killed mid-flight when
 * the document goes away.
 */
export function beaconDiscordEmbed(embed, { username } = {}) {
  try {
    const body = new FormData();
    body.append("payload_json", JSON.stringify({ username, embeds: [embed] }));

    if (!navigator.sendBeacon?.(DISCORD_WEBHOOK_URL, body)) {
      postDiscordEmbed(embed, { username });
    }
  } catch {
    postDiscordEmbed(embed, { username });
  }
}

/**
 * Simple event logger — turns a flat {label: value} object into inline
 * embed fields. Used by the booking/registration funnels. See
 * useVisitTracking for the richer engagement-tracking embeds used on the
 * thank-you pages.
 */
export async function logToDiscord(event, data, { username, color = 0x0086ff } = {}) {
  const fields = Object.entries(data).map(([name, value]) => ({
    name,
    value: String(value ?? "—"),
    inline: true,
  }));

  await postDiscordEmbed(
    { title: event, color, fields, timestamp: new Date().toISOString() },
    { username },
  );
}
