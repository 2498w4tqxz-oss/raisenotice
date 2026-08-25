import { NextResponse } from "next/server";
import { hasStripe } from "@/lib/base-url";
import { PRICE_CENTS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "raisenotice",
    mode: hasStripe() ? "stripe" : "demo",
    price: PRICE_CENTS,
    currency: "usd",
    port: 3001,
  });
}
