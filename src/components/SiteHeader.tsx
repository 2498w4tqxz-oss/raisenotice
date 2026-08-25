import Link from "next/link";
import { PRICE_LABEL } from "@/lib/types";

export function SiteHeader({
  kicker,
  right,
}: {
  kicker?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-rule/80 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-navy font-serif text-lg text-cream">
            R
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-navy">RaiseNotice</p>
            <p className="hidden text-[11px] text-slate sm:block">
              {kicker ? `${kicker} · ` : ""}NYC rent notice · {PRICE_LABEL} · no account
            </p>
          </div>
        </Link>
        {right}
      </div>
    </header>
  );
}
