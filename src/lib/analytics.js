
export function formatDuration(seconds) {
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}



/**
 * Rates how engaged a visitor was, 0-100, from the two signals worth reading:
 * dwell time and video watching.
 *
 * Video carries most of the weight because on these pages it is the offer —
 * someone who watched two testimonials through is warmer than someone who left
 * the tab open. Scroll depth was dropped: it rewards flicking to the bottom.
 *
 * @param {object} signals
 * @param {number} signals.seconds - total time on page
 * @param {{ count: number, avgPercent: number }} [signals.video]
 */
export function scoreEngagement({ seconds, video }) {
  const timeScore = Math.min(seconds / 300, 1) * 35;

  const { count = 0, avgPercent = 0 } = video || {};
  // Playing anything at all is worth a floor; depth earns the rest.
  const videoScore =
    count === 0
      ? 0
      : Math.min(15 + count * 5, 30) + Math.min(avgPercent / 100, 1) * 35;

  const score = Math.round(timeScore + videoScore);

  return {
    score,
    band: score >= 75 ? "HOT" : score >= 45 ? "WARM" : score >= 20 ? "COOL" : "COLD",
  };
}

