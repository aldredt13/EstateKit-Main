import { useMemo } from "react";
import { Link } from "react-router-dom";
import WistiaPlayer from "../components/WistiaPlayer";
import TestimonialImage from "../components/TestimonialImage";
import { TESTIMONIAL_IMAGES } from "../components/TestimonialProof";
import { usePageMeta } from "../hooks/usePageMeta";
import { useJsonLd } from "../hooks/useJsonLd";
import { VIDEO_TESTIMONIALS, PROOF_STATS } from "../config/proof";
import logo from "../../assets/primary.svg";

const SITE = "https://estatekit.co";

/**
 * Proof-only page. One headline, then nothing but evidence — filmed
 * testimonials, written reviews and the screenshot wall — with three CTAs
 * placed so each one follows the proof that earns it.
 */
const Results = () => {
  usePageMeta({
    title:
      "EstateKit Reviews & Results — Real South African Estate Agents, Real Listings",
    description:
      "Verified results from South African estate agents using EstateKit: 11 listings in 6 weeks, seller leads at R9–R10, mandates signed without cold calling. Real reviews, screenshots and filmed testimonials.",
    path: "/results",
    type: "article",
  });

  // Derived from the same arrays the page renders, so the review count in the
  // search result always matches what a visitor can count on the page.
  const schema = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        name: "EstateKit",
        url: SITE,
        logo: `${SITE}/favicon.svg`,
        areaServed: { "@type": "Country", name: "South Africa" },
        description:
          "Marketing and lead generation for South African real estate agents — seller leads, listing appointments and signed mandates.",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "5",
          bestRating: "5",
          ratingCount: String(VIDEO_TESTIMONIALS.length),
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${SITE}/results#webpage`,
        url: `${SITE}/results`,
        name: "EstateKit Reviews & Results",
        isPartOf: { "@id": `${SITE}/#organization` },
        about: { "@id": `${SITE}/#organization` },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            {
              "@type": "ListItem",
              position: 2,
              name: "Results",
              item: `${SITE}/results`,
            },
          ],
        },
      },
      // Only the testimonials actually rendered below — review markup has to
      // match what a visitor can see, or it reads as spam to Google.
      ...VIDEO_TESTIMONIALS.map((r) => ({
        "@context": "https://schema.org",
        "@type": "Review",
        itemReviewed: { "@id": `${SITE}/#organization` },
        author: { "@type": "Person", name: r.name },
        reviewBody: r.quote,
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
      })),
    ],
    [],
  );

  useJsonLd(schema, "ek-results-jsonld");

  return (
    <div className="bg-white text-slate-900 antialiased">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" aria-label="EstateKit home">
            <img src={logo} alt="EstateKit" className="h-7" />
          </Link>
          <Link
            to="/pitch"
            className="rounded bg-brand px-4 py-2 text-sm font-black uppercase tracking-wide text-white"
          >
            Check if you qualify
          </Link>
        </div>
      </header>

      <main>
        {/* ── The one headline ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-4xl px-4 pt-14 pb-10 text-center sm:px-6">
          <p className="mb-4 text-sm font-black uppercase tracking-widest text-brand">
            Proof, not promises
          </p>
          <h1 className="text-4xl font-black uppercase leading-[1.05] sm:text-5xl md:text-6xl">
            South African estate agents are signing mandates from{" "}
            <span className="text-brand">R9 leads</span> — here is every
            receipt.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            No case-study spin. Filmed testimonials, unedited WhatsApp
            screenshots and written reviews from full-status property
            practitioners running EstateKit campaigns across Gauteng, the
            Western Cape and KwaZulu-Natal.
          </p>
        </section>

        {/* ── Headline numbers ─────────────────────────────────────────── */}
        <section
          aria-label="Results at a glance"
          className="border-y border-slate-100 bg-slate-50"
        >
          <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
            {PROOF_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-3xl font-black text-brand sm:text-4xl">
                    {s.figure}
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-slate-600">
                    {s.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Filmed testimonials ──────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-black uppercase sm:text-4xl">
            Agents telling you themselves
          </h2>

          {VIDEO_TESTIMONIALS.map((t) => (
            <article key={t.mediaId} className="mb-12">
              <WistiaPlayer mediaId={t.mediaId} />
              <div className="mt-4 text-center">
                <h3 className="text-xl font-black text-slate-900">
                  {t.headline}
                </h3>
                <blockquote className="mx-auto mt-3 max-w-xl text-base italic leading-relaxed text-slate-600">
                  “{t.quote}”
                </blockquote>
                <p className="mt-3 text-sm font-bold text-slate-900">
                  <cite className="not-italic">{t.name}</cite>
                  <span className="font-medium text-slate-400">
                    {" "}
                    · {t.location}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </section>

        {/* CTA 1 — earned by the videos above */}
        <ProofCta
          line="Juani did 11 listings in 6 weeks in Boksburg."
          action="See if your suburb is open"
        />

        {/* ── Screenshot wall ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-3xl font-black uppercase sm:text-4xl">
            The messages, unedited
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-slate-600">
            Sent to us by agents while their campaigns were running — lead
            counts, costs per lead, booked appointments and signed mandates.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {TESTIMONIAL_IMAGES.map((t, i) => (
              <TestimonialImage key={i} {...t} />
            ))}
          </div>
        </section>

        {/* CTA 2 — earned by the screenshots above */}
        <ProofCta
          line="Those leads cost R9–R10 each."
          action="Find out what they'd cost in your area"
        />

        {/* CTA 3 — the close */}
        <section className="bg-slate-900 px-4 py-16 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl text-3xl font-black uppercase leading-tight text-white sm:text-4xl">
            Every agent above started with one application
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
            Four questions, about ninety seconds. We only take on agents we know
            we can get results for.
          </p> 
          <Link
            to="/pitch"
            className="mt-8 inline-block rounded bg-brand px-8 py-5 text-xl font-black uppercase leading-none tracking-wide text-white transition-opacity hover:opacity-90"
          >
            Check if you qualify
          </Link>
        </section>
      </main>

      <footer className="border-t border-slate-100 px-4 py-8 text-center sm:px-6">
        <img src={logo} alt="EstateKit" className="mx-auto h-7 opacity-60" />
        <p className="mt-4 text-xs text-slate-400">
          © {new Date().getFullYear()} EstateKit. Results shown are from real
          clients and are not a guarantee of your own.
        </p>
      </footer>
    </div>
  );
};

/** Small inline CTA that names the proof immediately above it. */
function ProofCta({ line, action }) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-4 text-center sm:px-6">
      <div className="rounded-lg border-2 border-brand/20 bg-brand/5 px-6 py-6">
        <p className="text-lg font-bold text-slate-900">{line}</p>
        <Link
          to="/pitch"
          className="mt-3 inline-block font-black uppercase tracking-wide text-brand underline underline-offset-4"
        >
          {action} →
        </Link>
      </div>
    </section>
  );
}

export default Results;
