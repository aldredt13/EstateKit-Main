import TestimonialVideo from "./TestimonialVideo";
import bennie from "../../assets/bennie.mp3";
import { JUANI_YOUTUBE_ID, SAKHILE_YOUTUBE_ID } from "../config/trainingConfig";

const TESTIMONIALS = [
  {
    type: "youtube",
    youtubeId: "RCgG7uPlNKc",
    name: "Naude K.",
    result: "Spent R3,000 on Ads — One Deal Paid R60,000",
  },
  {
    type: "wistia",
    mediaId: "qgus1atule",
    name: "Juani M. In Boksburg",
    result: "11 Listings & 1 Closed Deal in 6 Weeks",
  },
  {
    type: "wistia",
    mediaId: "98bvd7qirv",
    name: "Nielen B.",
    result: "4 Mandates in 35 days",
  },
  {
    type: "wistia",
    mediaId: "5u31s8now8",
    name: "Sakhile K.",
    result: "3 Sole Mandates in 3 Weeks",
  },
  {
    type: "wistia",
    mediaId: "ahm5osiwq8",
    name: "Lebogang M.",
    result: "12 Appointments in 6 days",
  },

  {
    type: "audio",
    audioSrc: bennie,
    name: "Bennie B. In Centurion",
    result: "20 Appointments in a single week",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pb-6 font-">
      {TESTIMONIALS.filter((t) => t.type !== "youtube" || t.youtubeId).map(
        (t, i) => (
          <TestimonialVideo key={i} {...t} />
        ),
      )}
    </section>
  );
}
