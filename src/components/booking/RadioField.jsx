const INK = "rgb(31, 42, 55)";
const BLUE = "#1C64F2";

/**
 * One-tap pill choices in place of a dropdown.
 *
 * A dropdown is two taps (open, then pick) and hides the options until
 * opened; these show every choice immediately, which is both faster and
 * doubles as social proof of what the other options look like.
 */
export default function RadioField({ options, value, onChange, invalid }) {
  return (
    <div
      role="radiogroup"
      className={`flex flex-col gap-1 rounded-lg ${invalid ? "ring-1 ring-red-400" : ""}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1 text-left text-sm transition-colors hover:bg-[#F3F4F6]"
            style={{ color: active ? BLUE : INK }}
          >
            <span
              className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border"
              style={{ borderColor: active ? BLUE : "#9ca3af" }}
            >
              {active && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: BLUE }}
                />
              )}
            </span>
            <span className="flex-1 leading-tight">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
