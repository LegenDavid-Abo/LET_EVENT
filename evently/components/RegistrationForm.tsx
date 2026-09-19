"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { TextField } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import PhoneField from "@/components/PhoneField";

interface RegistrationFormProps {
  slug: string;
  max: number;
  fields: any[];
}

export default function RegistrationForm({ slug, max, fields }: RegistrationFormProps) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ registration_id: string; ticket_url: string } | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", address: "" });
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(true);
  const [custom, setCustom] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phoneValid) {
      setError("Please enter a valid phone number, or leave it blank.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, ticket_quantity: qty, ...form, phone, custom_fields: custom })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setDone(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl bg-white/[.03] p-8 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-brass-gradient text-2xl text-ink-950">
          ✓
        </div>
        <h2 className="text-3xl font-medium">You&rsquo;re registered.</h2>
        <p className="mt-3 text-bone/55">Registration {done.registration_id}</p>
        <a
          className="mt-7 inline-flex rounded-xl bg-brass-gradient px-5 py-3 font-semibold text-ink-950"
          href={done.ticket_url}
        >
          Open ticket
        </a>
        <p className="mt-4 text-xs text-bone/35">Your ticket email is being sent to {form.email}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm text-bone/65">Number of tickets</label>
        <div className="glass flex items-center justify-between rounded-2xl p-2">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="grid h-12 w-12 place-items-center rounded-xl hover:bg-white/10"
          >
            <Minus size={18} />
          </button>
          <div className="text-center">
            <b className="text-2xl">{qty}</b>
            <div className="text-[10px] tracking-widest text-bone/35">MAX {max}</div>
          </div>
          <button
            type="button"
            onClick={() => setQty(Math.min(max, qty + 1))}
            className="grid h-12 w-12 place-items-center rounded-xl hover:bg-white/10"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <TextField
        label="Full name"
        required
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
      />
      <TextField
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <PhoneField onChange={(value, valid) => { setPhone(value); setPhoneValid(valid); }} />
      <TextField
        label="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />

      {fields.map((f) => (
        <TextField
          key={f.id}
          label={f.label}
          required={f.required}
          onChange={(e) => setCustom({ ...custom, [f.field_key]: e.target.value })}
        />
      ))}

      {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}

      <Button type="submit" size="lg" loading={loading} className="w-full">
        Complete registration
      </Button>
    </form>
  );
}
