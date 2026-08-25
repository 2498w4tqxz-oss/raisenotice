"use client";

export function DemoPayModal({
  open,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-pay-title"
        className="w-full max-w-md rounded-sm border border-gold/40 bg-paper p-5 shadow-2xl"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
          Demo pay
        </p>
        <h2 id="demo-pay-title" className="mt-2 font-serif text-2xl text-navy">
          Unlock this notice — $19
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          Stripe keys are not on this machine. DEMO PAY signs a paid token the
          same way a real $19 Checkout will, and the PDF download is gated on
          that token. No card is charged.
        </p>
        {error ? (
          <p className="mt-3 border border-burgundy/30 bg-burgundy-faint px-3 py-2 text-sm text-burgundy">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-12 bg-navy text-sm font-semibold text-paper disabled:opacity-60"
          >
            {busy ? "Signing paid token…" : "Confirm DEMO PAY — unlock PDF"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-11 border border-rule text-sm text-mute"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
