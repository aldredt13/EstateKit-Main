import ApplicationWidget from "./booking/ApplicationWidget";
import { useFunnelReporting } from "../hooks/useFunnelReporting";

/**
 * The booking section on /pitch/res.
 *
 * Was an iframe to cal.com/estatekit/10listingappts, so bookings from here
 * never reached the dashboard and skipped the qualifying questions. Same
 * widget as /pitch now.
 */
export default function BookingEmbed() {
  const reporting = useFunnelReporting();

  return (
    <section id="book" className="mx-auto max-w-5xl px-4 pb-5 pt-4 sm:px-6">
      <ApplicationWidget
        title="EstateKit Discovery Call"
        description={
          <>
            <p>
              A 45-minute call where we map the exact seller-attraction system
              to your suburbs, and tell you straight if it isn't a fit.
            </p>
            <p>
              <strong>If none of the times work for you:</strong>
            </p>
            <p>⏰ WhatsApp us and we'll find one that does: +264 85 287 8236</p>
          </>
        }
        {...reporting}
      />
    </section>
  );
}
