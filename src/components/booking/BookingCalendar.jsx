import { useMemo, useRef, useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const BLUE = "rgb(28, 100, 242)";
const INK = "rgb(31, 42, 55)";
const MUTED = "rgba(31, 42, 55, 0.733)";
const LINE = "rgb(209, 213, 219)";

/** "2026-10-13" -> "Monday, 13 October" */
const longDate = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** Leading blanks + day numbers for a month, as calendar rows of 7. */
function buildWeeks(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * Month grid plus time slots, styled to the reference widget.
 *
 * `availability` maps an ISO date to its open times, e.g.
 * `{ "2026-10-12": ["09:00", "11:30"] }`. A day with no entry renders
 * disabled, which is what produces the mostly-greyed month in the original.
 */
export default function BookingCalendar({
  availability = {},
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  duration = "1 hour",
  timezoneLabel,
  dimmed = false,
  overlay = null,
  onMonthChange,
}) {
  const today = useMemo(() => new Date(), []);
  const slotsRef = useRef(null);
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const weeks = useMemo(
    () => buildWeeks(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const monthHasSlots = useMemo(
    () =>
      Object.keys(availability).some((k) => {
        const d = new Date(k);
        return (
          d.getFullYear() === cursor.getFullYear() &&
          d.getMonth() === cursor.getMonth() &&
          availability[k]?.length
        );
      }),
    [availability, cursor],
  );

  const atFirstMonth =
    cursor.getFullYear() === today.getFullYear() &&
    cursor.getMonth() === today.getMonth();

  // Changing month must drop the selection — otherwise last month's times
  // stay on screen next to an "no slots this month" notice.
  const step = (delta) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
    onMonthChange?.();
  };

  const slots = selectedDate ? availability[selectedDate] || [] : [];

  return (
    <div className="relative w-full pb-4 min-[900px]:py-6 max-w-[412px] mx-auto min-[900px]:w-[356px] min-[900px]:mx-0">
      <div
        className={`transition-opacity duration-300 ${dimmed ? "opacity-30" : ""}`}
      >
        {(duration || timezoneLabel) && !dimmed && (
          <div className="mb-5 space-y-2">
            {duration && (
              <p className="flex items-center gap-2 text-sm" style={{ color: INK }}>
                <ClockIcon /> {duration}
              </p>
            )}
            {timezoneLabel && (
              <p className="flex items-center gap-2 text-sm" style={{ color: INK }}>
                <GlobeIcon /> {timezoneLabel}
              </p>
            )}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p
              className="focus:outline-none text-base font-medium"
              style={{ color: INK }}
            >
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </p>
            <div className="flex items-center gap-2 relative z-[2]">
              <NavButton
                label="calendar backward"
                disabled={dimmed || atFirstMonth}
                onClick={() => step(-1)}
                path="M15.75 19.5L8.25 12l7.5-7.5"
              />
              <NavButton
                label="calendar forward"
                disabled={dimmed}
                onClick={() => step(1)}
                path="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </div>
          </div>

          <div className="space-y-12 pt-[17px] min-[900px]:pt-3 min-[900px]:px-0 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="flex">
                  {WEEKDAYS.map((d) => (
                    <th key={d} className="flex-1">
                      <div className="w-full flex justify-center">
                        <p
                          className="text-xs font-semibold text-center uppercase"
                          style={{ color: MUTED }}
                        >
                          {d}
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-1.5 min-[900px]:space-y-2">
                {weeks.map((week, wi) => (
                  <tr
                    key={wi}
                    className={`flex gap-1.5 min-[900px]:gap-2 ${wi === 0 ? "mt-2" : ""}`}
                  >
                    {week.map((day, di) => {
                      if (!day) return <td key={di} className="flex-1 p-0" />;

                      const key = iso(
                        new Date(cursor.getFullYear(), cursor.getMonth(), day),
                      );
                      const open = Boolean(availability[key]?.length) && !dimmed;
                      const isSelected = selectedDate === key;

                      return (
                        <td key={di} className="flex-1 p-0">
                          <button
                            type="button"
                            disabled={!open}
                            onClick={() => {
                              onSelectDate?.(key);
                              // Next frame, so the slot list exists to scroll to.
                              requestAnimationFrame(() =>
                                slotsRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "nearest",
                                }),
                              );
                            }}
                            className={`flex flex-col rounded-lg w-full py-4 max-w-11 max-h-11 justify-center items-center min-[900px]:w-11 ${
                              open ? "cursor-pointer font-medium" : ""
                            }`}
                            style={{
                              borderColor: "transparent",
                              background: isSelected
                                ? BLUE
                                : open
                                  ? "rgba(28, 100, 242, 0.3)"
                                  : undefined,
                            }}
                          >
                            <p
                              className="text-sm sm:text-base"
                              style={{ color: isSelected ? "#fff" : INK }}
                            >
                              {day}
                            </p>
                            {open && !isSelected && (
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: BLUE }}
                              />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slot list appears under the grid once a day is picked. It grows to
            its full height rather than scrolling inside a fixed box — a list
            clipped mid-row reads as the end of the list, and nobody hunts for
            a hidden scrollbar. The page scrolls instead, which everyone
            already understands. */}
        {!dimmed && selectedDate && slots.length > 0 && (
          <div ref={slotsRef} className="mt-4 scroll-mt-4">
            <p className="mb-2 text-sm font-semibold" style={{ color: INK }}>
              {longDate(selectedDate)}
            </p>
            <p className="mb-3 text-xs" style={{ color: MUTED }}>
              {slots.length} {slots.length === 1 ? "time" : "times"} available —
              pick one
            </p>

            <div className="space-y-2">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSelectTime?.(t)}
                  className={`w-full rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                    selectedTime === t
                      ? "border-[#1C64F2] bg-[#1C64F2] text-white"
                      : "border-[#1C64F2] bg-white text-[#1C64F2] hover:bg-[#1C64F2]/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Either the "fill in the form first" card, or an empty-month notice */}
      {(overlay || (!dimmed && !monthHasSlots)) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="max-w-[270px] border p-3 drop-shadow-md bg-white rounded cursor-default"
            style={{ borderColor: LINE, color: "rgb(17, 24, 39)" }}
          >
            <p className="text-sm font-normal leading-5 text-center">
              {overlay ||
                `There are no time slots available for the month of ${MONTHS[cursor.getMonth()]}.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({ label, disabled, onClick, path }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
      className={`flex items-center justify-center py-2 px-1.5 border rounded bg-white h-8 w-8 ${
        disabled ? "opacity-50" : ""
      }`}
      style={{ borderColor: LINE }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
        className="w-4 h-4 stroke-[2.2]"
        style={{ color: INK }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </button>
  );
}

const ClockIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M12 7.5V12l3 1.5" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
  </svg>
);
