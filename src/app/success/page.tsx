"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";

function SuccessInner() {
  const params = useSearchParams();
  const [token, setToken] = useState<string | null>(params.get("token"));
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const demo = params.get("demo") === "1";

  useEffect(() => {
    const sessionId = params.get("session_id");
    const pending = params.get("pending");
    if (token) return;
    if (!sessionId || !pending) {
      setError("Missing unlock token. Go back and pay for this notice.");
      return;
    }
    fetch(
      `/api/unlock?session_id=${encodeURIComponent(sessionId)}&pending=${encodeURIComponent(pending)}`,
    )
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not verify payment");
        setToken(data.token);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not verify payment"),
      );
  }, [params, token]);

  useEffect(() => {
    if (!token || downloaded) return;
    downloadPdf(token)
      .then(() => setDownloaded(true))
      .catch(() => undefined);
  }, [token, downloaded]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        {demo ? (
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold">
            TEST / DEMO PAY — no card charged
          </p>
        ) : (
          <p className="text-[11px] font-semibold tracking-[0.18em] text-ok">PAID</p>
        )}
        <h1 className="mt-2 font-serif text-4xl text-navy">Notice unlocked</h1>
        <p className="mt-3 text-slate">
          Your filled section 226-c / 231-c PDF is ready. Download it and serve it
          according to the statute.
        </p>

        {error ? <p className="mt-6 text-sm text-warn">{error}</p> : null}

        {!token && !error ? (
          <p className="mt-6 text-sm text-slate">Confirming unlock…</p>
        ) : null}

        {token ? (
          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => downloadPdf(token)}
              className="w-full rounded-full bg-navy py-3 text-sm font-semibold text-cream hover:bg-navy-mid"
            >
              Download PDF
            </button>
            <p className="text-center text-xs text-slate">
              If the file did not start automatically, use the button.
            </p>
          </div>
        ) : null}

        <Link
          href="/"
          className="mt-10 inline-block text-sm text-slate hover:text-navy"
        >
          Prepare another notice
        </Link>
      </main>
    </div>
  );
}

async function downloadPdf(token: string) {
  const res = await fetch(`/api/pdf?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error("PDF failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rent-increase-notice.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate">Loading…</div>}>
      <SuccessInner />
    </Suspense>
  );
}
