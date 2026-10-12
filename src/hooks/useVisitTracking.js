import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDeviceInfo,
  getLocation,
  formatDuration,
  getFlagEmoji,
  formatClicks,
  scoreEngagement,
} from "../lib/analytics";
import { postDiscordEmbed } from "../lib/discord";
import { beaconToSheet, postToSheet } from "../lib/sheets";

const CHECKPOINTS = [30, 60, 120, 180, 300]; // seconds

/**
 * Cal.com's success redirect uses `email` / `attendeePhoneNumber`, not the
 * `attendeeEmail` / `phone` this originally looked for — which silently left
 * the email null, so nothing could be matched back to a lead. Both spellings
 * are accepted now in case the event type is reconfigured.
 */
export function parseAttendeeData() {
  const params = new URLSearchParams(window.location.search);
  const pick = (...keys) => {
    for (const key of keys) {
      const value = params.get(key);
      if (value) return value;
    }
    return null;
  };

  return {
    name: pick("attendeeName", "name"),
    email: pick("email", "attendeeEmail"),
    phone: pick("attendeePhoneNumber", "phone"),
    time: pick("attendeeStartTime", "startTime"),
    bookingUid: pick("uid"),
    eventTitle: pick("title"),
    utm: pick("utm_source") || "direct",
  };
}

/**
 * Shared engagement tracking for the thank-you pages: logs a page-view
 * (device/location/UTM), periodic "still on page" checkpoints with
 * click activity, and a final "left the page" event — each as a
 * Discord embed built from the attendee query-string params. Also returns
 * `logToDiscord` so the page can log its own events (e.g. "WhatsApp
 * Confirmed") with the same rich embed shape.
 *
 * @param {object} config
 * @param {string} config.viewEvent - embed title for the initial page-view log
 * @param {(seconds: number) => string} config.stillOnPageEvent - embed title per checkpoint
 * @param {string} config.leftPageEvent - embed title for the exit log
 * @param {Record<string, number>} config.eventColors - embed title -> Discord color
 * @param {string} config.footerText - embed footer text
 * @param {() => void} [config.onMount] - extra one-time setup (e.g. Wistia player init)
 * @param {() => Record<string, string>} [config.getExtraFields] - page-owned
 *   fields appended to checkpoint and exit embeds (e.g. video engagement)
 * @param {() => {count: number, avgPercent: number}} [config.getVideoStats] -
 *   raw video numbers folded into the exit engagement score
 */
export function useVisitTracking({
  viewEvent,
  stillOnPageEvent,
  leftPageEvent,
  eventColors,
  footerText,
  onMount,
  getExtraFields,
  getVideoStats,
}) {
  // Derived once from the URL at mount — no need to compute it in an effect
  // since this is a client-only SPA (window is always available).
  const [attendeeData] = useState(parseAttendeeData);

  const configRef = useRef({ viewEvent, stillOnPageEvent, leftPageEvent, eventColors, footerText, onMount, getExtraFields, getVideoStats });
  useEffect(() => {
    configRef.current = { viewEvent, stillOnPageEvent, leftPageEvent, eventColors, footerText, onMount, getExtraFields, getVideoStats };
  });

  /**
   * Dense single-embed logger. Inline fields get padded and stacked three to a
   * row by Discord, which turns eight of them into a wall — a description with
   * separators carries the same data in a quarter of the height.
   */
  const logToDiscord = useCallback(async (event, data) => {
    const { eventColors, footerText } = configRef.current;
    const flag = getFlagEmoji(data["🌎 Country Code"]);
    const clicks = data["🖱️ Clicks"];
    const extra = data.extra || {};

    const identity = [
      data["📧 Email"] && data["📧 Email"] !== "Not provided"
        ? `\`${data["📧 Email"]}\``
        : null,
      data["📞 Phone"] && data["📞 Phone"] !== "Not provided"
        ? `\`${data["📞 Phone"]}\``
        : null,
    ].filter(Boolean);

    const stats = [
      data["⏱️ Time Spent"] ? `⌛ ${data["⏱️ Time Spent"]}` : null,
      Array.isArray(clicks) ? `🖱 ${clicks.length}` : null,
      extra["🎬 Videos Played"] ? `🎬 ${extra["🎬 Videos Played"]}` : null,
    ].filter(Boolean);

    const lines = [
      extra["🔥 Engagement Score"] ? `**${extra["🔥 Engagement Score"]}**` : null,
      identity.length ? identity.join(" · ") : null,
      `${flag} ${data["📍 Location"] || "Unknown"} · ${data["💻 Device"] || "Unknown"}`,
      stats.length ? stats.join(" · ") : null,
      extra["▶️ Watch Detail"] || null,
      Array.isArray(clicks) && clicks.length
        ? `\`\`\`${formatClicks(clicks).slice(0, 600)}\`\`\``
        : null,
      data["🔗 UTM Source"] && data["🔗 UTM Source"] !== "direct"
        ? `🔗 ${data["🔗 UTM Source"]}`
        : null,
    ].filter(Boolean);

    await postDiscordEmbed({
      title: `${event} · ${data["👤 Name"] || "Unknown"}`,
      color: eventColors[event] || 0x5865f2,
      description: lines.join("\n").slice(0, 4096),
      footer: { text: footerText },
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Cal redirects here the instant a booking confirms, which kills any request
  // the pitch page had in flight. The redirect params are the reliable record,
  // so the booking is reported from this side instead.
  useEffect(() => {
    if (!attendeeData.email || !attendeeData.bookingUid) return;
    postToSheet("booking", {
      email: attendeeData.email,
      startTime: attendeeData.time || "",
    });
  }, [attendeeData]);

  useEffect(() => {
    const { viewEvent, stillOnPageEvent, leftPageEvent, onMount } = configRef.current;
    const startTime = Date.now();
    const { os, device, browser } = getDeviceInfo();

    let locationStr = "Fetching...";
    const clicks = [];

    const handleClick = (e) => {
      const tag = e.target.closest("button, a");
      if (tag) {
        clicks.push({
          element: tag.tagName.toLowerCase(),
          text: tag.innerText?.trim().slice(0, 40) || "(no text)",
          at: formatDuration(Math.round((Date.now() - startTime) / 1000)),
        });
      }
    };

    document.addEventListener("click", handleClick);

    const logView = async () => {
      const loc = await getLocation();
      locationStr = loc.full;
      logToDiscord(viewEvent, {
        "👤 Name": attendeeData.name || "Unknown",
        "📧 Email": attendeeData.email || "Not provided",
        "📞 Phone": attendeeData.phone || "Not provided",
        "📍 Location": locationStr,
        "🌎 Country Code": loc.countryCode,
        "💻 Device": `${device} · ${os} · ${browser}`,
        "🔗 UTM Source": attendeeData.utm,
        "↩️ Referrer": document.referrer || "direct",
      });
    };
    logView();

    // Writes the engagement snapshot as it stands right now. Called at every
    // checkpoint as well as on exit, so the closer still sees a recent number
    // even when the final send never lands — recordEngagement overwrites the
    // same cells, so the last one to arrive simply wins.
    const syncEngagement = (seconds) => {
      const videoStats = configRef.current.getVideoStats?.();
      const { score, band } = scoreEngagement({ seconds, video: videoStats });

      // Deliberately terse — this lands in a spreadsheet cell a closer scans
      // at a glance, so it's time plus which videos, nothing else. The band is
      // already the Score column and the per-video percentages still go to
      // Discord in full under "Watch Detail".
      beaconToSheet("engagement", {
        email: attendeeData.email,
        score,
        detail: [
          formatDuration(seconds),
          videoStats?.titles?.length ? videoStats.titles.join(", ") : "no video",
        ].join(" · "),
      });

      return { score, band };
    };

    const timers = CHECKPOINTS.map((secs) =>
      setTimeout(() => {
        syncEngagement(secs);
        logToDiscord(stillOnPageEvent(secs), {
          "👤 Name": attendeeData.name || "Unknown",
          "📍 Location": locationStr,
          "💻 Device": `${device} · ${os} · ${browser}`,
          "🖱️ Clicks": clicks.length ? clicks : "None yet",
          extra: configRef.current.getExtraFields?.(),
        });
      }, secs * 1000),
    );

    let reported = false;
    const handleLeave = () => {
      if (reported) return;
      reported = true;

      const seconds = Math.round((Date.now() - startTime) / 1000);
      const { getExtraFields } = configRef.current;
      const { score, band } = syncEngagement(seconds);
      const videoFields = getExtraFields?.() || {};

      logToDiscord(leftPageEvent, {
        "👤 Name": attendeeData.name || "Unknown",
        "📧 Email": attendeeData.email || "Not provided",
        "📞 Phone": attendeeData.phone || "Not provided",
        "📍 Location": locationStr,
        "💻 Device": `${device} · ${os} · ${browser}`,
        "⏱️ Time Spent": formatDuration(seconds),
        "🖱️ Clicks": clicks.length ? clicks : "None",
        extra: { "🔥 Engagement Score": `${score}/100 · ${band}`, ...videoFields },
      });
    };

    // beforeunload is unreliable and never fires at all on mobile Safari.
    // pagehide plus a hidden visibilitychange is what actually catches a
    // closing tab or an app switch; `reported` keeps it to one send.
    const onHidden = () => {
      if (document.visibilityState === "hidden") handleLeave();
    };
    window.addEventListener("pagehide", handleLeave);
    document.addEventListener("visibilitychange", onHidden);

    onMount?.();

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("pagehide", handleLeave);
      document.removeEventListener("visibilitychange", onHidden);
      timers.forEach(clearTimeout);
    };
  }, [attendeeData, logToDiscord]);

  return { attendeeData, logToDiscord };
}
