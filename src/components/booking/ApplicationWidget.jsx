import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhoneField, { COUNTRIES } from "./PhoneField";
import BookingCalendar from "./BookingCalendar";
import SelectField, { humanDay } from "./SelectField";
import {
  QUALIFYING_QUESTIONS,
  scoreAnswers,
} from "../../config/qualifyingQuestions";
import { createBooking, fetchSlots } from "../../lib/bookingApi";
import { submitFunnelLead, toFormAnswers } from "../../lib/dashboard";

const INK = "rgb(31, 42, 55)";
const MUTED = "rgba(31, 42, 55, 0.733)";
const LINE = "rgb(209, 213, 219)";
const BLUE = "#1C64F2";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Who you are, then everything else in one block. */
const STAGE = { IDENTITY: 0, APPLICATION: 1, DONE: 2 };

const inputClass =
  "bg-[#F9FAFB] border text-sm rounded-lg w-full py-2.5 px-4 h-10 text-gray-900 leading-tight outline-none focus:border-[#1C64F2] placeholder:text-gray-500";

/**
 * Two-panel application + booking widget.
 *
 * Mirrors the reference scheduler's layout and staging: the calendar sits
 * beside the form but stays dimmed and un-clickable until the application is
 * submitted, and the form reveals itself a block at a time rather than showing
 * every question at once.
 */
export default function ApplicationWidget({
  title = "Free Strategy Call With EstateKit",
  description,
  onComplete,
  onBook,
  /** First keystroke in the form. Fires once. */
  onStart,
  /** Name and number done, moving on to the questions. */
  onReachedContact,
  /**
   * Rebooking an existing lead: they already applied and already passed the
   * score, so the application is skipped entirely and the calendar is the
   * whole page. Shape: { firstName, lastName, email, phone }.
   */
  rebookFor = null,
}) {
  const [stage, setStage] = useState(
    rebookFor ? STAGE.DONE : STAGE.IDENTITY,
  );
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [form, setForm] = useState({
    phone: rebookFor?.phone || COUNTRIES[0].dial,
    firstName: rebookFor?.firstName || "",
    lastName: rebookFor?.lastName || "",
    email: rebookFor?.email || "",
  });
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [slots, setSlots] = useState({});
  const [booking, setBooking] = useState({ busy: false, error: null, done: null });
  const [outcome, setOutcome] = useState(null);
  const emailRef = useRef(null);
  const calendarRef = useRef(null);

  const formDone = stage === STAGE.DONE;

  // A lead below the threshold never sees the calendar. Their details are
  // still recorded — they're a follow-up if their status changes, not a
  // 45-minute slot we can't deliver against.
  const rejected =
    !rebookFor && formDone && outcome !== null && !outcome.qualified;

  // A lead who finished the application but never picked a time is a callable
  // follow-up, not a lost cause, so they get reported on the way out and land
  // on the "Not booked" tab. The snapshot ref keeps the exit handler reading
  // live values without re-registering on every keystroke.
  const exitState = useRef({});
  const exitSent = useRef(false);

  useEffect(() => {
    const flush = () => {
      const s = exitState.current;
      // A rebooking lead is already on the sheet; they are not a drop-off.
      if (rebookFor || exitSent.current) return;

      // The dashboard requires both a name and a number, so a lead who only
      // got as far as one of them cannot be recorded. Everything past that
      // is a bonus, and scoreAnswers copes with a partial answer map.
      const name = `${s.form.firstName.trim()} ${s.form.lastName.trim()}`.trim();
      const reachable = s.localDigits.length >= 7;
      if (!name || !reachable) return;

      exitSent.current = true;

      const scored = scoreAnswers(s.answers);
      submitFunnelLead({
        name,
        phone: s.form.phone.trim(),
        email: s.form.email.trim(),
        answers: toFormAnswers(scored.breakdown),
        disqualified: scored.breakdown.length > 0 && !scored.qualified,
        // No startsAt: they never picked a time, so they land as a New Lead
        // for Kieran to work rather than as a booked appointment.
        keepalive: true,
      });
    };

    // pagehide covers nav and tab close; visibilitychange catches the mobile
    // app-switch that never fires an unload at all.
    const onHidden = () =>
      document.visibilityState === "hidden" && flush();

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [rebookFor]);

  // Availability is public, so it can be pulled the moment the widget mounts —
  // by the time they finish the application the calendar is already populated.
  useEffect(() => {
    let cancelled = false;

    fetchSlots()
      .then((s) => !cancelled && setSlots(s))
      .catch(() => {
        /* calendar falls back to its empty-month notice */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Calendar only needs the labels; the ISO start is looked up on confirm. */
  const availability = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(slots).map(([d, list]) => [d, list.map((s) => s.label)]),
      ),
    [slots],
  );
  // Reported once, on the first keystroke, rather than on the CTA click:
  // clicking through to the form and actually starting it are different
  // things, and only the second one is a lead doing something.
  const startedRef = useRef(false);
  const set = (k, v) => {
    if (!startedRef.current && !rebookFor) {
      startedRef.current = true;
      onStart?.();
    }
    setForm((f) => ({ ...f, [k]: v }));
  };

  const localDigits = useMemo(
    () => form.phone.replace(/\D/g, "").replace(/^0+/, ""),
    [form.phone],
  );

  // Kept next to localDigits rather than up with the other refs: the exit
  // handler reads this snapshot, so it has to be written after every value
  // it depends on exists.
  useEffect(() => {
    exitState.current = { formDone, form, answers, localDigits };
  }, [formDone, form, answers, localDigits]);

  /** Messages, not just red borders — a silent rejection is a dead end. */
  const validate = () => {
    const next = {};
    if (localDigits.replace(country.dial.replace("+", ""), "").length < 7)
      next.phone = "Enter your full number so we can reach you.";
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";

    if (stage >= STAGE.APPLICATION) {
      if (!EMAIL.test(form.email.trim()))
        next.email = "That email doesn't look right.";
      QUALIFYING_QUESTIONS.forEach((q) => {
        if (!answers[q.id]) next[q.id] = "Pick one to continue.";
      });
    }

    setErrors(next);
    return !Object.keys(next).length;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (stage < STAGE.APPLICATION) {
      onReachedContact?.({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        phone: form.phone.trim(),
      });
      setStage(stage + 1);
      // Drop them straight into the next field rather than making them aim.
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }

    const result = scoreAnswers(answers);
    const contact = {
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };
    setOutcome(result);
    setStage(STAGE.DONE);
    onComplete?.({ ...result, contact, answers });

    // Only a qualified lead gets a day pre-picked — for everyone else the
    // calendar never renders, so there's nothing to pre-pick.
    if (result.qualified) {
      const soonest = Object.keys(slots).sort()[0];
      if (soonest) setDate(soonest);
    }

    // On a phone the panel is below the fold either way, so submitting would
    // otherwise look like nothing happened.
    requestAnimationFrame(() =>
      calendarRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  };

  const confirm = useCallback(async () => {
    const match = (slots[date] || []).find((s) => s.label === slot);
    if (!match) return;

    setBooking({ busy: true, error: null, done: null });
    try {
      // Cal's own ISO string, not a rebuilt one — a reconstructed timestamp
      // gets rejected as an unavailable slot.
      const scored = scoreAnswers(answers);
      const result = await createBooking({
        start: match.start,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        // A rebook never re-asks the questions, so there is nothing to score.
        // Sending a 0 here would stamp "Qualified: No" on a lead who already
        // passed; blank plus the rebook flag is the honest version.
        q1: rebookFor ? "" : scored.breakdown[0]?.answer || "",
        q2: rebookFor ? "" : scored.breakdown[1]?.answer || "",
        score: rebookFor ? "" : scored.score,
        qualified: rebookFor ? "" : scored.qualified,
        rebook: Boolean(rebookFor),
      });
      // Set synchronously, not via state: the redirect below fires pagehide
      // before React has committed, and a booked lead must not also be
      // written to the "Not booked" tab.
      exitSent.current = true;
      setBooking({ busy: false, error: null, done: result });
      onBook?.({ date, time: slot, start: match.start, form, answers, result });

      // Hand off to the thank-you page, which owns the confirmation content
      // and the engagement tracking. Params match what it already parses.
      const params = new URLSearchParams({
        attendeeName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        attendeePhoneNumber: form.phone.trim(),
        attendeeStartTime: match.start,
        uid: result?.eventId || "booked",
        title: "EstateKit Discovery Call",
      });
      window.location.assign(`/thank-you?${params}`);
    } catch (err) {
      setBooking({ busy: false, error: err.message, done: null });
    }
  }, [slots, date, slot, form, answers, onBook, rebookFor]);

  return (
    <div
      className="flex flex-col items-center box-border min-[520px]:pt-14 min-w-full min-[520px]:pb-6 text-left"
      style={{ backgroundColor: "rgb(249, 250, 251)", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="w-full max-w-[520px] min-[520px]:max-w-[480px] min-[900px]:w-fit min-[900px]:max-w-full">
        <div
          className="bg-white min-[520px]:border min-[520px]:rounded-lg"
          style={{ borderColor: LINE }}
        >
          {/* Step tabs. A rebook has only one step, so there's nothing to show. */}
          {!rebookFor && (
            <div
              className="flex flex-wrap gap-2 justify-center border-b px-4 py-4 min-[900px]:flex-row min-[900px]:space-x-4 min-[900px]:py-[10px]"
              style={{ borderColor: LINE }}
            >
              <Tab active={!formDone} done={formDone} label="Fill out the form" />
              {!rejected && <Tab active={formDone} label="Book your event" />}
            </div>
          )}

          <div className="mx-0 min-[900px]:flex">
            {/* ── Left: the application ─────────────────────────────── */}
            {!rebookFor && (
            <div className="w-full max-w-[520px] min-[520px]:max-w-[480px] px-5 pt-5 min-[900px]:w-[404px] min-[900px]:p-6 pb-10">
              <h1
                className="font-semibold text-[18px] sm:text-[20px] leading-6 break-words"
                style={{ color: INK }}
              >
                {title}
              </h1>

              {description && (
                <div className="max-h-[230px] overflow-y-auto mt-3">
                  <div
                    className="font-normal text-sm leading-tight break-words space-y-3"
                    style={{ color: MUTED }}
                  >
                    {description}
                  </div>
                </div>
              )}

              {formDone ? (
                <div
                  className={`mt-6 rounded-lg border p-4 ${
                    rejected
                      ? "border-slate-300 bg-slate-50"
                      : "border-[#1C64F2]/30 bg-[#1C64F2]/5"
                  }`}
                >
                  <p className="text-sm font-medium" style={{ color: INK }}>
                    {rejected
                      ? `Thanks ${form.firstName} — we've got your details.`
                      : `Thanks ${form.firstName} — now pick a time that suits you.`}
                  </p>
                </div>
              ) : (
                <form
                  autoComplete="on"
                  className="min-w-[250px] mt-4"
                  onSubmit={handleContinue}
                >
                  <div className="grid grid-cols-2 gap-x-4">
                    <div className="col-span-2 w-full mb-4">
                      <PhoneField
                        value={form.phone}
                        onChange={(v) => set("phone", v)}
                        country={country}
                        onCountry={(c) => {
                          setCountry(c);
                          set("phone", c.dial);
                        }}
                        invalid={Boolean(errors.phone)}
                      />
                      <ErrorText>{errors.phone}</ErrorText>
                    </div>

                    <div className="w-full mb-4">
                      <input
                        type="text"
                        maxLength={30}
                        placeholder="First name *"
                        name="firstName"
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={(e) => set("firstName", e.target.value)}
                        className={inputClass}
                        style={{
                          borderColor: errors.firstName ? "#f87171" : LINE,
                        }}
                      />
                      <ErrorText>{errors.firstName}</ErrorText>
                    </div>
                    <div className="w-full mb-4">
                      <input
                        type="text"
                        maxLength={30}
                        placeholder="Last name *"
                        name="lastName"
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={(e) => set("lastName", e.target.value)}
                        className={inputClass}
                        style={{
                          borderColor: errors.lastName ? "#f87171" : LINE,
                        }}
                      />
                      <ErrorText>{errors.lastName}</ErrorText>
                    </div>
                  </div>

                  {/* Email and the application arrive together on step two */}
                  {stage >= STAGE.APPLICATION && (
                    <>
                      <Field label="Email address" required error={errors.email}>
                        <input
                          ref={emailRef}
                          type="email"
                          name="email"
                          autoComplete="email"
                          inputMode="email"
                          placeholder="you@agency.co.za"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                          className={inputClass}
                          style={{
                            borderColor: errors.email ? "#f87171" : LINE,
                          }}
                        />
                      </Field>

                      {QUALIFYING_QUESTIONS.map((q) => (
                        <Field key={q.id} label={q.question} required error={errors[q.id]}>
                          {q.type === "text" ? (
                            <input
                              type="text"
                              placeholder={q.placeholder}
                              value={answers[q.id] || ""}
                              onChange={(e) =>
                                setAnswers((a) => ({
                                  ...a,
                                  [q.id]: e.target.value,
                                }))
                              }
                              className={inputClass}
                              style={{
                                borderColor: errors[q.id] ? "#f87171" : LINE,
                              }}
                            />
                          ) : (
                            <SelectField
                              options={q.options}
                              value={answers[q.id] || ""}
                              onChange={(v) =>
                                setAnswers((a) => ({ ...a, [q.id]: v }))
                              }
                              placeholder={q.placeholder || "Select one"}
                              invalid={errors[q.id]}
                            />
                          )}
                        </Field>
                      ))}
                    </>
                  )}

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 h-11 md:h-10 rounded-lg w-full text-white py-[10px] px-[20px] text-sm font-medium disabled:opacity-75 transition-colors"
                    style={{ background: BLUE }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#3d7dff")
                    }
                    onMouseOut={(e) => (e.currentTarget.style.background = BLUE)}
                  >
                    {stage === STAGE.APPLICATION ? "Submit" : "Continue"}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      aria-hidden="true"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                </form>
              )}
            </div>
            )}

            {/* ── Right: the calendar ───────────────────────────────── */}
            <div
              ref={calendarRef}
              className={`px-5 flex-1 min-w-0 scroll-mt-4 md:px-6 md:pr-[24px] md:pb-6 ${rebookFor ? "" : "min-[900px]:border-l"}`}
              style={{ borderColor: LINE }}
            >
              {rejected ? (
                /* Said plainly and without a consolation offer — the honest
                   reason reads better than a soft no, and the WhatsApp line
                   means a mis-tapped answer doesn't cost us a real lead. */
                <div className="py-12 text-center min-[900px]:py-16 px-2">
                  <p
                    className="text-base font-semibold"
                    style={{ color: INK }}
                  >
                    We're not the right fit right now
                  </p>
                  {outcome.disqualified ? (
                    <>
                      <p
                        className="mx-auto mt-3 max-w-sm text-sm leading-relaxed"
                        style={{ color: MUTED }}
                      >
                        Our system only works for practitioners who can legally
                        earn commission, and that means being PPRA-registered.
                        Without it we'd be taking your money with no way to
                        deliver, so we'd rather tell you straight than sell you
                        a call.
                      </p>
                      <p
                        className="mx-auto mt-4 max-w-sm text-sm leading-relaxed"
                        style={{ color: MUTED }}
                      >
                        Get registered and come straight back to us — we've kept
                        your details.
                      </p>
                    </>
                  ) : (
                    <>
                      <p
                        className="mx-auto mt-3 max-w-sm text-sm leading-relaxed"
                        style={{ color: MUTED }}
                      >
                        We work best with agents who already have deals moving —
                        our system multiplies existing deal flow rather than
                        creating it from a standing start. Right now you'd be
                        paying us to do something you can do cheaper yourself.
                      </p>
                      <p
                        className="mx-auto mt-4 max-w-sm text-sm leading-relaxed"
                        style={{ color: MUTED }}
                      >
                        Get a few transactions under your belt and come back —
                        we've kept your details.
                      </p>
                    </>
                  )}
                  <p className="mt-5 text-xs" style={{ color: MUTED }}>
                    Think that's wrong? WhatsApp us on{" "}
                    <a
                      href="https://wa.me/264852878236"
                      className="font-semibold underline"
                      style={{ color: BLUE }}
                    >
                      +264 85 287 8236
                    </a>
                  </p>
                </div>
              ) : booking.busy || booking.done ? (
                /* Holds them through the write and the redirect. Naming the
                   steps keeps people on the page far better than a bare
                   spinner, even when it's over in a second. */
                <div className="py-14 text-center min-[900px]:py-20">
                  <span
                    className="mx-auto block h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200"
                    style={{ borderTopColor: BLUE }}
                  />
                  <p
                    className="mt-5 text-base font-semibold"
                    style={{ color: INK }}
                  >
                    {booking.done ? "You're booked" : "Locking in your time…"}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: MUTED }}>
                    {slot} on {humanDay(date)}
                  </p>
                  <p className="mt-4 text-xs" style={{ color: MUTED }}>
                    {booking.done
                      ? "Taking you to your confirmation…"
                      : "Adding it to the calendar and sending your invite."}
                  </p>
                  <p className="mt-6 text-xs font-medium text-red-500">
                    Don't close this page
                  </p>
                </div>
              ) : (
                <>
                  <BookingCalendar
                    availability={availability}
                    selectedDate={date}
                    onSelectDate={(d) => {
                      setDate(d);
                      setSlot(null);
                    }}
                    selectedTime={slot}
                    onSelectTime={setSlot}
                    onConfirm={confirm}
                    confirming={booking.busy}
                    onMonthChange={() => {
                      setDate(null);
                      setSlot(null);
                    }}
                    dimmed={!formDone}
                    timezoneLabel={
                      formDone
                        ? Intl.DateTimeFormat().resolvedOptions().timeZone
                        : null
                    }
                    overlay={
                      formDone
                        ? null
                        : "Please fill out the form before choosing your time slot."
                    }
                  />

                  {booking.error && (
                    <p className="mb-6 text-center text-sm text-red-500">
                      {booking.error}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tab({ active, done, label }) {
  return (
    <div
      className={`flex items-center ${active ? "cursor-pointer" : "cursor-default"}`}
    >
      {done ? (
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="none"
          stroke="rgb(156,163,175)"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5l4 4 8-9" />
        </svg>
      ) : (
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: active ? "rgb(28, 100, 242)" : LINE }}
        />
      )}
      <h1
        className={`pl-[8px] text-sm whitespace-nowrap ${active ? "" : "opacity-50"}`}
        style={{ color: INK }}
      >
        {" "}
        {label}
      </h1>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-sm font-medium" style={{ color: INK }}>
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      {children}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

function ErrorText({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-red-500">{children}</p>;
}
