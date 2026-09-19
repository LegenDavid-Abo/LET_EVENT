"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";

type ScanResult = { result: "VALID" | "USED" | "REVOKED" | "INVALID" | "ERROR"; ticket_number?: string };

const tones: Record<ScanResult["result"], string> = {
  VALID: "border-emerald-400/30 bg-emerald-400/10",
  USED: "border-amber-400/30 bg-amber-400/10",
  REVOKED: "border-red-400/30 bg-red-400/10",
  INVALID: "border-red-400/30 bg-red-400/10",
  ERROR: "border-red-400/30 bg-red-400/10"
};

const labels: Record<ScanResult["result"], string> = {
  VALID: "Entry approved",
  USED: "Already used",
  REVOKED: "Ticket revoked",
  INVALID: "Entry denied",
  ERROR: "Scan error"
};

export default function Scanner() {
  const scannerRef = useRef<any>(null);
  // Ref (not state) so the qr.start() success callback — created once and
  // never re-created — always sees the latest value instead of a stale
  // closure over the value from when start() was first called.
  const processingRef = useRef(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [running, setRunning] = useState(false);

  async function stopScanner() {
    const qr = scannerRef.current;
    if (!qr) return;
    try {
      if (qr.getState && qr.getState() === 2 /* SCANNING */) {
        await qr.stop();
      }
      qr.clear();
    } catch {
      // Scanner was already stopped or torn down — safe to ignore.
    }
  }

  async function start() {
    setResult(null);
    setCameraError("");
    processingRef.current = false;

    await stopScanner();

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const qr = new Html5Qrcode("reader");
      scannerRef.current = qr;
      setRunning(true);

      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text: string) => {
          if (processingRef.current) return;
          processingRef.current = true;

          try {
            const token = text.split("/").pop();
            const res = await fetch("/api/checkin", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ token })
            });
            const data = await res.json();
            setResult(data);
          } catch {
            setResult({ result: "ERROR" });
          } finally {
            await stopScanner();
            setRunning(false);
          }
        },
        () => {
          // Per-frame "no QR code found" callback — expected constantly
          // while the camera is pointed away from a code, not an error.
        }
      );
    } catch (err: any) {
      setRunning(false);
      setCameraError(err?.message || "Could not access the camera. Check permissions and try again.");
    }
  }

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-lg">
      <div id="reader" className="min-h-[320px] overflow-hidden rounded-3xl bg-black" />

      {cameraError && (
        <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">
          {cameraError}
        </div>
      )}

      {result ? (
        <div className={`mt-4 rounded-3xl border p-7 text-center ${tones[result.result]}`}>
          <div className="text-5xl">{result.result === "VALID" ? "✓" : result.result === "USED" ? "!" : "×"}</div>
          <h2 className="mt-3 text-2xl font-medium">{labels[result.result]}</h2>
          {result.ticket_number && <p className="mt-2 text-bone/55">Ticket {result.ticket_number}</p>}
          <Button onClick={start} className="mt-6" icon={<RotateCcw size={16} />}>
            Scan again
          </Button>
        </div>
      ) : (
        !running && (
          <Button onClick={start} size="lg" className="mt-5 w-full" icon={<Camera size={18} />}>
            Start scanner
          </Button>
        )
      )}
    </div>
  );
}
