"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { TextField } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import PhoneField from "@/components/PhoneField";

interface RegistrationFormProps {
  slug: string;
  max: number;
  fields: any[];
}

interface SavedRegistration {
  registration_id: string;
  ticket_url: string;
  email?: string;
}

function storageKey(slug: string) {
  return `evently:registration:${slug}`;
}

// Best-effort read/write — private browsing or blocked storage should
// never break the page, it just means we can't remember the visit.
function readSavedRegistration(slug: string): SavedRegistration | null {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveRegistration(slug: string, value: SavedRegistration) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(value));
  } catch {
    // Storage unavailable — the registration still succeeded server-side,
    // this only affects the "remember me on this device" convenience.
  }
}

export default function RegistrationForm({
  slug,
  max,
  fields,
}: RegistrationFormProps) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<SavedRegistration | null>(null);
  const [returning, setReturning] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    address: "",
  });
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(true);
  const [custom, setCustom] = useState<Record<string, string>>({});

  // If this browser already completed a registration for this event,
  // go straight to the "you're registered" / ticket view instead of
  // showing the form again.
  useEffect(() => {
    const saved = readSavedRegistration(slug);

    if (saved) {
      setDone(saved);
      setReturning(true);
    }
  }, [slug]);

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
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          slug,
          ticket_quantity: qty,
          ...form,
          phone,
          custom_fields: custom,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const record: SavedRegistration = {
        registration_id: data.registration_id,
        ticket_url: data.ticket_url,
        email: form.email,
      };

      saveRegistration(slug, record);
      setDone(record);
      setReturning(false);
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

        <h2 className="text-3xl font-medium">
          {returning
            ? "Welcome back — you're already registered."
            : "You're registered."}
        </h2>

        <p className="mt-3 text-bone/55">
          Registration {done.registration_id}
        </p>

        <a
          className="mt-7 inline-flex rounded-xl bg-brass-gradient px-5 py-3 font-semibold text-ink-950"
          href={done.ticket_url}
        >
          Open ticket
        </a>

        {!returning && (
          <p className="mt-4 text-xs text-bone/35">
            Your ticket email is being sent to {done.email}.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm text-bone/65">
          Number of tickets
        </label>

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
            <div className="text-[10px] tracking-widest text-bone/35">
              MAX {max}
            </div>
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
        onChange={(e) =>
          setForm({
            ...form,
            full_name: e.target.value,
          })
        }
      />

      <TextField
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(e) =>
          setForm({
            ...form,
            email: e.target.value,
          })
        }
      />

      <PhoneField
        onChange={(value, valid) => {
          setPhone(value);
          setPhoneValid(valid);
        }}
      />

      <TextField
        label="Address"
        value={form.address}
        onChange={(e) =>
          setForm({
            ...form,
            address: e.target.value,
          })
        }
      />

      {fields.map((f) => (
        <TextField
          key={f.id}
          label={f.label}
          required={f.required}
          onChange={(e) =>
            setCustom({
              ...custom,
              [f.field_key]: e.target.value,
            })
          }
        />
      ))}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        loading={loading}
        className="w-full"
      >
        Complete registration
      </Button>
    </form>
  );
}
