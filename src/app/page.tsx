"use client";

import { useRouter } from "next/navigation";
import { DISCLAIMER, emptyNotice } from "@/lib/notice";
import { SAMPLE_NOTICE } from "@/lib/sample";
import { saveNotice } from "@/lib/storage";
import { PRICE_LABEL } from "@/lib/types";
import { SiteHeader } from "@/components/SiteHeader";

export default function LandingPage() {
  const router = useRouter();

  function trySample() {
    saveNotice(SAMPLE_NOTICE);
    router.push("/preview");
  }

  function startBlank() {
    saveNotice(emptyNotice());
    router.push("/form");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader
        right={
          <button
            type="button"
            onClick={startBlank}
            className="text-sm font-medium text-navy underline-offset-4 hover:underline"
          >
            Start from blank
          </button>
        }
      />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-gold">
          NEW YORK · RPL §226-c · GCE §231-c
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.15] text-navy sm:text-5xl md:text-[3.4rem]">
          NYC rent-increase notice, filled. {PRICE_LABEL}.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate sm:text-lg">
          Enter the unit, the rents, and whether Good Cause Eviction applies.
          RaiseNotice computes the notice period, the send-by date, and fills
          both statutory sections. You download a letter-size PDF. No account.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={trySample}
            className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-cream shadow-sheet transition hover:bg-navy-mid"
          >
            Try sample: 2-family in Astoria
          </button>
          <button
            type="button"
            onClick={startBlank}
            className="text-sm font-medium text-navy underline underline-offset-4"
          >
            Start from blank
          </button>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          <Card
            kicker="Timing"
            title="30 / 60 / 90 days"
            body="§226-c uses the longer of occupancy and lease-term buckets. The sample 2-family in Astoria needs 90 days."
          />
          <Card
            kicker="Coverage"
            title="Good Cause disclosure"
            body="Every increase still needs a §231-c notice: covered, small-landlord, owner-occupied, or other exemption."
          />
          <Card
            kicker="NYC 2026"
            title="8.38% local standard"
            body="DHCR notice dated May 4, 2026 (CPI 3.38% + 5%). Covered units above that need a written justification."
          />
        </div>

        <section className="mt-16 overflow-hidden rounded-2xl border border-rule bg-sheet shadow-sheet">
          <div className="grid md:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-gold">
                SAMPLE · ASTORIA
              </p>
              <h2 className="mt-2 font-serif text-2xl text-navy">
                Maria Chen · 24-18 31st St, Apt 2R
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate">
                $2,200 to $2,400. Tenant in place since 2023. Small landlord,
                not covered by Good Cause Eviction. Preview shows the 9.09%
                increase, §226-c required, 90-day notice, and send-by date.
              </p>
              <button
                type="button"
                onClick={trySample}
                className="mt-6 text-sm font-semibold text-gold-deep underline underline-offset-4"
              >
                Open the sample preview →
              </button>
            </div>
            <div className="border-t border-rule bg-navy p-6 text-cream md:border-l md:border-t-0 sm:p-8">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                <Stat k="Increase" v="9.09%" />
                <Stat k="§226-c" v="Required" />
                <Stat k="Notice" v="90 days" />
                <Stat k="GCE" v="Not covered" />
              </dl>
              <p className="mt-6 font-mono text-[11px] text-gold-faint/80">
                {PRICE_LABEL} unlocks the filled PDF.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-12 max-w-2xl text-xs leading-relaxed text-slate">
          {DISCLAIMER}
        </p>
      </main>

      <footer className="border-t border-rule px-4 py-8 text-center text-[11px] text-slate">
        RaiseNotice fills a statutory notice. It is not a law firm.
      </footer>
    </div>
  );
}

function Card({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-rule bg-sheet p-5 shadow-sm">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-gold">{kicker}</p>
      <h3 className="mt-2 font-serif text-xl text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate">{body}</p>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gold-faint/70">{k}</dt>
      <dd className="mt-1 font-serif text-xl">{v}</dd>
    </div>
  );
}
