import { NextResponse } from "next/server";
import { hasStripe } from "@/lib/base-url";
import { signPaidNotice } from "@/lib/token";
import { normalizeNotice, validateNotice } from "@/lib/validate";

export async function POST(req: Request) {
  if (hasStripe()) {
    return NextResponse.json(
      { error: "Stripe is configured. Use Checkout instead of DEMO PAY." },
      { status: 400 },
    );
  }

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

  return NextResponse.json({
    token: signPaidNotice(notice),
    demo: true,
  });
}
