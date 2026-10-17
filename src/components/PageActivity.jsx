import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { postActivity } from "../lib/discordCards";

/**
 * Posts one "Landing page viewed" card per page, for every route rather than
 * just /pitch.
 *
 * Sits at the top of the router so no page has to remember to do it, which
 * is how /pitch ended up being the only one that did.
 *
 * Two guards, both learned the hard way. A ref keyed on the path stops React
 * running the effect twice in StrictMode and posting a duplicate. And a
 * route the visitor returns to in the same session does not post again,
 * because a card per back-button press is noise, not activity.
 */
export default function PageActivity() {
  const { pathname } = useLocation();
  const seen = useRef(new Set());

  useEffect(() => {
    if (seen.current.has(pathname)) return;
    seen.current.add(pathname);

    postActivity("viewed");
  }, [pathname]);

  return null;
}
