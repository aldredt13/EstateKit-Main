import { FiPhone } from "react-icons/fi";
import SectionTag from "./SectionTag";
import ApplicationWidget from "../booking/ApplicationWidget";
import { useFunnelReporting } from "../../hooks/useFunnelReporting";

/**
 * The homepage booking section.
 *
 * Was a Cal.com embed, which meant a booking from here reached nobody: no
 * lead on the dashboard, no qualifying questions, no reminders, and Cal's
 * branding on our own site. It now runs the same widget as /pitch, so a
 * booking from the homepage is indistinguishable from one off an ad.
 */
export default function Booking() {
  const reporting = useFunnelReporting();

  return (
    <section
      id="contact"
      className="border-t border-slate-200 bg-slate-50 py-24"
    >
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="flex justify-center">
          <SectionTag icon={FiPhone}>Book a Call</SectionTag>
        </div>
        <h2 className="mb-3 text-4xl font-black text-slate-900 sm:text-5xl">
          Discover how we{" "}
          <span className="text-brand">GUARANTEE CLOSED DEALS</span> or you{" "}
          <span className="text-brand">DON'T PAY!</span>
        </h2>
        <p className="mx-auto mb-12 max-w-md text-base text-slate-500">
          Book a 45-minute discovery call with our team and start transforming
          your real estate business today.
        </p>

        <ApplicationWidget
          title="EstateKit Discovery Call"
          description={
            <>
              <p>
                A 45-minute call where we map the exact seller-attraction
                system to your suburbs, and tell you straight if it isn't a
                fit.
              </p>
              <p>
                <strong>If none of the times work for you:</strong>
              </p>
              <p>⏰ WhatsApp us and we'll find one that does: +264 85 287 8236</p>
            </>
          }
          {...reporting}
        />
      </div>
    </section>
  );
}
