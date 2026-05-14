import { useEffect, useRef, useState } from "react";
import { FiX, FiShield, FiZap } from "react-icons/fi";

export default function LeadModal() {
  const [visible, setVisible] = useState(false);
  const firedRef = useRef(false);

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    setVisible(true);
  };

  useEffect(() => {
    // ── 1. Exit-intent ──────────────────────────────────────────
    const handleMouseOut = (e) => {
      if (!e.relatedTarget && e.clientY < 10) fire();
    };
    document.documentElement.addEventListener("mouseout", handleMouseOut);

    // ── 2. 3-second timer fallback (fires every visit) ──────────
    const timer = setTimeout(fire, 3_000);

    return () => {
      document.documentElement.removeEventListener("mouseout", handleMouseOut);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(5px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setVisible(false); }}
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF9F7] rounded shadow-2xl flex flex-col"
        style={{
          maxHeight: "95vh",
          animation: "ekModalIn 0.35s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <div className="h-1.5 w-full bg-brand rounded-t flex-shrink-0" />

        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 z-10 text-slate-300 hover:text-slate-600 transition-colors bg-white rounded-full p-1"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>

        <div className="px-7 pt-5 pb-3 text-center flex-shrink-0">

          <h2 className="text-xl sm:text-2xl font-black  leading-tight mb-1.5">
            We guarantee <strong className="text-brand">CLOSED DEALS</strong> or
            you <span className="underline">don't pay!</span>
          </h2>

          <p className="text-slate-500 font-semibold text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">
             Enter your details below to see how 👇
          </p>

        </div>

        <div className="flex-shrink-0 pb-4">
          <iframe
            src="https://pitch.estatekit.co/test"
            id="estatekit-form-abb9dd31-f957-4bf6-9eba-8ac30f3a2dd6"
            style={{
              width: "100%",
              height: "520px",
              border: "none",
              display: "block",
            }}
            scrolling="no"
            loading="lazy"
            title="EstateKit Form"
          />
        </div>
      </div>

      <style>{`
        @keyframes ekModalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}