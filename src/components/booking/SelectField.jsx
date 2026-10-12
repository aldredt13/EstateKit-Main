import { useEffect, useRef, useState } from "react";

/** "2026-10-13" -> "Wednesday the 13th" — a date you can read aloud. */
export function humanDay(key) {
  if (!key) return "";
  const d = new Date(`${key}T00:00:00`);
  const n = d.getDate();
  const suffix =
    n % 10 === 1 && n !== 11
      ? "st"
      : n % 10 === 2 && n !== 12
        ? "nd"
        : n % 10 === 3 && n !== 13
          ? "rd"
          : "th";
  return `${d.toLocaleDateString(undefined, { weekday: "long" })} the ${n}${suffix}`;
}

const INK = "rgb(31, 42, 55)";
const LINE = "rgb(209, 213, 219)";
const BLUE = "#1C64F2";

/**
 * Styled dropdown that matches the widget's inputs.
 *
 * A native <select> can't be styled consistently across browsers — on Windows
 * especially it renders the OS list, which looks nothing like the rest of the
 * form. This keeps the same 40px field, radius and palette as the text inputs,
 * and shows a tick against the current choice.
 */
export default function SelectField({
  options,
  value,
  onChange,
  placeholder = "Select",
  invalid,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;

    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 w-full items-center justify-between rounded-lg border bg-[#F9FAFB] px-4 text-left text-sm outline-none transition-colors"
        style={{
          borderColor: invalid ? "#f87171" : open ? BLUE : LINE,
          color: selected ? INK : "#6b7280",
        }}
      >
        <span className="truncate pr-2">
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="#6b7280"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 8 4 4 4-4" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-[44px] z-30 max-h-60 w-full overflow-y-auto rounded-lg border bg-white py-1 shadow-lg"
          style={{ borderColor: LINE }}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#F3F4F6]"
                  style={{
                    background: active ? "#EFF6FF" : undefined,
                    color: active ? BLUE : INK,
                  }}
                >
                  <span className="flex-1 leading-snug">{o.label}</span>
                  {active && (
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke={BLUE}
                      strokeWidth="2.4"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 10.5l4 4 8-9"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
