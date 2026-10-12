/**
 * Wistia media id -> the label the page actually shows.
 *
 * Wistia's own `video.name()` returns whatever the media was called on upload,
 * which is rarely what a closer would recognise. Mapping the ids here means
 * engagement logs read "Juani M. — 11 Listings" instead of a slug.
 */
export const VIDEO_TITLES = {
  // Testimonials
  qgus1atule: "Juani",
  "98bvd7qirv": "Nielen",
  "5u31s8now8": "Sakhile",
  ahm5osiwq8: "Lebogang",

  // Sales videos
  z6oqli7c8o: "pitch VSL",
  d5t4u6pqqp: "booking details",

  // Thank-you page objection breakouts
  j6su0ot613: "another agency?",
  "2o1u6hnr93": "my area?",
  "7sajw5e6lw": "cost?",
  "6ptgqaxm2w": "if it fails?",
  ol57vm4r9a: "what you do?",
};

export function videoTitle(mediaId, fallback) {
  return VIDEO_TITLES[mediaId] || fallback || mediaId;
}
