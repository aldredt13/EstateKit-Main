import AnnouncementBar from "../components/AnnouncementBar";
import CopyBridge from "../components/CopyBridge";
import BookingEmbed from "../components/BookingEmbed";
import SocialProof from "../components/SocialProof";
import TestimonialsSection from "../components/TestimonialsSection";
import ProofScreenshots from "../components/ProofScreenshots";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import WistiaPlayer from "../components/WistiaPlayer";
import Cal, { getCalApi } from "@calcom/embed-react";
import logo from "../../assets/secondary.svg";
import reslogo from "../../assets/RES.png";
import {
  FaCross,
  FaExclamation,
  FaStop,
  FaStopCircle,
  FaTimes,
} from "react-icons/fa";
import { FaCircleExclamation } from "react-icons/fa6";


// ─── Page ────────────────────────────────────────────────────────────────────
const PitchRES = () => {
  const isVSLPage = location.pathname.includes("vsl");

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "r7-lead-system" });

      cal("ui", {
        theme: "light",
        cssVarsPerTheme: {
          light: { "cal-brand": "#0086ff" },
          dark: { "cal-brand": "#0086ff" },
        },
        hideEventTypeDetails: true,
        layout: "month_view",
      });

      cal("on", {
        action: "bookingSuccessful",
        callback: (e) => {
          const { name, email, startTime } = e.detail.data;
          const whatsappLink = `https://wa.me/264852878236?text=Hi%20${encodeURIComponent(
            name.split(" ")[0],
          )}%20(re:%20${encodeURIComponent(e.detail.data.eventType.title)})`;

          logToDiscord("🎉 New Booking", {
            name: name.substring(0, 20),
            email: email.substring(0, 3) + "...@" + email.split("@")[1],
            time: startTime,
            type: e.detail.data.eventType.title,
            whatsapp: `[DM User](${whatsappLink})`,
          });
        },
      });

      cal("on", {
        action: "bookingFailed",
        callback: (e) => {
          logToDiscord("❌ Booking Failed", {
            error: e.detail.data.message.substring(0, 30) + "...",
          });
        },
      });
    })();
  }, []);

  return (
    <div className="bg-white text-slate-900 antialiased">
      <div className="bg-red-600 text-white text-xl font-black py-2 px-4 tracking-wide leading-tight gap-2 justify-center text-center">
        <FaCircleExclamation className="inline-flex"/> For Agents Impacted by the{" "}
        <span className="underline">POPI Act</span>
      </div>
      <div className="flex items-center gap-2 mx-auto w-full justify-center mt-5">
        <img src={reslogo} className="w-[100px]" alt="" />
        <FaTimes className="text-gray-400" />
        <img src={logo} className="w-[100px] ml-2.5" alt="" />
      </div>
      {/* 2. Hero — headline + VSL + primary CTA */}
      <section className="hero-section mx-auto px-4 sm:px-6 pt-8 md:pt-10 pb-4 md:pb-6 text-center">
        {/* Pre-head */}
        <p className="text-slate-600 text-base md:text-lg font-medium mb-3 tracking-wide">
          Cold calling is RISKY now... So where are your next listings coming
          from?
        </p>

        {/* Headline */}
        <h1 className="font-semibold text-3xl sm:text-4xl md:text-5xl leading-tight mb-4 max-w-5xl mx-auto capitalize">
          <span
            className="inline-flex items-end gap-2 mr-2"
            style={{ verticalAlign: "bottom" }}
          >
            <img
              src="https://images.prop24.com/277929050"
              className="w-10 md:w-14 rounded-full border-2 md:-mb-2 border-[#B5873E]"
              style={{ verticalAlign: "middle" }}
              alt=""
            />
            <span>Bennie</span>
          </span>
          <span className="text-brand font-black">
            got 35 seller appointments
          </span>{" "}
          & 282 leads in 43 days —{" "}
          <span className="text-brand underline decoration-brand font-black underline-offset-2">
            without a single cold call.
          </span>{" "}
        </h1>

        {/* VSL */}
        {isVSLPage && (
          <div className="my-4 md:my-5 max-w-2xl lg:max-w-3xl mx-auto">
            <WistiaPlayer mediaId="z6oqli7c8o" />
          </div>
        )}

        {/* Primary CTA */}
        <a
          href="#book"
          className="btn-pulse inline-block w-full sm:w-auto bg-brand text-white font-bold text-lg px-8 md:px-12 py-4 rounded my-5 uppercase tracking-wide"
        >
          See How It Works
        </a>
      </section>

      {/* 3. Copy bridge — leads into the calendar */}
      <CopyBridge />

      {/* 4. Cal.com booking embed */}
      <div id="book">
        {isVSLPage ? (
          <Cal
            namespace="10listingappts-vsl"
            calLink="estatekit/10listingappts-vsl"
            style={{ width: "100%", overflow: "scroll", borderRadius: "10px" }}
            config={{ layout: "month_view", theme: "light" }}
          />
        ) : (
          <Cal
            namespace="10listingappts"
            calLink="estatekit/10listingappts"
            style={{ width: "100%", overflow: "scroll", borderRadius: "10px" }}
            config={{ layout: "month_view", theme: "light" }}
          />
        )}
      </div>

      {/* 5. Social proof — agent avatars + count */}
      <SocialProof />

      {/* 6. Testimonial videos / audio */}
      <TestimonialsSection />

      {/* 7. Proof screenshots */}
      <ProofScreenshots />

      {/* 8. Final CTA */}
      <section className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14 text-center">
        <a
          href="#book"
          className="btn-pulse inline-block w-full sm:w-auto bg-brand text-white font-bold text-base md:text-lg px-10 md:px-14 py-3 md:py-4 rounded uppercase tracking-wide mb-2"
        >
          See How We Did It
        </a>
      </section>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
};

export default PitchRES;
