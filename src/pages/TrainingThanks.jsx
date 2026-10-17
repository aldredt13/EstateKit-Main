import { FaWhatsapp, FaCheck } from "react-icons/fa";
import { useVisitTracking } from "../hooks/useVisitTracking";
import { usePageMeta } from "../hooks/usePageMeta";
import { formatDuration } from "../lib/analytics";
import { wistiaEmbedHtml } from "../lib/wistiaEmbed";
import StepHeader from "../components/StepHeader";
import TestimonialImage from "../components/TestimonialImage";

import calaccept from "../../assets/calaccept.webp";
import sectionBg from "../../assets/section-bg.jpg";
import roster from "../../assets/roster.png";
import angie from "../../assets/angie.png";
import lebo from "../../assets/lebo.webp";
import mpho from "../../assets/mpho.jpg";
import thabo from "../../assets/thabo.webp";
import logo from "../../assets/primary.svg";
import logo2 from "../../assets/darkfull.png";

import test1 from "../../assets/Layer 1.png";
import test3 from "../../assets/Layer 3.png";
import test4 from "../../assets/Layer 4.png";
import test6 from "../../assets/Layer 6.png";
import test7 from "../../assets/Layer 7.png";
import test8 from "../../assets/Layer 8.png";
import test9 from "../../assets/Layer 9.png";
import test11 from "../../assets/layer 11.png";
import test12 from "../../assets/layer 12.png";
import test13 from "../../assets/layer 13.png";
import test14 from "../../assets/layer 14.png";
import test15 from "../../assets/layer 15.png";
import test16 from "../../assets/layer 16.png";
import test17 from "../../assets/layer 17.png";
import test18 from "../../assets/layer 18.png";
import test19 from "../../assets/layer 19.png";
import test20 from "../../assets/Layer 20.png";

import FaqVideos from "../components/FaqVideos";
import {
  TRAINING_WHATSAPP_GROUP_LINK,
  TRAINING_WHATSAPP_FALLBACK_NUMBER,
} from "../config/trainingConfig";

// ─── Data ────────────────────────────────────────────────────────────────────

const BENEFITS = [
  "Free up 10-20 hours every week while your pipeline grows on autopilot",
  "Done-for-You multi-channel video ad campaigns on Facebook, Instagram",
  "Customized strategy. Scripts, ad funnels, and a CRM… all built for you",
  "Done-for-you CRM, custom landing pages, high-converting templates, and full video ad editing",
  "Follow-up & nurture strategies that convert cold & long term leads into closed deals",
  "Bi-Weekly strategy & support calls with the team—plus an invite-only community",
];

const FOR = [
  "Experienced agents already closing 9+ deals a year who want predictable, done-for-you seller appointments.",
  `Realtors tired of the "marketing hamster wheel" of cold calling, canvassing, and waiting on referrals.`,
  "Agents ready to show up, implement, and follow a proven, repeatable system (no ego, no coasting).",
  "Agents who want sellers reaching out to them — not the other way around.",
];

const NOT_FOR = [
  "Anyone looking for overnight results with zero effort (we show you the system — you still have to run it).",
  "Anyone not currently doing at least 9 deals a year or not ready to invest in scaling seriously.",
  `Anyone treating real estate as a "side hustle" or hoping for handouts—this requires hunger and execution.`,
];

const TESTIMONIAL_IMAGES = [
  {
    src: test6,
    credit: {
      img: angie,
      name: "Angie",
      caption: "20 leads so far at R10 each",
    },
  },
  {
    src: test9,
    credit: {
      img: lebo,
      name: "Lebo",
      caption: "So far collected 65+ leads at R9 each",
    },
  },
  { src: test20 },
  { src: test19 },
  { src: test18 },
  { src: test17 },
  { src: test16 },
  { src: test15 },
  { src: test14 },
  { src: test13 },
  { src: test12 },
  { src: test11 },
  { src: test1 },
  { src: test3 },
  {
    src: test8,
    credit: { img: thabo, name: "Thabo", caption: "30+ leads at R10 each" },
  },
  {
    src: test7,
    credit: { img: mpho, name: "Mpho", caption: "48 leads at R9 each" },
  },
  { src: test4 },
];

const EVENT_COLORS = {
  "🎓 Training Reservation Page Viewed": 0x3498db, // Blue
  "⏱️ Still on page": 0xf1c40f, // Yellow
  "🚪 Left the Page": 0xe74c3c, // Red
  "✅ WhatsApp Confirmed": 0x2ecc71, // Green
};
// ─── Main Component ───────────────────────────────────────────────────────────

const TrainingThanks = () => {
  usePageMeta({
    title: "Your Seat Is Not Reserved Yet | EstateKit",
    description: "Complete these steps to lock in your free training seat.",
    path: "/training/thank-you",
    noindex: true,
  });

  const { attendeeData } = useVisitTracking({
    viewEvent: "🎓 Training Reservation Page Viewed",
    stillOnPageEvent: (secs) => `⏱️ Still on page — ${formatDuration(secs)}`,
    leftPageEvent: "🚪 Left the Page",
    eventColors: EVENT_COLORS,
    footerText: "EstateKit Training Funnel • Live Tracking",
  });

  const handleConfirm = () => {
    const date = attendeeData.time ? new Date(attendeeData.time) : null;
    let timePhrase = "";

    if (date) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      timePhrase =
        date.toDateString() === today.toDateString()
          ? "today"
          : date.toDateString() === tomorrow.toDateString()
            ? "tomorrow"
            : `on ${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;

      timePhrase += ` at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    }

    const message = `Hey it's ${attendeeData.name}. I just registered for the free training ${timePhrase}`;
    window.open(
      `https://wa.me/${attendeeData.phone || TRAINING_WHATSAPP_FALLBACK_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  return (
    <div className="bg-white">
     <div className="bg-red-600 text-white px-4 py-4 flex items-center justify-center gap-1 w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
        >
          <circle cx="13.8336" cy="13.8336" r="13.8336" fill="white" />
          <path
            d="M14 6V16"
            stroke="#DC2626"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="14" cy="20.5" r="1.5" fill="#DC2626" />
        </svg>
        <strong className="text-xl font-bold">
          IMPORTANT: DO NOT CLOSE THIS PAGE!
        </strong>
      </div>

      {/* Registration Details Header */}
      <section className="mx-auto py-10 text-center">
        <h1 className="text-2xl md:text-4xl font-black uppercase leading-tight mb-2">
          YOUR REGISTRATION DETAILS
        </h1>
        <p className="text-2xl font-medium text-gray-800">
          Are Inside This Video
        </p>
      </section>

      {/* Video Embed */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 mb-12">
        <div
          className="aspect-video w-full rounded-lg overflow-hidden"
          dangerouslySetInnerHTML={{ __html: wistiaEmbedHtml("ahm5osiwq8") }}
        />
      </section>

      {/* Event Details Section */}
      <section
        className="relative overflow-hidden py-12 sm:py-16"
        style={{
          backgroundImage: `url(${sectionBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
           <div className="text-center mb-5">
            <p className="text-2xl md:text-3xl font-bold capitalize text-black">Add it to your calendar</p>
          </div>
          {/* Event Info Header */}
          <div className="bg-white/95 transform scale-110 mx-auto w-fit px-3 sm:px-4 py-2 drop-shadow rounded-md text-xs sm:text-sm md:text-base text-slate-900 my-5 font-black tracking-wide flex items-center justify-center gap-1 flex-wrap max-w-full sm:w-fit">
            <span className="text-red-500 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <div className="bg-red-500 rounded-full min-w-2 min-h-2 sm:min-w-3 sm:min-h-3"></div>
              <span>LIVE TRAINING</span>
            </span>
            <span className="hidden sm:inline text-slate-400"> </span>
            <span className="hidden sm:inline text-slate-900">FREE EVENT</span>
            <span className="inline text-slate-900"> | </span>
            <span className="whitespace-nowrap text-slate-900">SEP. 10TH, 2026</span>
          </div>

          {/* Time */}
          <div className="text-center my-5">
            <p className="text-3xl font-black text-black">7PM SAST</p>
          </div>

          {/* Calendar Buttons */}
          <div className="space-y-3 mb-8 max-w-xs mx-auto">
            <button className="w-full bg-brand text-white py-5 rounded-full font-bold text-xl transition flex items-center justify-center gap-2 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              Apple Calendar
            </button>
            <button className="w-full bg-brand text-white py-5 rounded-full font-bold text-xl transition flex items-center justify-center gap-2 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              Google Calendar
            </button>
            <button className="w-full bg-brand text-white py-5 rounded-full font-bold text-xl transition flex items-center justify-center gap-2 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              Outlook Calendar
            </button>
          </div>
        </div>
      </section>

      {/* Screenshot & Save Section */}
      <section className="relative overflow-hidden py-12 sm:py-16" style={{
          backgroundImage: `url(${sectionBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
        <div className="text-center mb-12">
          <img src={logo2} alt="EstateKit Logo" className="h-9 mx-auto mb-5" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wide mb-8">
            SCREENSHOT &amp; SAVE
          </h2>
        </div>

        {/* Event Details Boxes */}
        <div className="space-y-3 mb-8 max-w-sm mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
            <span className="text-red-600 font-bold text-lg">🔴</span>
            <div>
              <span className="font-black text-red-600 text-sm">LIVE</span>
              <span className="font-bold text-gray-800 ml-2">VIRTUAL EVENT</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
            <span className="text-gray-400 text-lg">📅</span>
            <div>
              <span className="font-black text-gray-800 text-sm">SEP. 10, 2026 | 9AM PT (12PM ET)</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
            <span className="text-gray-400 text-lg">🔗</span>
            <div>
              <span className="font-black text-red-600 text-sm">ATTEND LIVE AT</span>
              <a href="#" className="font-bold text-red-600 ml-2 hover:underline">LIVE.ACQ.COM</a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-4xl px-4 sm:px-6 mx-auto mb-12">
        <img src={roster} className="mb-10 rounded drop-shadow w-full" alt="Testimonial Roster" />
        <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase text-center mb-6">
          Here's What Other{" "}
          <span className="text-purple-600">Real Estate Agents</span> Are Saying:
        </h3>
        <p className="mt-5 font-bold text-base sm:text-lg md:text-xl text-center mb-6">
          Lebogang M. - "Chef's Kiss" - 65+ Leads at R9 each in 3 Days, 12 Opportunities
        </p>
        <div
          className="aspect-video w-full rounded-lg overflow-hidden mb-8"
          dangerouslySetInnerHTML={{ __html: wistiaEmbedHtml("olb5byx60v") }}
        />
        <p className="font-bold text-lg sm:text-xl md:text-2xl text-center mb-8">
          Agents in your area using this system are getting results like these RIGHT NOW...
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {TESTIMONIAL_IMAGES.map((t, i) => (
            <TestimonialImage key={i} {...t} />
          ))}
        </div>
      </section>

      {/* Win Prizes Section */}
      <section className="bg-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-6">
            Win Prizes by Referring Friends
          </h2>
          
          <div className="text-center mb-8">
            <p className="text-base sm:text-lg mb-4">Some of the prizes include:</p>
            <ul className="space-y-2 text-left max-w-sm mx-auto mb-6">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Dinner with Alex</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Full Day at Acquisition.com HQ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Bonus Free Book</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>and More.</span>
              </li>
            </ul>
            <p className="text-base sm:text-lg mb-8">
              Invite people by sending to your email list, company, and friends.
            </p>
          </div>

          <a href="#" className="block bg-purple-600 text-white py-4 md:py-5 rounded-full font-black text-base sm:text-lg md:text-xl text-center hover:bg-purple-700 transition mb-8">
            Yes! I Want to Win Prizes*
          </a>

          <div className="text-center space-y-3 text-xs sm:text-sm">
            <p className="text-gray-400">
              Terms &amp; Conditions Apply. Copyright 2026 Acquisition.com
            </p>
            <div className="space-y-2">
              <p>
                <a href="#" className="text-blue-400 hover:underline">Affiliate Terms &amp; Conditions*</a>
                <span className="text-gray-500"> | </span>
                <a href="#" className="text-blue-400 hover:underline">Giveaway Terms &amp; Conditions</a>
              </p>
            </div>
            <p className="text-gray-400">
              Alex and Leila Hormozi's results are not typical and are not a guarantee of your success. We cannot guarantee that you will make money or that you will be successful if you employ their business strategies specifically or generally. Consequently, your results may significantly vary from theirs. The information contained within this website is the property of Acquisition.com.
            </p>
            <div className="pt-4">
              <img src={logo} alt="EstateKit Logo" className="h-8 mx-auto opacity-60 hover:opacity-100 transition" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <div className="mt-12">
        <FaqVideos />
      </div>
    </div>
  );
};

export default TrainingThanks;
