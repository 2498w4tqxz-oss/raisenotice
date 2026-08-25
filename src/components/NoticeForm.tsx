"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { SiteHeader } from "@/components/SiteHeader";
import { computeNotice } from "@/lib/notice";
import { SAMPLE_NOTICE } from "@/lib/sample";
import { emptyNotice } from "@/lib/notice";
import { loadNotice, saveNotice } from "@/lib/storage";
import type { GceKind, Notice } from "@/lib/types";
import { NYC_RENT_STANDARD_PCT } from "@/lib/types";
import { validateNotice, type FieldErrors } from "@/lib/validate";

const GCE_OPTIONS: { value: GceKind; label: string }[] = [
  { value: "covered", label: "Covered" },
  {
    value: "exempt_small_landlord",
    label: "Exempt — small landlord (≤10 units in NY)",
  },
  {
    value: "exempt_owner_occupied",
    label: "Exempt — owner lives in a ≤10 unit building",
  },
  { value: "exempt_other", label: "Exempt — other" },
];

export function NoticeForm({ useSample }: { useSample: boolean }) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(emptyNotice);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (useSample) {
      const sample = { ...SAMPLE_NOTICE };
      setNotice(sample);
      saveNotice(sample);
    } else {
      setNotice(loadNotice() ?? emptyNotice());
    }
    setReady(true);
  }, [useSample]);

  const computed = useMemo(() => computeNotice(notice), [notice]);

  function patch<K extends keyof Notice>(key: K, value: Notice[K]) {
    setNotice((prev) => {
      const next = { ...prev, [key]: value };
      saveNotice(next);
      return next;
    });
    setErrors((e) => {
      if (!e[key]) return e;
      const copy = { ...e };
      delete copy[key];
      return copy;
    });
  }

  function onPreview() {
    const check = validateNotice(notice, computed);
    saveNotice(notice);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    router.push("/preview");
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-cream">
        <SiteHeader kicker="Notice form" />
        <p className="px-5 py-10 text-sm text-mute">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <SiteHeader kicker="Notice form" />
      <main className="mx-auto max-w-lg px-5 py-8">
        <h1 className="font-serif text-3xl text-navy">Fill the notice</h1>
        <p className="mt-2 text-sm text-mute">
          One NYC 1–4 unit. Renewal with a rent increase. Preview computes the
          clock before you pay.
        </p>
        {useSample ? (
          <p className="mt-4 border border-gold/40 bg-gold-faint px-3 py-2 text-sm text-navy">
            Sample loaded: 2-family in Astoria. Check it, then preview.
          </p>
        ) : null}

        <Section title="Landlord">
          <Field label="Landlord name" error={errors.landlordName}>
            <input
              className={inputCls(errors.landlordName)}
              value={notice.landlordName}
              onChange={(e) => patch("landlordName", e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field label="Mailing address" error={errors.landlordAddress}>
            <textarea
              className={`${inputCls(errors.landlordAddress)} min-h-[72px]`}
              value={notice.landlordAddress}
              onChange={(e) => patch("landlordAddress", e.target.value)}
              rows={3}
            />
          </Field>
        </Section>

        <Section title="Tenant and unit">
          <Field label="Tenant name" error={errors.tenantName}>
            <input
              className={inputCls(errors.tenantName)}
              value={notice.tenantName}
              onChange={(e) => patch("tenantName", e.target.value)}
            />
          </Field>
          <Field label="Street address" error={errors.unitStreet}>
            <input
              className={inputCls(errors.unitStreet)}
              value={notice.unitStreet}
              onChange={(e) => patch("unitStreet", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit / apt" error={errors.unitApt}>
              <input
                className={inputCls(errors.unitApt)}
                value={notice.unitApt}
                onChange={(e) => patch("unitApt", e.target.value)}
              />
            </Field>
            <Field label="City" error={errors.unitCity}>
              <input
                className={inputCls(errors.unitCity)}
                value={notice.unitCity}
                onChange={(e) => patch("unitCity", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="State">
              <input className={inputCls()} value="NY" readOnly />
            </Field>
            <Field label="ZIP" error={errors.unitZip}>
              <input
                className={inputCls(errors.unitZip)}
                value={notice.unitZip}
                onChange={(e) => patch("unitZip", e.target.value)}
                inputMode="numeric"
              />
            </Field>
          </div>
        </Section>

        <Section title="Tenancy and rent">
          <Field label="Occupancy start date" error={errors.occupancyStart}>
            <input
              type="date"
              className={inputCls(errors.occupancyStart)}
              value={notice.occupancyStart}
              onChange={(e) => patch("occupancyStart", e.target.value)}
            />
          </Field>
          <Field
            label="Current lease term (months)"
            error={errors.leaseTermMonths}
          >
            <input
              type="number"
              min={1}
              className={inputCls(errors.leaseTermMonths)}
              value={notice.leaseTermMonths || ""}
              onChange={(e) =>
                patch("leaseTermMonths", Number(e.target.value) || 0)
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current monthly rent" error={errors.currentRent}>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputCls(errors.currentRent)}
                value={notice.currentRent || ""}
                onChange={(e) =>
                  patch("currentRent", Number(e.target.value) || 0)
                }
              />
            </Field>
            <Field label="New monthly rent" error={errors.newRent}>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputCls(errors.newRent)}
                value={notice.newRent || ""}
                onChange={(e) => patch("newRent", Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <Field label="Proposed effective date" error={errors.effectiveDate}>
            <input
              type="date"
              className={inputCls(errors.effectiveDate)}
              value={notice.effectiveDate}
              onChange={(e) => patch("effectiveDate", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Good Cause Eviction (RPL §231-c)">
          <fieldset className="space-y-2">
            <legend className="sr-only">GCE status</legend>
            {GCE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-start gap-3 border border-rule bg-paper px-3 py-2.5"
              >
                <input
                  type="radio"
                  name="gce"
                  className="mt-1"
                  checked={notice.gceKind === opt.value}
                  onChange={() => patch("gceKind", opt.value)}
                />
                <span className="text-sm leading-snug">{opt.label}</span>
              </label>
            ))}
          </fieldset>
          {notice.gceKind === "exempt_other" ? (
            <Field
              label="Exemption reason"
              error={errors.gceOtherReason}
              className="mt-3"
            >
              <input
                className={inputCls(errors.gceOtherReason)}
                value={notice.gceOtherReason}
                onChange={(e) => patch("gceOtherReason", e.target.value)}
              />
            </Field>
          ) : null}
          {notice.gceKind === "covered" ? (
            <Field
              label={
                computed.justificationRequired
                  ? `Justification (required — increase exceeds ${NYC_RENT_STANDARD_PCT}%)`
                  : "Justification (optional unless increase exceeds 8.38%)"
              }
              error={errors.justification}
              className="mt-3"
            >
              <textarea
                className={`${inputCls(errors.justification)} min-h-[88px]`}
                value={notice.justification}
                onChange={(e) => patch("justification", e.target.value)}
                rows={4}
              />
            </Field>
          ) : null}
        </Section>

        <Section title="Sign">
          <Field label="Signature name" error={errors.signatureName}>
            <input
              className={inputCls(errors.signatureName)}
              value={notice.signatureName}
              onChange={(e) => patch("signatureName", e.target.value)}
            />
          </Field>
          <Field label="Notice date" error={errors.noticeDate}>
            <input
              type="date"
              className={inputCls(errors.noticeDate)}
              value={notice.noticeDate}
              onChange={(e) => patch("noticeDate", e.target.value)}
            />
          </Field>
        </Section>

        {Object.keys(errors).length > 0 ? (
          <p className="mt-4 border border-burgundy/30 bg-burgundy-faint px-3 py-2 text-sm text-burgundy">
            Fix the highlighted fields before preview.
          </p>
        ) : null}

        <Disclaimer className="mt-8" />
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-rule bg-paper/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={onPreview}
            className="h-12 w-full bg-navy text-sm font-semibold text-paper"
          >
            Preview this notice
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl text-navy">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-mute">
        {label}
      </span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-xs text-burgundy">{error}</p> : null}
    </label>
  );
}

function inputCls(error?: string) {
  return `w-full border bg-paper px-3 py-2.5 text-[16px] outline-none focus:border-navy ${
    error ? "border-burgundy" : "border-rule"
  }`;
}
