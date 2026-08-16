import { useEffect, useState } from "react";
import "./Webinar.css";

// ── Config, edit these to launch ──────────────────────────────────────────────
const CONFIG = {
  // Where every "Schedule A Call" button sends people (your Cal.com link)
  bookingUrl: "https://cal.com/estatekit/strategy-call",
  // Main VSL / explainer video embed url ("" shows a placeholder)
  vslEmbedUrl: "",
  // Testimonial video embed urls per case-study card ("" shows a placeholder)
  testimonials: { bennie: "", sakhile: "", siva: "", jacques: "" },
};


const CASES = [
  { id: "bennie",  tag: "Case Study 01", name: "Bennie Bell", stat: "282 leads → 35 appointments in 43 days",
    before: "leaning on cold calling and inconsistent referrals with a pipeline that reset to zero every month.",
    after:  "282 pre-qualified seller leads and 35 booked listing appointments in 43 days, without dialling a single stranger." },
  { id: "sakhile", tag: "Case Study 02", name: "Sakhile", stat: "6 sold mandates in his first 2 weeks",
    before: "grinding for roughly one mandate a month, chasing sellers who didn't want the call.",
    after:  "6 sold mandates inside his first two weeks, sellers coming to him instead of the other way around." },
  { id: "siva",    tag: "Case Study 03", name: "Sivanasen", stat: "100+ booked appointments, zero cold calls",
    before: "hours a day working stale Property24 listings for a ~10% hit rate.",
    after:  "over 100 booked seller appointments landing straight in his calendar, every one of them without a single cold call." },
  { id: "jacques", tag: "Case Study 04", name: "Jacques", stat: "250+ pre-vetted leads in 4 weeks",
    before: 'burned by "rubbish" DIY Facebook leads with no real qualification behind them.',
    after:  "250+ pre-vetted, high-quality seller leads in 4 weeks, ready to talk before he ever picks up the phone." },
];

const IFRAME_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

function BookBtn({ children = "Schedule A Call" }) {
  const href = CONFIG.bookingUrl || "#book";
  const ext = !!CONFIG.bookingUrl;
  return (
    <a className="btn book" href={href} {...(ext ? { target: "_blank", rel: "noopener" } : {})}>
      {children}
    </a>
  );
}

function VideoFrame({ url, placeholder }) {
  return (
    <div className="video">
      {url ? (
        <iframe src={url} allow={IFRAME_ALLOW} allowFullScreen title="video" />
      ) : (
        <div className="ph">
          <div className="play" />
          <div>{placeholder}</div>
        </div>
      )}
    </div>
  );
}

export default function Webinar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = "EstateKit, Book Pre-Qualified Seller Appointments Without Cold Calling";
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="webinar">
      {/* ── fixed banner header, icon + name centered, frosts on scroll ── */}
      <header className={`wb-header${scrolled ? " scrolled" : ""}`}>
        <div className="wb-brand">
          <svg className="wb-mark" viewBox="0 0 41.6 41.59" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true">
            <path d="m10.1,39.42c-1.82,0-1.89,0-2.15-.04-4.55-.38-7.95-3.84-7.95-8.06v-15.1c0-2.7,1.34-5.21,3.59-6.71L15.81,1.36c2.72-1.81,6.23-1.81,8.95,0l12.22,8.14c2.25,1.5,3.59,4.01,3.59,6.71v15.1c0,2.16-.84,4.19-2.38,5.72-1.52,1.52-3.54,2.35-5.69,2.35h-.04c-1.27,0-2.3-1.04-2.29-2.32,0-1.27,1-2.29,2.32-2.29h.02c.92,0,1.79-.36,2.44-1.01.66-.65,1.02-1.52,1.02-2.45v-15.1c0-1.16-.58-2.23-1.54-2.88l-12.22-8.14c-1.17-.78-2.67-.78-3.84,0L6.15,13.34c-.96.64-1.54,1.72-1.54,2.88v15.1c0,2.08,1.85,3.31,3.68,3.46l.23.02c.17,0,1.55,0,4.66,0h0c1.27,0,2.3,1.03,2.31,2.3,0,1.27-1.03,2.31-2.3,2.31-1.38,0-2.37,0-3.09,0Z" />
            <path d="m31.09,10.02c-.16,0-.32-.02-.48-.05-1.25-.26-2.04-1.49-1.78-2.73l1.14-5.4c.26-1.25,1.49-2.04,2.73-1.78,1.25.26,2.04,1.49,1.78,2.73l-1.14,5.4c-.23,1.09-1.19,1.83-2.25,1.83Z" />
            <path d="m11.93,17.05c-.09-.3-.39-.49-.7-.46-1.09.14-3.43.85-2.78,4.48s2.96,3.83,4.12,3.78c.34-.02.6-.28.61-.62.03-.63.36-1.62,1.99-1.91,2.25-.4,2.43,1.34,2.45,1.63v.08s2.62,15.04,2.73,15.76c.11.71.54,2.06,2.26,1.75l1.62-.29s1.86-.28,1.48-2.42l-2.58-14.76c-.18-1.03-.07-2.1.38-3.05.67-1.41,2.14-2.77,5.38-1.39,5.64,2.39,2.4-1.58,2.4-1.58,0,0-1.37-1.71-3.89-2.75-1.55-.64-3.26-.8-4.92-.55l-5.7.86c-.33.05-.58.36-.56.7.02.59-.24,1.46-1.86,1.75-2.17.39-2.18-.13-2.44-1.01Z" />
          </svg>
          <span className="wb-name">EstateKit</span>
        </div>
      </header>

      {/* ── hero / VSL ── */}
      <header className="hero">
        <div className="wrap">
          <div className="watch">Watch Here:</div>
          <h1>How SA Agents Are Booking <span className="hl">Pre-Qualified Seller Appointments</span> Without A Single Cold Call</h1>

          <VideoFrame
            url={CONFIG.vslEmbedUrl}
            placeholder={<>Your explainer video loads here<br /><small>(add your VSL embed link in the CONFIG block)</small></>}
          />

          <div className="steps">
            <span className="pill">Step 1: Watch The Explainer Video</span>
            <div className="divider" />
            <span className="pill">Step 2: Schedule Your Call</span>
            <BookBtn />
          </div>
        </div>
      </header>

      {/* ── case studies ── */}
      <section className="alt">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">Case Studies</div>
            <h2>Real Agents. Real Mandates. Zero Cold Calls.</h2>
            <p>A few of the South African agents already filling their calendars with pre-qualified seller appointments, while cold calling gets crippled by the POPI Act and the CPA amendment.</p>
          </div>

          <div className="cards">
            {CASES.map(c => (
              <article className="card" key={c.id}>
                <span className="tag">{c.tag}</span>
                <h3>{c.name}</h3>
                <div className="stat">{c.stat}</div>
                <p>
                  <strong style={{ color: "var(--ice-dim)" }}>Before:</strong> {c.before}{" "}
                  <strong style={{ color: "var(--ice-dim)" }}>After:</strong> {c.after}
                </p>
                <VideoFrame url={CONFIG.testimonials[c.id]} placeholder="Video testimonial / interview below" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="cta-band">
        <div className="wrap">
          <div className="eyebrow">Schedule Your Call</div>
          <h2>Sellers should be calling <span style={{ color: "var(--gold)" }}>you</span>. Not the reverse.</h2>
          <p>The law already killed cold calling. On a short call we'll show you the exact Meta ads + done-for-you qualification funnel replacing it, pre-qualified sellers landing in your calendar, called within minutes, ready to talk.</p>
          <BookBtn />
        </div>
      </section>

      {/* ── screenshots of wins ── */}
      <section className="alt">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">The Proof, Unfiltered</div>
            <h2>Screenshots Of Wins</h2>
            <p>Real WhatsApp notifications, booked calendars and closed mandates from agents running the system across South Africa.</p>
          </div>
          <div className="wins">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div className="win" key={n}>Drop win screenshot {n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── final CTA ── */}
      <section className="cta-band" id="book">
        <div className="wrap">
          <div className="eyebrow">Schedule Your Call</div>
          <h2>Lock down your farming area before a competitor does.</h2>
          <p>We only work with a handful of agents per area, one-agent-per-territory exclusivity. Book your call and see if your suburb is still open.</p>
          <BookBtn />
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="fnote">
            <strong>EstateKit</strong>, done-for-you seller lead generation for South African real estate agents.<br />
            Results shown are from real EstateKit clients and are not a guarantee of your own results.<br />
            © {new Date().getFullYear()} EstateKit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
