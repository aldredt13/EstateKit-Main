import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaCheck } from "react-icons/fa";

import calaccept from "../../assets/calaccept.webp";
import roster from "../../assets/roster.png";
import angie from "../../assets/angie.png";
import lebo from "../../assets/lebo.webp";
import mpho from "../../assets/mpho.jpg";
import thabo from "../../assets/thabo.webp";

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

const WISTIA_EMBED = (id) => `
  <script src="https://fast.wistia.com/embed/${id}.js" async type="module"></script>
  <style>
    wistia-player[media-id='${id}']:not(:defined) {
      background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/${id}/swatch');
      display: block;
      filter: blur(5px);
      padding-top: 56.25%;
    }
  </style>
  <wistia-player media-id="${id}" seo="false" aspect="1.7777777777777777"></wistia-player>
`;

const DISCORD_WEBHOOK =
  "https://discord.com/api/webhooks/1403151508287127582/ReH3dRhqmN2pGoslGMFgIE30aj4xQymtHCMmn3Di4XmdjNpxPL5SlmROkWpM9nwAch64";

// ─── Tracking Helpers ─────────────────────────────────────────────────────────

const getDeviceInfo = () => {
  const ua = navigator.userAgent;

  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown";

  const device = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android.*Mobile/.test(ua)
        ? "Android Phone"
        : /Android/.test(ua)
          ? "Android Tablet"
          : window.innerWidth < 768
            ? "Mobile"
            : "Desktop";

  const browser =
    /Chrome/.test(ua) && !/Edg/.test(ua)
      ? "Chrome"
      : /Safari/.test(ua) && !/Chrome/.test(ua)
        ? "Safari"
        : /Firefox/.test(ua)
          ? "Firefox"
          : /Edg/.test(ua)
            ? "Edge"
            : "Other";

  return { os, device, browser };
};

const getLocation = async () => {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const d = await res.json();

    return {
      full: `${d.city}, ${d.region}, ${d.country_name}`,
      countryCode: d.country_code,
    };
  } catch {
    return {
      full: "Unknown",
      countryCode: null,
    };
  }
};

const formatTime = (date) =>
  date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatDuration = (seconds) =>
  seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StepHeader = ({ children }) => (
  <p className="mt-5 font-extrabold font-sans text-2xl md:text-3xl bg-brand w-full text-white text-center py-1 rounded">
    {children}
  </p>
);

const TestimonialImage = ({ src, credit }) => (
  <div className="mx-auto">
    <img
      src={src}
      className="max-w-sm w-full mx-auto h-fit drop-shadow"
      alt=""
    />
    {credit && (
      <div className="flex mx-auto w-fit items-center gap-2 mt-2">
        <img
          src={credit.img}
          alt={credit.name}
          className="h-10 w-10 object-cover rounded-full"
        />
        <p className="font-semibold text-gray-700">
          {credit.name} — {credit.caption}
        </p>
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Thanks = () => {
  const [attendeeData, setAttendeeData] = useState({});

  // ─── Discord Embed Helpers ─────────────────────────────────────

  const EVENT_COLORS = {
    "📅 Booking Page Viewed": 0x3498db, // Blue
    "⏱️ Still on page": 0xf1c40f, // Yellow
    "🚪 Left the Page": 0xe74c3c, // Red
    "✅ WhatsApp Confirmed": 0x2ecc71, // Green
  };

  const getFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return "🌍";
    return countryCode
      .toUpperCase()
      .split("")
      .map((char) => String.fromCodePoint(127397 + char.charCodeAt()))
      .join("");
  };

  const formatClicks = (clicks) => {
    if (!clicks || !clicks.length) return "None";

    return clicks
      .slice(0, 10)
      .map((c) => `• ${c.element} — ${c.text} (${c.at})`)
      .join("\n");
  };

  const generateAvatar = (name) => {
    const seed = encodeURIComponent(name || "Unknown");
    return `https://api.dicebear.com/7.x/initials/png?seed=${seed}`;
  };

  const logToDiscord = async (event, data) => {
    try {
      const flag = getFlagEmoji(data["🌎 Country Code"]);

      const fields = [
        {
          name: "👤 Prospect",
          value: `**${data["👤 Name"] || "Unknown"}**`,
          inline: true,
        },
        {
          name: "📍 Location",
          value: `${flag} ${data["📍 Location"] || "Unknown"}`,
          inline: true,
        },
        {
          name: "💻 Device",
          value: data["💻 Device"] || "Unknown",
          inline: true,
        },
        {
          name: "📧 Email",
          value: data["📧 Email"] || "Not provided",
          inline: false,
        },
        {
          name: "📞 Phone",
          value: data["📞 Phone"] || "Not provided",
          inline: false,
        },
        {
          name: "⏱️ Engagement",
          value:
            `Time Spent: ${data["⏱️ Time Spent"] || "—"}\n` +
            `Max Scroll: ${data["📜 Max Scroll"] || "—"}`,
          inline: false,
        },
        {
          name: "🖱️ Click Activity",
          value: formatClicks(data["🖱️ Clicks"]),
          inline: false,
        },
        {
          name: "🔗 Source",
          value:
            `UTM: ${data["🔗 UTM Source"] || "direct"}\n` +
            `Referrer: ${data["↩️ Referrer"] || "direct"}`,
          inline: false,
        },
      ];

      await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: event,
              color: EVENT_COLORS[event] || 0x5865f2,
              thumbnail: {
                url: generateAvatar(data["👤 Name"]),
              },
              fields,
              footer: {
                text: "EstateKit Booking Analytics • Live Tracking",
              },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    } catch (err) {
      console.error("Discord log failed:", err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const landedAt = new Date();
    const startTime = Date.now();
    const { os, device, browser } = getDeviceInfo();

    // Mutable refs for scroll/clicks (no re-render needed)
    let locationStr = "Fetching...";
    let maxScroll = 0;
    const clicks = [];

    // ── Set attendee state ──
    const data = {
      name: params.get("attendeeName"),
      email: params.get("attendeeEmail"),
      time: params.get("attendeeStartTime"),
      phone: params.get("phone"),
      utm: params.get("utm_source") || "direct",
    };
    setAttendeeData(data);

    // ── Scroll tracking ──
    const handleScroll = () => {
      const pct = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
          100,
      );
      if (pct > maxScroll) maxScroll = pct;
    };

    // ── Click tracking ──
    const handleClick = (e) => {
      const tag = e.target.closest("button, a");
      if (tag) {
        clicks.push({
          element: tag.tagName.toLowerCase(),
          text: tag.innerText?.trim().slice(0, 40) || "(no text)",
          at: formatDuration(Math.round((Date.now() - startTime) / 1000)),
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("click", handleClick);

    // ── Initial page view log (after location resolves) ──
    const logView = async () => {
      const loc = await getLocation();
      locationStr = loc.full;
      const countryCode = loc.countryCode;
      logToDiscord("📅 Booking Page Viewed", {
        "👤 Name": data.name || "Unknown",
        "📧 Email": data.email || "Not provided",
        "📞 Phone": data.phone || "Not provided",
        "📍 Location": locationStr,
        "🌎 Country Code": countryCode,
        "💻 Device": `${device} · ${os} · ${browser}`,
        "🔗 UTM Source": data.utm,
        "↩️ Referrer": document.referrer || "direct",
      });
    };
    logView();

    // ── Time-on-page checkpoints ──
    const CHECKPOINTS = [30, 60, 120, 180, 300]; // seconds
    const timers = CHECKPOINTS.map((secs) =>
      setTimeout(() => {
        logToDiscord(`⏱️ Still on page — ${formatDuration(secs)}`, {
          "👤 Name": data.name || "Unknown",
          "📍 Location": locationStr,
          "💻 Device": `${device} · ${os} · ${browser}`,
          "📜 Max Scroll": `${maxScroll}%`,
          "🖱️ Clicks": clicks.length ? clicks : "None yet",
        });
      }, secs * 1000),
    );

    // ── Page leave log ──
    const handleLeave = () => {
      logToDiscord("🚪 Left the Page", {
        "👤 Name": data.name || "Unknown",
        "📍 Location": locationStr,
        "💻 Device": `${device} · ${os} · ${browser}`,
        "⏱️ Time Spent": formatDuration(
          Math.round((Date.now() - startTime) / 1000),
        ),
        "📜 Max Scroll": `${maxScroll}%`,
        "🖱️ Clicks": clicks.length ? clicks : "None",
      });
    };
    window.addEventListener("beforeunload", handleLeave);

    // ── Wistia ──
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

    // ── Cleanup ──
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("beforeunload", handleLeave);
      timers.forEach(clearTimeout);
    };
  }, []);

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

    const message = `Hey it's ${attendeeData.name}. I just booked a call for ${timePhrase}`;
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
      {/* Banner */}
      <div className="bg-red-600 text-white px-2 h-14 flex items-center justify-center md:mb-20 mb-10 w-full">
        <p className="font-extrabold text-2xl tracking-wide leading-none">
          IMPORTANT:{" "}
          <span className="italic font-medium">
            Do not close or leave this page!
          </span>
        </p>
      </div>

      {/* Intro */}
      <section className="max-w-4xl px-3 mx-auto flex flex-col montserrat text-black font-extrabold">
        <h3 className="md:text-5xl text-2xl uppercase text-center">
          Wait!{" "}
          <span className="underline_tx">Your call is not complete...</span>
        </h3>
        <p className="mt-5 font-medium text-lg md:text-2xl text-center">
          …finish it by following these <strong>3 simple steps</strong> 👇
        </p>

        {/* Step 1 */}
        <div className="w-full mt-5">
          <StepHeader>Step #1: Watch Video Below in Full</StepHeader>
          <div
            className="mt-3 w-full rounded-2xl overflow-hidden border-4 border-brand"
            dangerouslySetInnerHTML={{ __html: WISTIA_EMBED("iu79a0m4ph") }}
          />
        </div>

        {/* Step 2 */}
        <div className="w-full mt-10">
          <StepHeader>Step #2: Add Event To Calendar</StepHeader>
          <img
            src={calaccept}
            alt="Calendar Accept"
            className="w-full border-4 rounded-2xl border-brand mt-5"
          />
          <p className="mt-5 font-medium text-lg md:text-2xl">
            Please confirm your appointment by selecting "Yes" in the email
            calendar invite (select "Add to calendar" to avoid missing your
            call).
          </p>
        </div>

        {/* Step 3 */}
        <div className="w-full mt-10">
          <StepHeader>Step #3: Confirm Your Call</StepHeader>
          <p className="mt-5 font-medium text-lg md:text-2xl">
            Tap the button below.{" "}
            <strong>
              This is required to secure your spot on the calendar.
            </strong>
            <br />
            <br />
            You will receive a reply from us to confirm your booking.
          </p>
          <button
            onClick={handleConfirm}
            className="mt-5 bg-green-500 hover:bg-green-600 text-white font-bold p-5 md:px-7 md:py-5 rounded-xl text-2xl md:text-3xl leading-none drop-shadow w-full flex items-center justify-center gap-3"
          >
            <FaWhatsapp className="text-4xl" /> Confirm My Call
          </button>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-4xl px-2 mx-auto mt-16 montserrat font-extrabold">
        <h2 className="md:text-4xl text-3xl uppercase text-center mb-2">
          Why is EstateKit <span className="text-green-600">The Best Way</span>
        </h2>
        <h2 className="md:text-4xl text-3xl uppercase text-center mb-8">
          To Scale Your Real Estate Business?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg"
            >
              <FaCheck className="text-green-500 mt-1 flex-shrink-0 text-xl" />
              <p className="font-semibold text-gray-800 text-sm md:text-base">
                {b}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-4xl px-2 mx-auto mt-10 montserrat font-extrabold">
        <img src={roster} className="mb-10 rounded drop-shadow" alt="" />
        <h3 className="md:text-5xl text-3xl uppercase text-center">
          Here's What Other{" "}
          <span className="text-brand">Real Estate Agents</span> Are Saying:
        </h3>
        <p className="mt-5 font-medium text-lg md:text-2xl text-center">
          Lebogang M. - "Chef's Kiss" - 65+ Leads at R9 each in 3 Days, 12
          Opportunities
        </p>
        <div
          className="mt-3 aspect-video w-full rounded overflow-hidden"
          dangerouslySetInnerHTML={{ __html: WISTIA_EMBED("ahm5osiwq8") }}
        />
        <div
          className="mt-3 aspect-video w-full rounded overflow-hidden"
          dangerouslySetInnerHTML={{ __html: WISTIA_EMBED("olb5byx60v") }}
        />
        <p className="font-bold text-xl md:text-2xl text-center mt-5">
          Agents in your area using this system are getting results like these
          RIGHT NOW...
        </p>
        <div className="flex flex-wrap gap-2 my-5">
          {TESTIMONIAL_IMAGES.map((t, i) => (
            <TestimonialImage key={i} {...t} />
          ))}
        </div>
      </section>

      {/* Who It's For */}
      <section className="max-w-4xl px-2 mx-auto mt-16 mb-16 montserrat font-extrabold">
        <h2 className="md:text-4xl text-2xl uppercase text-center mb-8">
          Who This Is For:
        </h2>
        <div className="space-y-4 mb-12">
          {FOR.map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-2xl text-green-600 flex-shrink-0">✔</span>
              <p className="text-lg text-gray-800 font-semibold">{item}</p>
            </div>
          ))}
        </div>

        <h2 className="md:text-4xl text-2xl uppercase text-center mb-8">
          Who This Is NOT For:
        </h2>
        <div className="space-y-4">
          {NOT_FOR.map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-2xl text-red-600 flex-shrink-0">❌</span>
              <p className="text-lg text-gray-800 font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Thanks;
