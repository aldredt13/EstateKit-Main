import { useEffect, useRef, useState } from "react";
import za from "../../../assets/flags/za.svg";
import na from "../../../assets/flags/na.svg";
import bw from "../../../assets/flags/bw.svg";
import zw from "../../../assets/flags/zw.svg";
import gb from "../../../assets/flags/gb.svg";
import us from "../../../assets/flags/us.svg";
import ae from "../../../assets/flags/ae.svg";
import au from "../../../assets/flags/au.svg";

export const COUNTRIES = [
  { code: "za", name: "South Africa", dial: "+27", flag: za },
  { code: "na", name: "Namibia", dial: "+264", flag: na },
  { code: "bw", name: "Botswana", dial: "+267", flag: bw },
  { code: "zw", name: "Zimbabwe", dial: "+263", flag: zw },
  { code: "gb", name: "United Kingdom", dial: "+44", flag: gb },
  { code: "us", name: "United States", dial: "+1", flag: us },
  { code: "ae", name: "United Arab Emirates", dial: "+971", flag: ae },
  { code: "au", name: "Australia", dial: "+61", flag: au },
];

/**
 * Phone input with a country dropdown pinned inside the field, matching the
 * reference widget's layout: flag + caret sit over the input's left padding
 * rather than in a separate control.
 */
export default function PhoneField({ value, onChange, country, onCountry, invalid }) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const wrapRef = useRef(null);

  // Nudges the eye to the first field, and stops the moment they engage —
  // a hint that keeps pulsing after you've started is just noise.
  const idle = !touched && !invalid && value.trim() === country.dial;

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        type="tel"
        name="phone"
        inputMode="tel"
        autoComplete="tel"
        placeholder="Phone number here"
        value={value}
        onFocus={() => setTouched(true)}
        onChange={(e) => {
          setTouched(true);
          onChange(e.target.value);
        }}
        className={`w-full rounded-lg h-10 py-2.5 pl-[58px] pr-4 border-2 text-sm font-normal bg-[#F9FAFB] text-gray-900 placeholder:text-gray-400 outline-none transition-colors ${
          invalid
            ? "border-red-400"
            : "border-[#d1d5db] focus:border-[#1C64F2]"
        } ${idle ? "ek-phone-hint" : ""}`}
      />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select country code"
        aria-expanded={open}
        className="absolute left-[2px] top-[2px] bottom-[2px] flex items-center gap-1 rounded-l-md px-2.5 hover:bg-[#f1f1f1]"
      >
        <img
          src={country.flag}
          alt=""
          className="h-3.5 w-5 rounded-[1px] object-cover ring-1 ring-black/10"
        />
        <span
          className="h-0 w-0 border-x-[3px] border-t-[4px] border-x-transparent border-t-gray-600"
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-[44px] z-20 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white py-1 shadow-lg"
        >
          {COUNTRIES.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                role="option"
                aria-selected={c.code === country.code}
                onClick={() => {
                  onCountry(c);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-[#f1f1f1] ${
                  c.code === country.code ? "bg-[#f1f1f1]" : ""
                }`}
              >
                <img
                  src={c.flag}
                  alt=""
                  className="h-3.5 w-5 rounded-[1px] object-cover ring-1 ring-black/10"
                />
                <span className="text-gray-900">{c.name}</span>
                <span className="ml-auto text-gray-500">{c.dial}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        @keyframes ekPhoneHint {
          0%, 100% { border-color: #d1d5db; box-shadow: 0 0 0 0 rgba(28,100,242,0); }
          50%      { border-color: #1C64F2; box-shadow: 0 0 0 3px rgba(28,100,242,.12); }
        }
        .ek-phone-hint { animation: ekPhoneHint 2.2s ease-in-out infinite; }
        .ek-phone-hint:focus { animation: none; }
        @media (prefers-reduced-motion: reduce) {
          .ek-phone-hint { animation: none; border-color: #1C64F2; }
        }
      `}</style>
    </div>
  );
}
