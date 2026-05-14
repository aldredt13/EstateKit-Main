import nielen from "../../assets/nielen.jpeg";
import natie from "../../assets/natie.jpeg";
import teboho from "../../assets/teboho.jpeg";
import david from "../../assets/david.jpeg";
import mpho from "../../assets/mpho.png";

const avatars = [
  { src: nielen, alt: "Nielen" },
  { src: natie, alt: "Natie" },
  { src: teboho, alt: "Teboho" },
  { src: david, alt: "David" },
  { src: mpho, alt: "Mpho" },
];

export default function SocialProof() {
  return (
    <section className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pb-8 md:pb-10 text-center">
      {/* Avatar stack */}
      <div className="flex justify-center -space-x-2 mb-3">
        {avatars.map((avatar) => (
          <img
            key={avatar.alt}
            src={avatar.src}
            alt={avatar.alt}
            className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white object-cover"
          />
        ))}
        {/* +25 bubble */}
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white bg-brand flex items-center justify-center text-white text-base md:text-lg font-bold">
          +25
        </div>
      </div>

      <p className="text-center text-slate-900 font-semibold text-base md:text-lg mb-5">
        Join Other Agents that we actively working with to grow their business
        with Guaranteed results.
      </p>

      <p className="text-center text-slate-900 font-black text-base md:text-lg mb-5">
        Hear from them below...
      </p>
    </section>
  );
}
