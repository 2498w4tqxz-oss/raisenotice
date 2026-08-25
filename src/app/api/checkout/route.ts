import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getBaseUrl, hasStripe } from "@/lib/base-url";
import { signPendingNotice } from "@/lib/token";
import { PRICE_CENTS, PRICE_LABEL } from "@/lib/types";
import { normalizeNotice, validateNotice } from "@/lib/validate";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = raw as { notice?: unknown };
  const notice = normalizeNotice(body.notice);
  if (!notice) {
    return NextResponse.json({ error: "Invalid notice" }, { status: 400 });
  }

  const result = validateNotice(notice);
  if (!result.ok) {
    const first = Object.values(result.errors)[0] || "Notice is incomplete.";
    return NextResponse.json(
      { error: first, errors: result.errors },
      { status: 400 },
    );
  }

  if (!hasStripe()) {
    return NextResponse.json({
      mode: "demo",
      message:
        "Stripe is not configured. Use DEMO PAY to unlock this notice (test, no charge).",
    });
  }

  const pending = signPendingNotice(notice);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const origin = getBaseUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: PRICE_CENTS,
          product_data: {
            name: `RaiseNotice — unlock this notice (${PRICE_LABEL})`,
            description: `${notice.tenantName} · ${notice.unitStreet} · filled §226-c / §231-c PDF`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&pending=${encodeURIComponent(pending)}`,
    cancel_url: `${origin}/preview?canceled=1`,
    metadata: { product: "raisenotice-unlock" },
  });

  return NextResponse.json({ mode: "stripe", url: session.url });
}
