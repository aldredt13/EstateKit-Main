import { FaWhatsapp, FaCheck } from "react-icons/fa";
import { useVisitTracking, parseAttendeeData } from "../hooks/useVisitTracking";
import { useVideoTracking } from "../hooks/useVideoTracking";
import { usePageMeta } from "../hooks/usePageMeta";
import { formatDuration } from "../lib/analytics";
import { wistiaEmbedHtml } from "../lib/wistiaEmbed";
import TestimonialsSection from "../components/TestimonialsSection";
import TestimonialVideo from "../components/TestimonialVideo";

import calaccept from "../../assets/calaccept.webp";
import sectionBg from "../../assets/section-bg.jpg";
import logo from "../../assets/primary.svg";

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
  "Experienced residential realtors closing 6+ deals/year—OR new agents ready to go ALL-IN on their real estate career.",
  `Realtors tired of the "marketing hamster wheel" of chasing bad leads or wondering if next month will be dry.`,
  "Realtors committed to showing up, closing, and willing to execute proven systems (no ego, no coasting).",
  "Realtors ready to build habits before results and stay consistent.",
];

const NOT_FOR = [
  "Anyone looking for overnight results (we test, optimize, and book what works—no magic fixes).",
  "Anyone that is not ready to invest in their business or follow a repeatable process.",
  `Anyone treating real estate as a "side hustle" or hoping for handouts—this requires hunger and execution.`,
];

const BREAKOUTS = [
  {
    type: "wistia",
    mediaId: "j6su0ot613",
    name: "AREN'T YOU JUST ANOTHER AGENCY"
  },
  {
    type: "wistia",
    mediaId: "2o1u6hnr93",
    name: "WILL THIS WORK IN MY AREA?"
  },
  {
    type: "wistia",
    mediaId: "7sajw5e6lw",
    name: "WHAT DOES THIS COST?"
  },
  {
    type: "wistia",
    mediaId: "6ptgqaxm2w",
    name: "WHAT IF IT DOESN'T WORK?"
  },
  {
    type: "wistia",
    mediaId: "ol57vm4r9a",
    name: "WHAT DO YOU ACTUALLY DO?"
  },
];

const EVENT_COLORS = {
  "📅 Booking Page Viewed": 0x3498db, // Blue
  "⏱️ Still on page": 0xf1c40f, // Yellow
  "🚪 Left the Page": 0xe74c3c, // Red
  "✅ WhatsApp Confirmed": 0x2ecc71, // Green
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Thanks = () => {
  usePageMeta({
    title: "Your Call Is Not Complete Yet | EstateKit",
    description: "Finish booking your discovery call with EstateKit.",
    path: "/thank-you",
    noindex: true,
  });

  // Read straight from the URL so each play log can name who is watching —
  // useVisitTracking needs this hook's getters, so it can't run first.
  const { getFields: getVideoFields, getStats: getVideoStats } =
    useVideoTracking({ viewer: parseAttendeeData().name });

  const { attendeeData, logToDiscord } = useVisitTracking({
    viewEvent: "📅 Booking Page Viewed",
    stillOnPageEvent: (secs) => `⏱️ Still on page — ${formatDuration(secs)}`,
    leftPageEvent: "🚪 Left the Page",
    eventColors: EVENT_COLORS,
    footerText: "EstateKit Booking Analytics • Live Tracking",
    getExtraFields: getVideoFields,
    getVideoStats,
    onMount: () => {
      if (!window.wistiaPlayerLoaded) {
        const script = document.createElement("script");
        script.src = "https://fast.wistia.com/player.js";
        script.async = true;
        document.head.appendChild(script);
        window.wistiaPlayerLoaded = true;
      }
      window._wq = window._wq || [];
      window._wq.push({
        id: "bgg70pglki",
        onReady: (v) => {
          v.autoplay(true);
          v.muted(true);
        },
      });
    },
  });

  const date = attendeeData.time ? new Date(attendeeData.time) : null;
  let timePhrase = "";
  if (date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    timePhrase =
      date.toDateString() === today.toDateString()
        ? "Today"
        : date.toDateString() === tomorrow.toDateString()
          ? "Tomorrow"
          : date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            });
  }
  const timeOfDay = date
    ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  const handleConfirm = () => {
    let phrase = "";
    if (date) {
      phrase = `${timePhrase.toLowerCase()} at ${timeOfDay}`;
    }

    const message = `Hey it's ${attendeeData.name}. I just booked a call for ${phrase}`;
    window.open(
      `https://wa.me/${attendeeData.phone || "264858149056"}?text=${encodeURIComponent(message)}`,
      "_blank",
    );

    logToDiscord("✅ WhatsApp Confirmed", {
      "👤 Name": attendeeData.name || "Unknown",
      "📞 Phone": attendeeData.phone || "Not provided",
    });
  };

  return (
    <div className="bg-white">
      {/* Success Banner 
      

      <div className="bg-green-600 text-white px-4 py-4 flex items-center justify-center gap-1 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="13.8336" cy="13.8336" r="13.8336" fill="white"/>
          <path d="M7.88125 12.9249C8.37238 12.4338 9.16864 12.4338 9.65976 12.9249L14.3623 17.6274L12.7272 19.2625C12.2361 19.7536 11.4398 19.7536 10.9487 19.2625L7.13543 15.4492C6.6443 14.9581 6.6443 14.1618 7.13543 13.6707L7.88125 12.9249Z" fill="#0B8240"/>
          <path d="M21.0463 9.16494C21.5374 9.65607 21.5374 10.4523 21.0463 10.9435L13.3585 18.6312C12.8674 19.1223 12.0712 19.1223 11.58 18.6312L9.94495 16.9961L18.522 8.41912C19.0131 7.92799 19.8093 7.928 20.3005 8.41912L21.0463 9.16494Z" fill="#0B8240"/>
        </svg>
        <strong className="text-xl font-bold">REGISTRATION SUCCESSFUL!</strong>
      </div>*/}

      <div className="bg-red-600 text-white px-4 py-4 flex items-center justify-center gap-3 w-full">
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
        <strong className="text-xl font-bold">DO NOT CLOSE THIS PAGE!</strong>
      </div>

      {/* Intro Header */}
      <section className="mx-auto pt-10 pb-5 text-center px-4">
        <h1 className="text-2xl md:text-4xl font-black uppercase leading-tight mb-2">
          YOUR BOOKING DETAILS
        </h1>
        <p className="text-2xl font-medium text-gray-800">
          Are Inside This Video
        </p>
      </section>

      {/* Video Embed */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 mb-12">
        <div
          className="aspect-video w-full"
          dangerouslySetInnerHTML={{ __html: wistiaEmbedHtml("d5t4u6pqqp") }}
        />
      </section>

      {/* Add To Calendar Section */}
      <section
        className="relative overflow-hidden py-12 sm:py-16 hidden"
        style={{
          backgroundImage: `url(${sectionBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-5">
            <p className="text-2xl md:text-3xl font-bold capitalize text-black">
              Step #2: Add Event To Calendar
            </p>
          </div>

          {/* Event Info Header */}
          <div className="bg-white/95 transform scale-110 mx-auto w-fit px-3 sm:px-4 py-2 drop-shadow rounded-md text-xs sm:text-sm md:text-base text-slate-900 my-5 font-black tracking-wide flex items-center justify-center gap-1 flex-wrap max-w-full sm:w-fit">
            <span className="text-red-500 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <div className="bg-red-500 rounded-full min-w-2 min-h-2 sm:min-w-3 sm:min-h-3"></div>
              <span>DISCOVERY CALL</span>
            </span>
            <span className="inline text-slate-900"> | </span>
            <span className="whitespace-nowrap text-slate-900">
              {timePhrase || "CHECK YOUR EMAIL"}
            </span>
          </div>

          {/* Time */}
          {timeOfDay ? (
            <div className="text-center my-5">
              <p className="text-3xl font-black text-black">{timeOfDay}</p>
            </div>
          ) : null}

          <img
            src={calaccept}
            alt="Calendar Accept"
            className="w-full max-w-sm mx-auto border-4 rounded-2xl border-brand mt-5"
          />
          <p className="mt-5 font-medium text-lg md:text-xl text-center max-w-md mx-auto">
            Please confirm your appointment by selecting "Yes" in the email
            calendar invite (select "Add to calendar" to avoid missing your
            call).
          </p>
        </div>
      </section>

      {/* Confirm Call Section */}
      <section
        className="relative overflow-hidden py-12 sm:py-16"
        style={{
          backgroundImage: `url(${sectionBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center mb-8 px-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-wide mb-10 max-w-4xl mx-auto">
            A Few Common Questions Answered...
          </h2>
        </div>

        <div className="w-fit mx-auto hidden">
          <button
            onClick={handleConfirm}
            className="my-5 bg-green-500 hover:bg-green-600 text-white font-bold p-5 md:px-7 md:py-5 rounded text-2xl md:text-3xl drop-shadow w-full flex gap-3"
          >
            <FaWhatsapp className="text-4xl" /> Confirm My Call
          </button>
        </div>
        <div>
          <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-6 grid grid-cols-1 md:grid-cols-2 md:gap-10">
            {BREAKOUTS.filter(
              (t) => t.type !== "youtube" || t.youtubeId,
            ).map((t, i) => (
              <TestimonialVideo key={i} {...t} />
            ))}
          </section>
        </div>
      </section>

      {/* Proof — one block, deliberately. This page's job is framing them for
          the call they already booked, not re-selling them; stacked proof here
          only pushes the breakout videos further down the page. */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-12 pb-2 text-center">
        <h2 className="font-black uppercase max-w-2xl mx-auto text-2xl sm:text-3xl text-slate-900 leading-tight">
          What{" "}
          <span className="text-brand underline decoration-4 underline-offset-4">
            Agents
          </span>{" "}
          Say About This System
        </h2>
      </section>

      <TestimonialsSection />

      {/* Why EstateKit / Who It's For Section */}
      <section className="bg-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-2 uppercase">
            Why is EstateKit <span className="text-brand">The Best Way</span>
          </h2>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-8 uppercase">
            To Scale Your Real Estate Business?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="flex gap-3 items-start bg-white/5 border border-white/10 p-4 rounded-lg"
              >
                <FaCheck className="text-green-400 mt-1 flex-shrink-0 text-lg" />
                <p className="font-semibold text-sm md:text-base">{b}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-center mb-6 uppercase">
            Who This Is For:
          </h2>
          <div className="space-y-3 mb-10">
            {FOR.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-xl text-green-400 flex-shrink-0">✔</span>
                <p className="text-sm sm:text-base font-medium">{item}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-center mb-6 uppercase">
            Who This Is NOT For:
          </h2>
          <div className="space-y-3 mb-8">
            {NOT_FOR.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-xl text-red-400 flex-shrink-0">❌</span>
                <p className="text-sm sm:text-base font-medium">{item}</p>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <img
              src={logo}
              alt="EstateKit Logo"
              className="h-8 mx-auto opacity-60 hover:opacity-100 transition"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Thanks;
