import { useEffect, useRef, useState } from "react";
import { formatDuration, scoreEngagement } from "../lib/analytics";
import { submitFunnelLead } from "../lib/dashboard";

const CHECKPOINTS = [30, 60, 120, 180, 300]; // seconds

/**
 * The booking redirect uses `email` / `attendeePhoneNumber`, not the
 * `attendeeEmail` / `phone` this originally looked for, which silently left
 * the email null so nothing could be matched back to a lead. Both spellings
 * are accepted in case the params ever change again.
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
 * Keeps the lead's dashboard note up to date with what they watched on the
 * thank-you page, so it is there before the call rather than after it.
 *
 * This used to post a wall of Discord embeds as well: a page view carrying
 * device and location, a checkpoint card every so often, and an exit card
 * with click history. All of that is gone. The activity cards in
 * discordCards.js are the only feed now, and they report what someone did
 * rather than which browser they did it in.
 *
 * The note is rewritten at every checkpoint, not only on exit, because the
 * final send is the one most likely to be lost to a closing tab. A slightly
 * stale note beats no note.
 *
 * @param {object} config
 * @param {() => void} [config.onMount] - one-time setup, e.g. player init
 * @param {() => {titles: string[], avgPercent: number, count: number}}
 *   [config.getVideoStats] - what they have played so far
 */
export function useVisitTracking({ onMount, getVideoStats } = {}) {
  const [attendeeData] = useState(parseAttendeeData);
  const configRef = useRef({ onMount, getVideoStats });

  // Written in an effect, not during render: the callbacks are rebuilt on
  // every render, and a ref write during render is a compiler error.
  useEffect(() => {
    configRef.current = { onMount, getVideoStats };
  }, [onMount, getVideoStats]);

  useEffect(() => {
    const startedAt = Date.now();
    configRef.current.onMount?.();

    const sync = (seconds) => {
      const videoStats = configRef.current.getVideoStats?.();
      const { score, band } = scoreEngagement({ seconds, video: videoStats });

      // Terse on purpose: this is one line Kieran skims before dialling.
      submitFunnelLead({
        name: attendeeData.name || "Lead",
        phone: attendeeData.phone || "",
        email: attendeeData.email,
        keepalive: true,
        engagement: [
          formatDuration(seconds),
          videoStats?.titles?.length ? videoStats.titles.join(", ") : "no video",
        ].join(" · "),
      });

      return { score, band };
    };

    const timers = CHECKPOINTS.map((secs) =>
      setTimeout(() => sync(secs), secs * 1000),
    );

    let reported = false;
    const handleLeave = () => {
      if (reported) return;
      reported = true;
      sync(Math.round((Date.now() - startedAt) / 1000));
    };

    // pagehide covers nav and tab close; visibilitychange catches the mobile
    // app-switch that never fires an unload at all.
    const onHidden = () =>
      document.visibilityState === "hidden" && handleLeave();

    window.addEventListener("pagehide", handleLeave);
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      window.removeEventListener("pagehide", handleLeave);
      document.removeEventListener("visibilitychange", onHidden);
      timers.forEach(clearTimeout);
    };
  }, [attendeeData]);

  return { attendeeData };
}
