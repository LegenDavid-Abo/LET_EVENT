"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { isValidPhoneNumber } from "libphonenumber-js";
import { countries, isoToFlag, findCountry, type Country } from "@/lib/countries";

interface PhoneFieldProps {
  label?: string;
  required?: boolean;
  onChange: (e164: string, valid: boolean) => void;
}

export default function PhoneField({ label = "Phone", required = false, onChange }: PhoneFieldProps) {
  const [country, setCountry] = useState<Country>(() => findCountry("NG") || countries[0]);
  const [number, setNumber] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [touched, setTouched] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.dial.includes(q));
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const e164 = number ? `+${country.dial}${number.replace(/\D/g, "")}` : "";
  const valid = !required && !number ? true : Boolean(number) && isValidPhoneNumber(e164, country.iso2 as any);

  function update(nextCountry: Country, nextNumber: string) {
    setCountry(nextCountry);
    setNumber(nextNumber);
    const nextE164 = nextNumber ? `+${nextCountry.dial}${nextNumber.replace(/\D/g, "")}` : "";
    const nextValid = !required && !nextNumber ? true : Boolean(nextNumber) && isValidPhoneNumber(nextE164, nextCountry.iso2 as any);
    onChange(nextE164, nextValid);
  }

  return (
    <div ref={wrapRef}>
      <label className="mb-2 block text-sm font-medium text-bone/70">
        {label}
        {required && <span className="ml-1 text-brass-400">*</span>}
      </label>
      <div className="flex gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              setQuery("");
            }}
            className="field-input flex w-[132px] items-center justify-between gap-1.5 whitespace-nowrap"
          >
            <span className="flex items-center gap-1.5 text-sm">
              <span className="text-base leading-none">{isoToFlag(country.iso2)}</span>+{country.dial}
            </span>
            <ChevronDown size={14} className="text-bone/40" />
          </button>

          {open && (
            <div className="glass-strong absolute z-20 mt-2 w-72 rounded-2xl p-2 shadow-premium">
              <div className="flex items-center gap-2 rounded-xl bg-white/[.05] px-3 py-2">
                <Search size={14} className="text-bone/40" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country or code…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-bone/30"
                />
              </div>
              <div className="mt-2 max-h-64 overflow-y-auto">
                {filtered.length === 0 && (
                  <p className="p-3 text-center text-xs text-bone/35">No matching country</p>
                )}
                {filtered.map((c) => (
                  <button
                    key={c.iso2}
                    type="button"
                    onClick={() => {
                      update(c, number);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/[.06]"
                  >
                    <span className="text-base leading-none">{isoToFlag(c.iso2)}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-bone/40">+{c.dial}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <input
          type="tel"
          inputMode="numeric"
          required={required}
          value={number}
          onBlur={() => setTouched(true)}
          onChange={(e) => update(country, e.target.value.replace(/[^\d\s]/g, ""))}
          placeholder="801 234 5678"
          className={`field-input flex-1 ${touched && !valid ? "border-red-400/50" : ""}`}
        />
      </div>
      {touched && !valid && <p className="mt-1.5 text-xs text-red-300">Invalid phone number for {country.name}.</p>}
    </div>
  );
}
