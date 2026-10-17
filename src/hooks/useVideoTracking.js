import { useCallback, useEffect, useRef } from "react";
import { videoTitle } from "../config/videoTitles";
import { postActivity } from "../lib/discordCards";
import { formatDuration } from "../lib/analytics";

/**
 * Tracks every player on the page — Wistia web components and plain <audio>.
 *
 * Wistia's `_wq` / `onReady` queue is the old E-v1 embed API and never fires
 * for <wistia-player> custom elements, which is what this site renders. The
 * web component dispatches ordinary DOM events instead, so listeners are
 * attached directly to each element and a MutationObserver picks up players
 * that mount later (testimonials, breakouts, anything behind a click).
 *
 * @param {object} [options]
 * @param {string} [options.viewer] - name shown on the per-play Discord card
 * @returns {{ getFields: () => Record<string, string>, getStats: () => object }}
 */
export function useVideoTracking({ viewer } = {}) {
  const playsRef = useRef(new Map());
  const startedAtRef = useRef(0);
  const viewerRef = useRef(viewer);
  useEffect(() => {
    viewerRef.current = viewer;
  }, [viewer]);

  useEffect(() => {
    const plays = playsRef.current;
    startedAtRef.current = Date.now();

    const idOf = (el) =>
      el.getAttribute?.("media-id") ||
      el.dataset?.mediaId ||
      el.getAttribute?.("src")?.split("/").pop() ||
      "unknown";

    const onPlay = (el) => {
      const id = idOf(el);
      const existing = plays.get(id);
      if (existing) {
        existing.count += 1;
        return;
      }

      const name = videoTitle(id, el.getAttribute?.("title"));
      const after = Math.round((Date.now() - startedAtRef.current) / 1000);
      plays.set(id, { name, count: 1, maxPercent: 0, firstPlayedAfter: after });

      // Only that they tapped it, not how far they got. Watch depth still
      // rides along to the dashboard note at the end of the visit.
      postActivity("played", {
        who: viewerRef.current || undefined,
        fields: {
          Video: name,
          "After": formatDuration(after),
        },
      });
    };

    const onProgress = (el) => {
      const entry = plays.get(idOf(el));
      if (!entry) return;
      const duration = Number(el.duration);
      const current = Number(el.currentTime);
      if (!duration || !Number.isFinite(current)) return;
      entry.maxPercent = Math.max(
        entry.maxPercent,
        Math.min(100, Math.round((current / duration) * 100)),
      );
    };

    const attach = (el) => {
      if (!el || el.dataset.ekTracked) return;
      el.dataset.ekTracked = "1";
      el.addEventListener("play", () => onPlay(el));
      el.addEventListener("timeupdate", () => onProgress(el));
      // The web component emits "end"; <audio> emits "ended".
      el.addEventListener("end", () => onProgress(el));
      el.addEventListener("ended", () => onProgress(el));
    };

    const scan = () =>
      document
        .querySelectorAll("wistia-player, audio, video")
        .forEach(attach);

    scan();

    // Players mount after Wistia's runtime upgrades them, and testimonials
    // render in later paints — so keep watching rather than scanning once.
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const getFields = useCallback(() => {
    const plays = [...playsRef.current.values()];
    if (!plays.length) return { "🎬 Videos Played": "None" };

    return {
      "🎬 Videos Played": `${plays.length} video${plays.length > 1 ? "s" : ""}`,
      "▶️ Watch Detail": plays
        .map(
          (p) =>
            `• ${p.name} — ${p.maxPercent}% watched, started at ${formatDuration(p.firstPlayedAfter)}${p.count > 1 ? ` (${p.count} plays)` : ""}`,
        )
        .join("\n")
        .slice(0, 1024),
    };
  }, []);

  const getStats = useCallback(() => {
    const plays = [...playsRef.current.values()];
    if (!plays.length) {
      return { count: 0, avgPercent: 0, maxPercent: 0, titles: [], summary: "" };
    }

    const percents = plays.map((p) => p.maxPercent);
    return {
      count: plays.length,
      avgPercent: Math.round(
        percents.reduce((a, b) => a + b, 0) / percents.length,
      ),
      maxPercent: Math.max(...percents),
      titles: plays.map((p) => p.name),
      // "Juani M. (82%), Pitch VSL (14%)" — what the closer actually wants.
      summary: plays.map((p) => `${p.name} (${p.maxPercent}%)`).join(", "),
    };
  }, []);

  return { getFields, getStats };
}
