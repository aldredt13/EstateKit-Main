import { useCallback, useEffect, useMemo, useRef } from "react";
import { scoreAnswers } from "../config/qualifyingQuestions";
import { postActivity } from "../lib/discordCards";
import { submitFunnelLead, toFormAnswers } from "../lib/dashboard";
import { trackLead, trackSchedule } from "../lib/metaPixel";
import { formatDuration } from "../lib/analytics";

/**
 * Everything a page has to do around the booking widget: activity cards to
 * Discord and the lead to the dashboard.
 *
 * It lives here rather than in the widget because the widget is also used on
 * /rebook, where the lead already exists and none of this should fire. And
 * it lives here rather than in each page because three pages now carry the
 * same booking flow, and reporting that drifts between them is reporting you
 * cannot read.
 *
 * Spread the result onto ApplicationWidget:
 *
 *   const reporting = useFunnelReporting();
 *   <ApplicationWidget {...reporting} />
 *
 * @param {object} [options]
 * @param {() => Record<string, string>} [options.getVideoFields] - what they
 *   have watched, when the page tracks video
 */
export function useFunnelReporting({ getVideoFields } = {}) {
  const arrivedAtRef = useRef(0);
  const videoRef = useRef(getVideoFields);

  // Both written in an effect rather than during render: the callback is
  // rebuilt every render, and Date.now() during render is impure.
  useEffect(() => {
    if (!arrivedAtRef.current) arrivedAtRef.current = Date.now();
    videoRef.current = getVideoFields;
  }, [getVideoFields]);

  const secondsHere = () =>
    formatDuration(
      Math.round((Date.now() - (arrivedAtRef.current || Date.now())) / 1000),
    );

  const onStart = useCallback(() => {
    postActivity("started", {
      fields: {
        "On page": secondsHere(),
        Videos: videoRef.current?.()["🎬 Videos Played"] || "None",
      },
    });
  }, []);

  const onReachedContact = useCallback(({ name, phone }) => {
    postActivity("reached", {
      who: name || "Visitor",
      fields: { Phone: phone },
      link: phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : undefined,
    });
  }, []);

  const onComplete = useCallback((result) => {
    const videos = videoRef.current?.()["🎬 Videos Played"] || "None";

    postActivity(result.qualified ? "reached" : "disqualified", {
      who: result.contact.name,
      fields: {
        Phone: result.contact.phone,
        Email: result.contact.email,
        Score: `${result.score}/100 · ${result.band}`,
        "PPRA status": result.breakdown[0]?.answer,
        "Transactions (6mo)": result.breakdown[1]?.answer,
        Engagement: `${secondsHere()} · ${videos}`,
      },
    });

    // Only a qualified lead is a Meta "Lead" event: firing it for someone we
    // just disqualified would teach ad delivery to find more of exactly the
    // leads the page turned away.
    const metaEventId = result.qualified ? trackLead() : undefined;

    // Lands on the dashboard, which fires the confirmation and the ping.
    submitFunnelLead({
      name: result.contact.name,
      phone: result.contact.phone,
      email: result.contact.email,
      answers: toFormAnswers(result.breakdown),
      disqualified: !result.qualified,
      metaEventId,
      metaEventName: metaEventId ? "Lead" : undefined,
    });
  }, []);

  const onBook = useCallback(({ start, form, answers }) => {
    const email = form.email.trim();
    const name = `${form.firstName} ${form.lastName}`.trim();

    const card = postActivity("booked", {
      who: name,
      fields: {
        When: new Date(start).toLocaleString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        }),
        Phone: form.phone,
        Email: email,
      },
      link: `https://wa.me/${form.phone.replace(/\D/g, "")}`,
    });

    const lead = submitFunnelLead({
      name,
      phone: form.phone.trim(),
      email,
      answers: toFormAnswers(scoreAnswers(answers).breakdown),
      startsAt: new Date(start).toISOString(),
      keepalive: true,
      metaEventId: trackSchedule(),
      metaEventName: "Schedule",
    });

    // Returned so the widget waits for both before it redirects. An
    // in-flight request dies with the page, which is how bookings once
    // reached the calendar but never the dashboard.
    return Promise.all([card, lead]);
  }, []);

  return useMemo(
    () => ({ onStart, onReachedContact, onComplete, onBook }),
    [onStart, onReachedContact, onComplete, onBook],
  );
}
