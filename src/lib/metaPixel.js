/**
 * Thin wrapper around the Meta Pixel (fbq), loaded in index.html.
 *
 * Every call that might later need server-side dedup is given an explicit
 * eventID here, which is threaded through to the dashboard write so the
 * Conversions API send in estatekit-funnel-lead can reuse the exact same
 * ID. Meta only dedupes a browser event against a server event when both
 * the event name AND the event ID match between the two.
 *
 * Every call no-ops safely if fbq never loaded — blocked by an ad blocker,
 * Brave, a privacy browser, JS disabled — so nothing here can break the
 * booking flow if a lead's browser refuses the pixel.
 */

function newEventId() {
  try {
    if (crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // fall through to the timestamp-based id below
  }
  return `${Date.now()}.${Math.random().toString(36).slice(2)}`;
}

function fire(eventName, eventId) {
  try {
    window.fbq?.("track", eventName, {}, { eventID: eventId });
  } catch {
    // tracking must never be able to break the thing it's watching
  }
}

/**
 * A lead cleared the qualifying questions. Not fired for a disqualified
 * one: that would teach Meta's delivery to find more of the leads we just
 * turned away.
 */
export function trackLead() {
  const eventId = newEventId();
  fire("Lead", eventId);
  return eventId;
}

/** A call landed on the calendar. Meta's standard name for this is "Schedule". */
export function trackSchedule() {
  const eventId = newEventId();
  fire("Schedule", eventId);
  return eventId;
}
