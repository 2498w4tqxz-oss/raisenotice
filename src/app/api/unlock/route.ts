import { NextResponse } from "next/server";
import Stripe from "stripe";
import { hasStripe } from "@/lib/base-url";
import { signPaidNotice, verifyToken } from "@/lib/token";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id") || "";
  const pending = url.searchParams.get("pending") || "";

  if (!sessionId || !pending) {
    return NextResponse.json(
      { error: "Missing session or pending notice." },
      { status: 400 },
    );
  }
  if (!hasStripe()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 400 });
  }

  const pendingResult = verifyToken(pending);
  if (!pendingResult.ok) {
    return NextResponse.json({ error: pendingResult.error }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed." }, { status: 402 });
  }

  const token = signPaidNotice(pendingResult.payload.n);
  return NextResponse.json({ token, mode: "stripe" });
}
