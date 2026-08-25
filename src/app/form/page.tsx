"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import {
  DISCLAIMER,
  GCE_OPTIONS,
  computeNotice,
  emptyNotice,
  money,
  pctLabel,
  formatLongDate,
} from "@/lib/notice";
import { loadNotice, saveNotice } from "@/lib/storage";
import { NYC_RENT_STANDARD_PCT, type Notice } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-rule bg-cream px-3 py-2 text-sm text-ink outline-none ring-gold/20 focus:border-gold focus:ring-2";

export default function FormPage() {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(emptyNotice());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setNotice(loadNotice() ?? emptyNotice());
    setReady(true);
  }, []);

  const computed = useMemo(() => computeNotice(notice), [notice]);

  function patch(partial: Partial<Notice>) {
    setNotice((n) => ({ ...n, ...partial }));
  }

  function continueToPreview() {
    saveNotice(notice);
    router.push("/preview");
  }

  if (!ready) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="px-6 py-16 text-sm text-slate">Loading form…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader
        right={
          <button
            type="button"
            onClick={continueToPreview}
            className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-cream hover:bg-navy-mid"
          >
            Continue
          </button>
        }
      />

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <form
          className="rounded-2xl border border-rule bg-sheet p-5 shadow-sm sm:p-7"
          onSubmit={(e) => {
            e.preventDefault();
            continueToPreview();
          }}
        >
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold">THE NOTICE</p>
          <h1 className="mt-1 font-serif text-3xl text-navy">Parties and unit</h1>
          <p className="mt-2 text-sm text-slate">
            Names, the apartment, occupancy, and rents. State is New York.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Landlord name">
              <input
                className={inputClass}
                value={notice.landlordName}
                onChange={(e) => patch({ landlordName: e.target.value })}
                autoComplete="name"
              />
            </Field>
            <Field label="Signature name">
              <input
                className={inputClass}
                value={notice.signatureName}
                onChange={(e) => patch({ signatureName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Landlord mailing address">
            <input
              className={inputClass}
              value={notice.landlordAddress}
              onChange={(e) => patch({ landlordAddress: e.target.value })}
            />
          </Field>
          <Field label="Tenant name">
            <input
              className={inputClass}
              value={notice.tenantName}
              onChange={(e) => patch({ tenantName: e.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <Field label="Street">
              <input
                className={inputClass}
                value={notice.unitStreet}
                onChange={(e) => patch({ unitStreet: e.target.value })}
              />
            </Field>
            <Field label="Apt">
              <input
                className={inputClass}
                value={notice.unitApt}
                onChange={(e) => patch({ unitApt: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_5rem_7rem]">
            <Field label="City">
              <input
                className={inputClass}
                value={notice.unitCity}
                onChange={(e) => patch({ unitCity: e.target.value })}
              />
            </Field>
            <Field label="State">
              <input className={inputClass} value="NY" readOnly />
            </Field>
            <Field label="ZIP">
              <input
                className={inputClass}
                value={notice.unitZip}
                onChange={(e) => patch({ unitZip: e.target.value })}
              />
            </Field>
          </div>

          <p className="mt-8 text-[11px] font-semibold tracking-[0.18em] text-gold">
            RENT AND DATES
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Occupancy start">
              <input
                type="date"
                className={inputClass}
                value={notice.occupancyStart}
                onChange={(e) => patch({ occupancyStart: e.target.value })}
              />
            </Field>
            <Field label="Current lease term (months)">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={notice.leaseTermMonths || ""}
                onChange={(e) =>
                  patch({ leaseTermMonths: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Current monthly rent">
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={notice.currentRent || ""}
                onChange={(e) =>
                  patch({ currentRent: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="New monthly rent">
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={notice.newRent || ""}
                onChange={(e) => patch({ newRent: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Proposed effective date">
              <input
                type="date"
                className={inputClass}
                value={notice.effectiveDate}
                onChange={(e) => patch({ effectiveDate: e.target.value })}
              />
            </Field>
            <Field label="Notice date">
              <input
                type="date"
                className={inputClass}
                value={notice.noticeDate}
                onChange={(e) => patch({ noticeDate: e.target.value })}
              />
            </Field>
          </div>

          <p className="mt-8 text-[11px] font-semibold tracking-[0.18em] text-gold">
            GOOD CAUSE EVICTION
          </p>
          <p className="mt-2 text-sm text-slate">
            Is this unit covered by Good Cause Eviction, or does an exemption apply?
          </p>
          <fieldset className="mt-4 space-y-2">
            {GCE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-3 ${
                  notice.gceKind === opt.value
                    ? "border-gold bg-gold-faint"
                    : "border-rule bg-cream"
                }`}
              >
                <input
                  type="radio"
                  name="gceKind"
                  className="mt-1"
                  checked={notice.gceKind === opt.value}
                  onChange={() => patch({ gceKind: opt.value })}
                />
                <span>
                  <span className="block text-sm font-medium text-navy">{opt.title}</span>
                  <span className="block text-xs text-slate">{opt.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {notice.gceKind === "exempt_other" ? (
            <Field label="Exemption reason">
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={notice.gceOtherReason}
                onChange={(e) => patch({ gceOtherReason: e.target.value })}
              />
            </Field>
          ) : null}

          {computed.justificationRequired ? (
            <Field
              label={`Justification (required — increase exceeds ${NYC_RENT_STANDARD_PCT}% local rent standard)`}
            >
              <textarea
                className={`${inputClass} min-h-[90px]`}
                value={notice.justification}
                onChange={(e) => patch({ justification: e.target.value })}
                placeholder="Why the increase exceeds the NYC local rent standard."
              />
            </Field>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-cream hover:bg-navy-mid"
            >
              Continue to preview
            </button>
          </div>
        </form>

        <aside className="rounded-2xl border border-rule bg-navy p-5 text-cream lg:sticky lg:top-20">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold">LIVE MATH</p>
          <h2 className="mt-2 font-serif text-2xl">
            {notice.currentRent > 0 ? pctLabel(computed.increasePct) : "—"}
          </h2>
          <p className="mt-1 text-sm text-gold-faint/80">
            {notice.currentRent > 0
              ? `${money(computed.increaseAmount)} per month`
              : "Enter both rents"}
          </p>
          <dl className="mt-5 space-y-3 text-sm">
            <Row k="§226-c" v={computed.section226cRequired ? "Required" : "Not required"} />
            <Row k="Notice" v={`${computed.noticeDays} days`} />
            <Row
              k="Send by"
              v={computed.sendByDate ? formatLongDate(computed.sendByDate) : "—"}
            />
            <Row k="GCE" v={computed.gceLabel} />
            <Row k="Standard" v={`${NYC_RENT_STANDARD_PCT}%`} />
          </dl>
          {computed.sendByPast ? (
            <p className="mt-4 rounded-lg bg-warn-faint px-3 py-2 text-xs text-warn">
              Send-by is in the past. Preview will suggest a later effective date.
            </p>
          ) : null}
          <p className="mt-6 text-[11px] leading-relaxed text-gold-faint/70">{DISCLAIMER}</p>
        </aside>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-[11px] text-slate">{label}</span>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
      <dt className="text-[11px] uppercase tracking-wide text-gold-faint/60">{k}</dt>
      <dd className="text-right text-sm">{v}</dd>
    </div>
  );
}
