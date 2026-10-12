import { useCallback, useEffect, useRef, useState } from "react";
import CopyBridge from "../components/CopyBridge";
import SocialProof from "../components/SocialProof";
import TestimonialsSection from "../components/TestimonialsSection";
import TestimonialProof from "../components/TestimonialProof";
import TeamStrip from "../components/TeamStrip";
import ApplicationWidget from "../components/booking/ApplicationWidget";

import WistiaPlayer from "../components/WistiaPlayer";
import { usePageMeta } from "../hooks/usePageMeta";
import { useVideoTracking } from "../hooks/useVideoTracking";
import { postActivity } from "../lib/discordCards";
import { postToSheet } from "../lib/sheets";
import { formatDuration } from "../lib/analytics";
import heroBg from "../../assets/training-hero-bg.webp";
import logo from "../../assets/primary.svg";

const PitchVSL = () => {
  const isVSLPage = location.pathname.includes("pitch-vsl");

  const [qualification, setQualification] = useState(null);
  const { getFields: getVideoFields } = useVideoTracking();
  const arrivedAtRef = useRef(0);
  const inlineRef = useRef(null);

  useEffect(() => {
    arrivedAtRef.current = Date.now();
    postToSheet("pageview", {});
  }, []);

  const getEngagement = useCallback(
    () => ({
      "⏱️ Time on Page": formatDuration(
        Math.round((Date.now() - arrivedAtRef.current) / 1000),
      ),
      ...getVideoFields(),
    }),
    [getVideoFields],
  );

  /**
   * The widget owns the form; the page owns the reporting that the old
   * QualifyingForm used to do internally.
   */
  const handleComplete = useCallback(
    (result) => {
      setQualification(result);
      const engagement = getEngagement();

      postActivity(result.qualified ? "reached" : "disqualified", {
        who: result.contact.name,
        fields: {
          Phone: result.contact.phone,
          Email: result.contact.email,
          Score: `${result.score}/100 · ${result.band}`,
          "PPRA status": result.breakdown[0]?.answer,
          "Transactions (6mo)": result.breakdown[1]?.answer,
          Engagement: `${engagement["⏱️ Time on Page"]} · ${engagement["🎬 Videos Played"]}`,
        },
      });

      postToSheet("submission", {
        name: result.contact.name,
        email: result.contact.email,
        phone: result.contact.phone,
        area: result.answers.area || "",
        ppra: result.breakdown[0]?.answer || "",
        deals: result.breakdown[2]?.answer || "",
        timeline: result.breakdown[3]?.answer || "",
        score: result.score,
        band: result.band,
        qualified: result.qualified,
      });
    },
    [getEngagement],
  );

  /** Booking now happens in-page, so it reports from here rather than Cal. */
  const handleBooked = useCallback(({ start, form }) => {
    const email = form.email.trim();
    const name = `${form.firstName} ${form.lastName}`.trim();

    postActivity("booked", {
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

    postToSheet("booking", { email, startTime: start });
  }, []);

  // Every CTA points at the one form. Rather than opening a second copy of it
  // in a modal, we bring them to it and flash it so it's obvious what they
  // were sent to — the pulse is keyed off a counter so repeat clicks re-fire.
  const handleCtaClick = useCallback(() => {
    inlineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

    postActivity("started", {
      who: "Visitor",
      fields: {
        Action: "Clicked through to the application",
        "On page": formatDuration(
          Math.round((Date.now() - arrivedAtRef.current) / 1000),
        ),
        Videos: getVideoFields()["🎬 Videos Played"] || "None",
      },
    });

    if (qualification) return;

  }, [qualification, getVideoFields]);

  // Land them on the outcome once the quiz resolves.
  useEffect(() => {
    if (qualification) {
      inlineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [qualification]);

  usePageMeta({
    title: "Guaranteed Closed Deals or Your Money Back | EstateKit",
    description:
      "A proven system that delivers real listing appointments and closed deals for real estate agents — guaranteed, or your money back.",
    path: isVSLPage ? "/pitch-vsl" : "/pitch",
  });

  return (
    <div className="bg-white text-slate-900 antialiased">
      <div className="bg-red-600 text-white p-2 flex items-center justify-center gap-1 w-full text-center font-bold text-xl leading-none">
        ESTABLISHED PROPERTY PRACTITIONERS
      </div>
      {/* 1. Hero — headline + VSL + primary CTA */}
      <section
        className="relative mx-auto px-4 sm:px-6 pt-5 pb-20 md:pb-22 text-center bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundPosition: "center",
        }}
      >
        {/*OVERLAY COLOR*/}
        <div className="absolute inset-0 bg-white backdrop-blur-[3px] pointer-events-none" />
        <div className="relative">
          {/* Logo */}
          <div className="mb-5 hidden">
            <img src={logo} alt="EstateKit Logo" className="h-8 mx-auto" />
          </div>

          {/* Pre-head */}
          <div className="bg-white hidden transform mx-auto w-fit  text-sm px-3 sm:px-4 py-2 drop-shadow rounded-full text-slate-900 mb-5 font-black tracking-wide flex items-center justify-center gap-1 flex-wrap max-w-full sm:w-fit">
            <span className="text-red-500 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <div className="bg-red-500 rounded-full min-w-2 min-h-2 sm:min-w-3 sm:min-h-3"></div>

              <span>FULL-STATUS PROPERTY PRACTITIONERS!</span>
            </span>
          </div>

          <div>
            {/* Headline */}
            <h1 className="font-semibold text-3xl sm:text-4xl md:text-5xl leading-tight mb-10 mt-5 max-w-5xl mx-auto text-black">
              We{" "}
              <span className="text-brand font-black">
                GUARANTEE{" "}
                <span className="underline decoration-brand font-black underline-offset-2">
                  Closed Deals
                </span>
              </span>{" "}
              Or Your Money Back — A Proven System That Delivers{" "}
              <span className="text-brand font-black">
                Real Results, Without the Risk.
              </span>
            </h1>
            <p className="text-white/80 hidden text-lg sm:text-xl md:text-2xl font-normal max-w-3xl mx-auto drop-shadow my-5">
              Stop wasting time with flaky leads and unpredictable marketing. A
              proven system that delivers real results, without the risk.
            </p>
          </div>

          {/* VSL */}
          {isVSLPage && (
            <div className="my-4 md:my-5 max-w-2xl lg:max-w-3xl mx-auto">
              <WistiaPlayer mediaId="z6oqli7c8o" />
            </div>
          )}

        <section
          ref={inlineRef}
          id="qualify"
          className="scroll-mt-6 sm:px-6 pb-10 md:pb-12"
        >

          <ApplicationWidget
            title="EstateKit Discovery Call"
            description={
              <>
                <p>
                  A 45-minute call where we map the exact seller-attraction system
                  to your suburbs — and tell you straight if it isn't a fit.
                </p>
                <p>
                  <strong>If none of the times on the calendar work for you:</strong>
                </p>
                <p>
                  ⏰ WhatsApp us and we'll find a slot that does: +264 85 287 8236
                </p>
              </>
            }
            onComplete={handleComplete}
            onBook={handleBooked}
          />
        </section>
        </div>

      </section>

      <SocialProof />

      {/* 2. Proof — runs before the ask, so the gap is open when it lands */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 pb-6 md:pb-8 text-center">
        {/* Pill badge */}
        <div className="md:bg-slate-100 mx-auto w-fit px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm text-slate-900 mb-6 font-black tracking-wide flex items-center justify-center gap-2 flex-wrap max-w-full">
          <span className="text-amber-400 tracking-wider leading-none text-2xl">
            ★★★★★
          </span>
          <span className="uppercase text-lg">
            Loved by top-producing SA agents
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-black uppercase max-w-2xl mx-auto xl text-3xl sm:text-4xl md:text-5xl text-slate-900 leading-tight">
          What{" "}
          <span className="text-brand underline decoration-4 underline-offset-4">
            Agents
          </span>{" "}
          Say About This System
        </h2>

        {/* Subline */}
        <p className="text-slate-900 font-medium text-lg mt-4">
          Hear from them below
        </p>
      </section>

      {/* 6. Testimonial videos / audio */}
      <TestimonialsSection />

      {/* 7. Proof screenshots */}
      <TestimonialProof />

      {/* Second ask — placed where the proof has just landed, not at the
          footer where only the already-convinced ever reach. */}
      <section className="bg-slate-900 px-4 py-14 text-center sm:px-6">
        <h2 className="mx-auto max-w-2xl text-3xl font-black uppercase leading-tight text-white sm:text-4xl">
          Every agent above started with one application
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
          Two questions, about ninety seconds. We only take on agents we know
          we can get results for.
        </p>
        <button
          type="button"
          onClick={handleCtaClick}
          className="mt-8 inline-block w-11/12 rounded bg-brand px-8 py-5 text-xl font-black uppercase leading-none tracking-wide text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          Check if you qualify
        </button>
      </section>



      {/* Faces behind the offer, just above the footer */}
      <TeamStrip />

      {/* 9. Custom Footer */}
      <footer className="bg-blue-950 text-white py-5 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Heading */}
          <h2 className="text-2xl  font-black mb-5 tracking-wide">
            Book Your Free Discovery Call
          </h2>

          {/* CTA Button */}
          <button
            type="button"
            onClick={handleCtaClick}
            className="inline-block w-11/12 mx-auto sm:w-auto bg-brand text-white font-bold px-3 sm:px-5 md:px-6 py-4 md:py-5 rounded uppercase tracking-wide hover:shadow-lg transition-shadow z-10"
          >
            <p className="leading-none font-black tracking-normal text-2xl">
              SEE HOW WE DID IT
            </p>
          </button>

          {/* Disclaimer Section */}
          <div className="pt-8 text-xs sm:text-sm leading-relaxed text-slate-300 space-y-4">
            <p>
              <a
                href="#"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Terms & Conditions
              </a>
            </p>
            <p className="text-slate-500">
              © 2026 EstateKit. All rights reserved.
            </p>
            <p>
              Facebook disclaimer: This site is not a part of the Facebook
              website or Facebook Inc. Additionally, this site is NOT endorsed
              by Facebook in any way. Facebook is a trademark of Facebook, Inc.
            </p>

            {/* Logo */}
            <div className="pt-4">
              <img
                src={logo}
                alt="EstateKit Logo"
                className="h-8 sm:h-10 mx-auto opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PitchVSL;
