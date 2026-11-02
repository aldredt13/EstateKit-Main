const INK = "rgb(31, 42, 55)";
const LINE = "rgb(209, 213, 219)";
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
      className="flex flex-col gap-2"
      style={{ outlineColor: invalid ? "#f87171" : undefined }}
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
            className="flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors"
            style={{
              borderColor: active ? BLUE : invalid ? "#f87171" : LINE,
              background: active ? "#EFF6FF" : "#F9FAFB",
              color: active ? BLUE : INK,
            }}
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
            <span className="flex-1 leading-snug">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
