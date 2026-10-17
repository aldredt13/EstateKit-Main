import { useCallback, useMemo } from "react";
import ApplicationWidget from "../components/booking/ApplicationWidget";
import { usePageMeta } from "../hooks/usePageMeta";
import { postActivity } from "../lib/discordCards";
import { submitFunnelLead } from "../lib/dashboard";
import logo from "../../assets/primary.svg";

/**
 * Calendar-only rebooking page.
 *
 * A lead who already applied and already passed the score should not be sent
 * back through the pitch page and the questions to move a time. This is the
 * calendar and nothing else.
 *
 * Their details arrive as query params so there is no form at all:
 *   /rebook?name=Thabo%20M&email=t@x.co&phone=%2B27831234567
 *
 * With no params it still works, it just books under "there" with a blank
 * email, so links we send always carry them.
 */
const Rebook = () => {
  const lead = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    const full = (q.get("name") || "").trim();
    const [firstName, ...rest] = full.split(/\s+/);

    return {
      firstName: firstName || "",
      lastName: rest.join(" "),
      email: (q.get("email") || "").trim(),
      phone: (q.get("phone") || "").trim(),
    };
  }, []);

  const handleBooked = useCallback(({ start, form }) => {
    postActivity("booked", {
      who: `${form.firstName} ${form.lastName}`.trim() || "Rebooked lead",
      fields: {
        When: new Date(start).toLocaleString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        }),
        Phone: form.phone,
        Email: form.email,
        Type: "Rebooked an existing call",
      },
      link: form.phone ? `https://wa.me/${form.phone.replace(/\D/g, "")}` : "",
    });

    // Matches the existing dashboard row on phone number, so moving a time
    // updates the lead rather than creating a duplicate card.
    submitFunnelLead({
      name: `${form.firstName} ${form.lastName}`.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      startsAt: new Date(start).toISOString(),
    });
  }, []);

  usePageMeta({
    title: "Pick a new time | EstateKit",
    description: "Choose a new time for your EstateKit discovery call.",
    path: "/rebook",
    noindex: true,
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 antialiased">
      <header className="px-4 pt-10 pb-2 text-center">
        <img src={logo} alt="EstateKit" className="mx-auto h-8" />
        <h1 className="mx-auto mt-6 max-w-lg text-2xl font-black uppercase leading-tight sm:text-3xl">
          Pick a new time
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
          {lead.firstName
            ? `No problem ${lead.firstName}. Choose whatever suits you below and we'll send a fresh invite.`
            : "Choose whatever suits you below and we'll send a fresh invite."}
        </p>
      </header>

      <ApplicationWidget
        title="EstateKit Discovery Call"
        rebookFor={lead}
        onBook={handleBooked}
      />

      <footer className="px-4 pb-10 text-center text-xs text-slate-500">
        Nothing on the calendar that works?{" "}
        <a
          href="https://wa.me/264852878236"
          className="font-semibold text-brand underline"
        >
          WhatsApp us on +264 85 287 8236
        </a>
      </footer>
    </div>
  );
};

export default Rebook;
