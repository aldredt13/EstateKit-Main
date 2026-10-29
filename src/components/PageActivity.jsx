import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { postActivity } from "../lib/discordCards";

/**
 * Posts one "Landing page viewed" card per page, for every route rather than
 * just /pitch, and fires a Meta Pixel PageView on every real route change.
 *
 * Sits at the top of the router so no page has to remember to do it, which
 * is how /pitch ended up being the only one that did.
 *
 * The two trackers have different dedup rules, so they are not on the same
 * guard. The Discord card is for a human skimming an ops channel, where a
 * card per back-button press is noise, so it is keyed on path and only
 * posts once per route per session. The Pixel PageView is ad-delivery data:
 * Meta expects one per real view, including a visitor going back to a page
 * they already saw, so it fires unconditionally on every pathname change.
 */
export default function PageActivity() {
  const { pathname } = useLocation();
  const seen = useRef(new Set());

  useEffect(() => {
    try {
      window.fbq?.("track", "PageView");
    } catch {
      // tracking must never be able to break the page it's watching
    }

    // A ref keyed on the path stops React running this half twice in
    // StrictMode and posting a duplicate Discord card.
    if (seen.current.has(pathname)) return;
    seen.current.add(pathname);

    postActivity("viewed");
  }, [pathname]);

  return null;
}
