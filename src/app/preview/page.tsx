"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import {
  DISCLAIMER,
  computeNotice,
  formatLongDate,
  formatUnit,
  money,
  pctLabel,
} from "@/lib/notice";
import { SAMPLE_NOTICE } from "@/lib/sample";
import { loadNotice, saveNotice } from "@/lib/storage";
import {
  NYC_RENT_STANDARD_PCT,
  NYC_RENT_STANDARD_SOURCE,
  PRICE_LABEL,
  type Notice,
} from "@/lib/types";
import { validateNotice } from "@/lib/validate";

type PayMode = "unknown" | "stripe" | "demo";

export default function PreviewPage() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [mode, setMode] = useState<PayMode>("unknown");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const [payAttempted, setPayAttempted] = useState(false);

  useEffect(() => {
    setNotice(loadNotice() ?? SAMPLE_NOTICE);
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setMode(d.mode === "stripe" ? "stripe" : "demo"))
      .catch(() => setMode("demo"));
    if (typeof window !== "undefined" && window.location.search.includes("canceled=1")) {
      setCanceled(true);
    }
  }, []);

  const computed = useMemo(
    () => (notice ? computeNotice(notice) : null),
    [notice],
  );
  const validation = useMemo(
    () => (notice ? validateNotice(notice, computed ?? undefined) : null),
    [notice, computed],
  );

  function applySuggestedDate() {
    if (!notice || !computed) return;
    const next = { ...notice, effectiveDate: computed.suggestedEffectiveDate };
    setNotice(next);
    saveNotice(next);
    setError(null);
  }

  async function startCheckout() {
    if (!notice || !validation) return;
    setPayAttempted(true);
    if (!validation.ok) {
      setError(Object.values(validation.errors)[0] || "Fix the highlighted fields.");
      return;
    }
    setBusy(true);
    setError(null);
    setCanceled(false);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.mode === "stripe" && data.url) {
        window.location.href = data.url;
        return;
      }
      setShowDemo(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDemoPay() {
    if (!notice) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/demo-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo pay failed");
      window.location.href = `/success?token=${encodeURIComponent(data.token)}&demo=1`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo pay failed");
      setBusy(false);
    }
  }

  if (!notice || !computed || !validation) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="px-6 py-16 text-sm text-slate">Loading preview…</p>
      </div>
    );
  }

  const canPay = validation.ok;
  const showErrors = !validation.ok;
  const payLabel = busy
    ? "Working…"
    : mode === "demo"
      ? `Pay ${PRICE_LABEL} · DEMO`
      : `Pay ${PRICE_LABEL}`;

  return (
    <div className="min-h-screen">
      <SiteHeader
        right={
          <div className="flex items-center gap-3">
            <Link href="/form" className="text-sm font-medium text-navy underline-offset-4 hover:underline">
              Edit
            </Link>
            <button
              type="button"
              onClick={startCheckout}
              disabled={busy || !canPay}
              className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-gold-deep hover:text-cream disabled:cursor-not-allowed disabled:opacity-50"
            >
              {payLabel}
            </button>
          </div>
        }
      />

      {canceled ? (
        <div className="bg-navy-faint px-4 py-2 text-center text-sm text-navy">
          Checkout canceled. Your notice is still here.
        </div>
      ) : null}

      {computed.sendByPast ? (
        <div className="bg-amber-faint px-4 py-3 text-center text-sm text-amber">
          <span className="font-medium">Send-by date is in the past</span>
          {" — "}
          {formatLongDate(computed.sendByDate)}. The {computed.noticeDays}-day
          clock may not be met.{" "}
          <button
            type="button"
            onClick={applySuggestedDate}
            className="font-semibold underline underline-offset-2"
          >
            Use suggested effective date {formatLongDate(computed.suggestedEffectiveDate)}
          </button>
        </div>
      ) : null}

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <article className="rounded-2xl border border-rule bg-sheet p-6 shadow-sheet sm:p-10">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-gold">
            PREVIEW · NOT A SERVED NOTICE
          </p>
          <h1 className="mt-3 font-serif text-3xl text-navy">
            Notice of rent increase
          </h1>
          <p className="mt-2 text-sm text-slate">{formatUnit(notice)}</p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <Fact k="Landlord" v={notice.landlordName || "—"} err={showErrors ? validation.errors.landlordName : undefined} />
            <Fact k="Tenant" v={notice.tenantName || "—"} err={showErrors ? validation.errors.tenantName : undefined} />
            <Fact k="Current rent" v={notice.currentRent ? money(notice.currentRent) : "—"} err={showErrors ? validation.errors.currentRent : undefined} />
            <Fact k="New rent" v={notice.newRent ? money(notice.newRent) : "—"} err={showErrors ? validation.errors.newRent : undefined} />
            <Fact k="Increase" v={notice.currentRent ? pctLabel(computed.increasePct) : "—"} />
            <Fact
              k="§226-c"
              v={computed.section226cRequired ? "Required" : "Not required (< 5%)"}
            />
            <Fact k="Notice period" v={`${computed.noticeDays}-day`} />
            <Fact
              k="Send-by"
              v={computed.sendByDate ? formatLongDate(computed.sendByDate) : "—"}
              err={showErrors ? validation.errors.effectiveDate : undefined}
            />
            <Fact k="Effective" v={notice.effectiveDate ? formatLongDate(notice.effectiveDate) : "—"} />
            <Fact k="GCE" v={computed.gceLabel} />
          </dl>

          {showErrors ? (
            <ul className="mt-6 space-y-1 rounded-xl border border-warn/30 bg-warn-faint px-4 py-3 text-sm text-warn">
              {Object.values(validation.errors).map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          ) : null}

          <section className="mt-10 border-t border-rule pt-8">
            <h2 className="font-serif text-xl text-navy">
              {computed.section226cRequired
                ? "Notice of Rent Increase — N.Y. Real Property Law §226-c"
                : "Written notice of rent increase (less than 5%)"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              {computed.section226cRequired
                ? `This is notice under Real Property Law §226-c that monthly rent will increase from ${money(notice.currentRent)} to ${money(notice.newRent)} (${pctLabel(computed.increasePct)}) effective ${notice.effectiveDate ? formatLongDate(notice.effectiveDate) : "—"}. Required notice is ${computed.noticeDays} days. Serve on or before ${computed.sendByDate ? formatLongDate(computed.sendByDate) : "—"}.`
                : `This written letter notifies ${notice.tenantName || "the tenant"} that rent will increase from ${money(notice.currentRent)} to ${money(notice.newRent)} effective ${notice.effectiveDate ? formatLongDate(notice.effectiveDate) : "—"}. Because the increase is under five percent, §226-c is not required. The §231-c disclosure still applies.`}
            </p>
          </section>

          <section className="mt-8 border-t border-rule pt-8">
            <h2 className="font-serif text-xl text-navy">
              Good Cause Eviction Law Notice — N.Y. Real Property Law §231-c
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">{computed.gceReason}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              NYC local rent standard: {NYC_RENT_STANDARD_PCT.toFixed(2)}%. Source:{" "}
              {NYC_RENT_STANDARD_SOURCE}.
            </p>
            {computed.justificationRequired && notice.justification ? (
              <p className="mt-3 text-sm leading-relaxed text-ink">
                Justification: {notice.justification}
              </p>
            ) : null}
          </section>

          <p className="mt-10 text-xs leading-relaxed text-slate">{DISCLAIMER}</p>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-2xl border border-rule bg-navy p-5 text-cream">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-gold">UNLOCK</p>
            <p className="mt-2 font-serif text-3xl">{PRICE_LABEL}</p>
            <p className="mt-2 text-sm text-gold-faint/80">
              One notice. Letter-size PDF with both statutory sections. No account.
            </p>
            <button
              type="button"
              onClick={startCheckout}
              disabled={busy || !canPay}
              className="mt-5 w-full rounded-full bg-gold py-3 text-sm font-semibold text-navy hover:bg-gold-deep hover:text-cream disabled:cursor-not-allowed disabled:opacity-50"
            >
              {payLabel}
            </button>
            {!canPay ? (
              <p className="mt-3 text-xs text-gold-faint/70">
                Complete required fields before paying. Use Edit to finish the form.
              </p>
            ) : (
              <p className="mt-3 text-xs text-gold-faint/70">
                {mode === "demo"
                  ? "DEMO PAY until Stripe keys are set. No card is charged."
                  : "Stripe Checkout. Card charged once for this PDF."}
              </p>
            )}
            {error ? <p className="mt-3 text-xs text-warn-faint">{error}</p> : null}
          </div>
          <Link
            href="/form"
            className="block rounded-2xl border border-rule bg-sheet px-5 py-4 text-sm text-navy hover:border-gold"
          >
            Edit facts on the form →
          </Link>
        </aside>
      </main>

      {showDemo ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-sheet p-6 shadow-xl">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-gold">DEMO PAY</p>
            <h2 className="mt-2 font-serif text-2xl text-navy">Stripe keys not set</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              DEMO PAY — Stripe keys not set. Unlock this notice (no charge). You
              still get the filled PDF. Add{" "}
              <code className="font-mono text-ink">STRIPE_SECRET_KEY</code> later to
              switch this to real Checkout.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDemo(false)}
                className="flex-1 rounded-full border border-rule py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDemoPay}
                disabled={busy}
                className="flex-1 rounded-full bg-navy py-2.5 text-sm font-semibold text-cream hover:bg-navy-mid disabled:opacity-60"
              >
                {busy ? "Unlocking…" : "Unlock this notice (no charge)"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Fact({
  k,
  v,
  err,
}: {
  k: string;
  v: string;
  err?: string;
}) {
  return (
    <div className={err ? "rounded-lg bg-warn-faint px-2 py-1" : ""}>
      <dt className="text-[11px] uppercase tracking-wide text-slate">{k}</dt>
      <dd className="mt-0.5 font-medium text-navy">{v}</dd>
      {err ? <p className="mt-0.5 text-xs text-warn">{err}</p> : null}
    </div>
  );
}
