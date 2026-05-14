import { useState, useEffect } from "react";
import {
  FiTarget,
  FiUsers,
  FiDatabase,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiDollarSign,
  FiYoutube,
  FiInstagram,
  FiLinkedin,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiArrowRight,
  FiPhone,
  FiMail,
  FiMapPin,
  FiStar,
} from "react-icons/fi";

import flagsa from "../../assets/zaflag.png";
import logo from "../../assets/secondary.svg";
import logo2 from "../../assets/primary.svg";
import badge from "../../assets/badge2.png";
import kieran from "../../assets/kieran.png";
import aldredt from "../../assets/aldredt.jpg";
import khushil from "../../assets/khushil.webp";
import kellerwilliam from "../../assets/kw.png";
import coldwellbanker from "../../assets/cb.png";
import c21 from "../../assets/c21.png";
import remax from "../../assets/remax.png";
import redfin from "../../assets/redfin.png";
import sothebys from "../../assets/stb.png";
import exprealty from "../../assets/exp.png";
import TestimonialsSection from "../components/TestimonialsSection";
import Cal, { getCalApi } from "@calcom/embed-react";
import LeadModal from "../components/LeadModal";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV = ["About", "Services", "Testimonials", "Contact"];

const SERVICES = [
  {
    Icon: FiTarget,
    title: "Lead Generation",
    desc: "Facebook, Instagram, YouTube and Google campaigns designed to generate high-quality leads for your real estate business.",
    bullets: [
      "Multi-platform advertising",
      "Targeted campaigns",
      "ROI-focused strategies",
    ],
  },
  {
    Icon: FiUsers,
    title: "ISA Services",
    desc: "Book appointments on autopilot with our Inside Sales Agents who qualify and nurture your leads around the clock.",
    bullets: [
      "Experienced ISA's",
      "24/7 lead follow-up",
      "Appointment booking",
    ],
  },
  {
    Icon: FiDatabase,
    title: "CRM & Nurturing",
    desc: "Custom CRM setup with 12+ month follow-up sequences to ensure no lead falls through the cracks.",
    bullets: ["Custom CRM setup", "Automated sequences", "Long-term nurturing"],
  },
  {
    Icon: FiZap,
    title: "Done-For-You Marketing",
    desc: "Complete marketing service including landing pages, email campaigns, and full-funnel management.",
    bullets: ["Landing pages", "Email campaigns", "Full-service management"],
  },
];

const GUARANTEE = [
  {
    Icon: FiShield,
    title: "Zero Risk",
    desc: "No monthly retainers. Partnership agreements with money-back guarantees if we don't deliver results within your contract term.",
  },
  {
    Icon: FiTrendingUp,
    title: "Performance-Guaranteed",
    desc: "We're committed to delivering closed deals within your agreement timeline. Your success drives our partnership.",
  },
  {
    Icon: FiDollarSign,
    title: "Guaranteed ROI",
    desc: "Our track record speaks for itself. We guarantee results within your contract term, or we refund your service investment.",
  },
];

const STATS = [
  { value: "300+", label: "Agents Served" },
  { value: "1,200+", label: "Deals Closed" },
  { value: "$50M+", label: "Sales Generated" },
  { value: "5,000+", label: "Appointments Booked" },
];

const TESTIMONIALS = [
  {
    text: "The fact that I can talk to you - a person. The telephonic help",
    name: "Bennie Bell",
    role: "Real Estate Professional",
  },
  {
    text: "Would definitely recommend EstateKit to any other Realtors looking to up their marketing game. Incredible results from day one.",
    name: "Avery Marcoux",
    role: "REALTOR",
  },
  {
    text: "A hard working team that will communicate better than any company I've ever worked with. Absolutely fantastic experience.",
    name: "Ben Robitaille",
    role: "Real Estate Professional",
  },
];

const FAQS = [
  {
    q: "How much does your service cost?",
    a: "Our pricing is customised to your market, goals, and the services you need. Book a discovery call to receive a tailored proposal.",
  },
  {
    q: "What makes your guarantee different?",
    a: "We eliminate monthly retainers entirely. If we don't deliver closed deals within your contract term, we refund your full investment — no questions asked.",
  },
  {
    q: "Do you work with South African agents?",
    a: "Absolutely. We specialise in working with South African real estate professionals and understand the local market across Cape Town, Johannesburg, Durban, and beyond.",
  },
  {
    q: "What's included in your services?",
    a: "Lead generation, ISA services, CRM & nurturing, and done-for-you marketing — all handled in-house by our expert team. Zero outsourcing.",
  },
  {
    q: "How quickly can I expect results?",
    a: "Most clients see qualified appointments within the first 2–4 weeks. Our guarantee ensures you're protected either way.",
  },
  {
    q: "Is there a minimum commitment?",
    a: "We work on partnership agreements, not month-to-month retainers. The length depends on your goals — we'll discuss this on the discovery call.",
  },
];

const TEAM = [
  {
    name: "Kieran Ouseb",
    role: "Founder",
    initials: kieran,
  },
  { name: "Aldredt Malinga", role: "CTO", initials: aldredt },
  { name: "Khushil Govind", role: "Client Success", initials: khushil },
];

const BROKERAGES = [
  c21,
  remax,
  redfin,
  sothebys,
  exprealty,
  kellerwilliam,
  coldwellbanker,
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stars({ size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <FiStar
          key={i}
          size={size}
          fill="#f59e0b"
          color="#f59e0b"
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

function SectionTag({ icon: Icon, children }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-brand text-xs font-bold uppercase tracking-widest rounded-full px-3.5 py-1.5 mb-5">
      {Icon && <Icon size={15} />}
      {children}
    </div>
  );
}

function ServiceCard({ Icon, title, desc, bullets }) {
  return (
    <div className="bg-white border-2 border-slate-200 rounded p-8 hover:border-brand hover:shadow-lg hover:shadow-blue-50 transition-all duration-200">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-s, bg-brand flex items-center justify-center text-white mb-5">
          <Icon size={22} />
        </div>
        <h3 className="font-extrabold text-lg text-slate-900 mb-2.5">
          {title}
        </h3>
      </div>
      <p className="text-slate-500 text-sm leading-relaxed mb-5">{desc}</p>
      {bullets.map((b) => (
        <div
          key={b}
          className="flex items-center gap-2.5 text-slate-500 text-sm mb-2"
        >
          <span className="flex items-center justify-center flex-shrink-0">
            <FiCheck size={18} className="text-brand" strokeWidth={3} />
          </span>
          {b}
        </div>
      ))}
    </div>
  );
}

function GuaranteeCard({ Icon, title, desc }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-8 text-center hover:border-brand hover:shadow-lg hover:shadow-blue-50 transition-all duration-200">
      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-brand mx-auto mb-4">
        <Icon size={22} />
      </div>
      <h3 className="font-extrabold text-base text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function TestimonialCard({ text, name, role }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-2 hover:border-brand hover:shadow-lg hover:shadow-blue-50 transition-all duration-200 h-fit">
      <Stars />
      <p className="text-slate-500 text-sm leading-relaxed mt-4 mb-5 italic">
        "{text}"
      </p>
      <hr className="border-slate-200 mb-4" />
      <p className="font-extrabold text-slate-900 text-sm">{name}</p>
      <p className="text-slate-400 text-xs mt-0.5">{role}</p>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      className={`border rounded-s, px-6 py-5 cursor-pointer mb-2.5 transition-all duration-200 ${
        open ? "border-brand bg-blue-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex justify-between items-center gap-4">
        <span className="font-bold text-sm text-slate-900 flex-1">{q}</span>
        {open ? (
          <FiChevronUp size={17} className="text-brand flex-shrink-0" />
        ) : (
          <FiChevronDown size={17} className="text-slate-400 flex-shrink-0" />
        )}
      </div>
      {open && (
        <p className="text-slate-500 text-sm leading-relaxed mt-3">{a}</p>
      )}
    </div>
  );
}

function MobileMenu({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      <div className="flex justify-between items-center h-16 px-6 border-b border-slate-200">
        <img src={logo} className="w-32" alt="" />
        <button onClick={onClose} className="text-slate-800">
          <FiX size={24} />
        </button>
      </div>
      <div className="flex-1 px-6 pt-2">
        {NAV.map((l) => (
          <a
            key={l}
            href={`#${l.toLowerCase()}`}
            onClick={onClose}
            className="block py-5 border-b border-slate-100 font-bold text-base text-slate-800"
          >
            {l}
          </a>
        ))}
        <div className="mt-7">
          <button className="w-full bg-brand text-white font-bold text-sm rounded-lg py-4 flex items-center justify-center gap-2">
            Book Discovery Call <FiArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="font-[Montserrat,sans-serif] antialiased bg-white text-slate-900">
      {/* ══ NAV ══ */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <nav
        className={`sticky top-0 z-[100] bg-white/95 backdrop-blur-md transition-all duration-300 ${scrolled ? "border-b border-slate-200" : ""}`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <img src={logo} className="w-32" alt="" />

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-9">
            {NAV.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="text-black hover:text-brand text-sm font-semibold transition-colors"
              >
                {l}
              </a>
            ))}
            <a
              href="#contact"
              className="bg-brand hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded transition-colors"
            >
              Book Now
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-slate-800"
            onClick={() => setMobileOpen(true)}
          >
            <FiMenu size={24} />
          </button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section
        className="relative pt-10 pb-10"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1800&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70 pointer-events-none"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center gap-16">
              {/* Left */}
              <div className="w-full flex items-center justify-center flex-col text-center drop-shadow-md">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-5 text-white">
                  Real Estate
                  <br />
                  <span className="text-brand">Specialised</span>
                  <br />
                  Marketing
                </h1>

                <p className="text-white text-base font-normal sm:text-lg leading-relaxed max-w-2xl">
                  South African based agency, working with agents across the
                  nation. All services done in house. We get you deals. It's
                  that simple!
                </p>
                <img src={badge} className="h-20 my-5" alt="" />
                <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full sm:w-auto">
                  <a
                    href="#contact"
                    className="bg-brand hover:bg-blue-700 text-white font-bold text-sm w-full md:w-fit px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    Book Discovery Call <FiArrowRight size={20} />
                  </a>
                  <a
                    href="#services"
                    className="border-2 border-slate-200 hover:border-brand hover:text-white text-white hover:bg-brand/50 font-semibold text-sm w-full md:w-fit px-6 py-3 rounded-lg transition-colors"
                  >
                    Learn More
                  </a>
                </div>

                <div className="flex items-center mx-auto text-center gap-3 flex-wrap justify-center">
                  <Stars size={15} />
                  <span className="font-bold text-sm text-white">
                    4.7 Rating
                  </span>
                  <span className="text-slate-300 text-sm">
                    · Trusted by <strong className="text-white">30+</strong>{" "}
                    Real Estate Agents
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ BROKERAGES ══ */}
      <section className="bg-brand py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-white text-[10px] font-bold uppercase tracking-[.14em] mb-6">
            Trusted by Agents from Leading Brokerages
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4">
            {BROKERAGES.map((b) => (
              <span key={b}>
                <img src={b} className="h-[30px]" alt="" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="flex justify-center">
              <SectionTag icon={FiZap}>What We Do</SectionTag>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">
              How We Help SA Agents <span className="text-brand">Succeed</span>
            </h2>
            <p className="text-slate-500 text-base max-w-lg mx-auto">
              All services done in-house by our expert team. No outsourcing, no
              excuses.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SERVICES.map((s) => (
              <ServiceCard key={s.title} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED TESTIMONIAL ══ */}
      <section className="bg-blue-50 hidden border-t border-b border-slate-200 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <Stars size={18} />
          </div>
          <blockquote className="italic text-xl sm:text-2xl font-medium text-slate-800 leading-relaxed mb-10">
            "Within just six months of partnering with EstateKit, I generated
            over $5 million in new listing volume. The quality of leads and the
            consistency of appointments exceeded my expectations. It completely
            transformed my pipeline."
          </blockquote>
          <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center text-white font-black text-lg mx-auto mb-3">
            DC
          </div>
          <p className="font-extrabold text-slate-900">Daniel Cheatley</p>
          <p className="text-slate-400 text-sm mt-1">
            Tyler Mclay Realty Brokerage
          </p>
        </div>
      </section>

      {/* ══ TEAM ══ */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex justify-center">
              <SectionTag icon={FiUsers}>Our Team</SectionTag>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">
              Meet Your <span className="text-brand">Success Partners</span>
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              A dedicated team of marketing experts, ISAs, account managers, and
              creative professionals working together to fuel your success.
            </p>
          </div>

          {/* Avatar row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 max-w-xl mx-auto gap-4 mb-12">
            {TEAM.map((m, i) => (
              <div key={i} className="text-center">
                <div
                  className={`w-16 h-16 rounded-full mx-auto mb-2.5 flex items-center justify-center font-extrabold text-base border-2 ${
                    m.primary
                      ? "bg-brand text-white border-brand"
                      : "bg-slate-50 text-brand border-slate-200"
                  }`}
                >
                  <img className="rounded-full" src={m.initials} alt="" />
                </div>
                <p className="font-bold text-slate-800 leading-tight">
                  {m.name}
                </p>
                <p className="text-slate-400 font-medium text-sm mt-0.5">
                  {m.role}
                </p>
              </div>
            ))}
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                Icon: FiUsers,
                title: "Expert Account Managers",
                desc: "Your dedicated success partner for strategy and growth",
              },
              {
                Icon: FiPhone,
                title: "Full-Time ISA's",
                desc: "Professional lead follow-up that converts prospects to clients",
              },
              {
                Icon: FiZap,
                title: "Inhouse Editors",
                desc: "Creative team producing scroll-stopping content",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-brand/5 border-2 border-brand/20 rounded p-7 text-center"
              >
                <div className="w-12 h-12 rounded-full border border-slate-200 bg-brand flex items-center justify-center text-white mx-auto mb-4">
                  <item.Icon size={22} />
                </div>
                <p className="font-extrabold text-sm text-slate-900 mb-2">
                  {item.title}
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="bg-brand py-16 hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-white font-black text-5xl sm:text-6xl leading-none">
                  {s.value}
                </p>
                <p className="text-blue-100 font-semibold text-sm mt-3">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-24 bg-slate-50 hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex justify-center">
              <SectionTag icon={FiStar}>Client Stories</SectionTag>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">
              What Our Clients <span className="text-brand">Say</span>
            </h2>
            <p className="text-slate-500 text-base max-w-lg mx-auto">
              Real results from real estate professionals across South Africa
              and beyond.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ VIDEO / RESULTS ══ */}
      <section className="py-24 bg-white" id="testimonials">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex justify-center">
            <SectionTag icon={FiUsers}>Who We Work With</SectionTag>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">
            Real Leads, <span className="text-brand">Real Results</span>
          </h2>
          <p className="text-slate-500 text-base max-w-md mx-auto mb-12">
            Get inspired by these realtors' success stories.
          </p>

          <TestimonialsSection />
        </div>
      </section>

      {/* ══ GUARANTEE ══ */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex justify-center">
            <SectionTag icon={FiShield}>Our Guarantee</SectionTag>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">
            We <span className="text-brand">GUARANTEE</span> Results
            <br className="hidden sm:block" />
            Within Your Partnership Agreement
          </h2>
          <p className="text-slate-500 text-base max-w-lg mx-auto mb-14">
            The only real estate marketing agency that refunds your investment
            if we don't deliver.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto mb-10">
            {GUARANTEE.map((g) => (
              <GuaranteeCard key={g.title} {...g} />
            ))}
          </div>

          <div className="max-w-3xl mx-auto border-2 border-brand rounded bg-brand px-3 sm:px-12 py-3 text-white text-lg font-semibold leading-relaxed">
            We're so confident in our ability to generate results that we've
            eliminated monthly retainers entirely. Our partnership agreements
            are performance-guaranteed: if we don't deliver closed deals within
            your contract term, we refund your service investment. No hidden
            fees — just transparent partnerships with guaranteed results.
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex justify-center">
              <SectionTag icon={FiZap}>FAQ</SectionTag>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">
              Frequently Asked <span className="text-brand">Questions</span>
            </h2>
            <p className="text-slate-500 text-base max-w-md mx-auto">
              Everything you need to know about working with us.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            {FAQS.map((f) => (
              <FAQItem key={f.q} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ BOOKING / CALENDAR ══ */}
      <section
        id="contact"
        className="py-24 bg-slate-50 border-t border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex justify-center">
            <SectionTag icon={FiPhone}>Book a Call</SectionTag>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">
            Discover how we{" "}
            <span className="text-brand">GUARANTEE CLOSED DEALS</span> or you{" "}
            <span className="text-brand">DON'T PAY!</span>
          </h2>
          <p className="text-slate-500 text-base max-w-md mx-auto mb-12">
            Book a 45-minute discovery call with our team and start transforming
            your real estate business today.
          </p>

          <div className="">
            {/* Replace src with your actual Cal.com or Calendly URL */}
            <Cal
              namespace="10listingappts"
              calLink="estatekit/10listingappts"
              style={{
                width: "100%",
                overflow: "scroll",
                borderRadius: "10px",
              }}
              config={{
                layout: "month_view",
                theme: "light",
              }}
            />
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-12 hidden">
            <div className="sm:col-span-2 lg:col-span-1">
              <img src={logo2} width={120} className="mb-5" alt="" />
              <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
                Real Estate Specialised Marketing for South African agents. All
                services done in-house.
              </p>
              <div className="flex gap-3">
                {[FiYoutube, FiInstagram, FiLinkedin].map((Icon, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:border-brand hover:text-brand cursor-pointer transition-colors"
                  >
                    <Icon size={15} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-extrabold text-[11px] uppercase tracking-[.1em] text-slate-500 mb-5">
                Quick Links
              </p>
              {NAV.map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  className="block text-slate-300 text-sm font-medium mb-3 hover:text-brand transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>

            <div>
              <p className="font-extrabold text-[11px] uppercase tracking-[.1em] text-slate-500 mb-5">
                Contact
              </p>
              <div className="flex items-center gap-2 text-slate-300 text-sm mb-3">
                <FiMail size={13} className="text-slate-500" />{" "}
                hello@estatekit.com
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <FiMapPin size={13} className="text-slate-500" /> South Africa
              </div>
            </div>
          </div>

          <hr className="border-slate-800 mb-6" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-slate-600 text-xs">
              © 2026 EstateKit — All rights reserved.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Google Ads Certified", "Meta Business Partner"].map((b) => (
                <span
                  key={b}
                  className="bg-slate-800 text-slate-500 border border-slate-700 rounded-md px-3 py-1 text-xs"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
