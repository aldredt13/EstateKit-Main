import TestimonialVideo from "./TestimonialVideo";
import bennie from "../../assets/bennie.MP3";

const TESTIMONIALS = [
  {
    type: "wistia",
    mediaId: "ahm5osiwq8",
    name: "Lebogang M.",
    result: "12 Listing Appointments in 6 days",
  },
  {
    type: "wistia",
    mediaId: "olb5byx60v",
    name: "Nielen B.",
    result: "4 Addition Listings in 35 days",
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
      {TESTIMONIALS.map((t, i) => (
        <TestimonialVideo key={i} {...t} />
      ))}
    </section>
  );
}
