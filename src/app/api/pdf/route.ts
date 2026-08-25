import { NextResponse } from "next/server";
import { renderNoticePdf } from "@/lib/pdf";
import { verifyToken } from "@/lib/token";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const result = verifyToken(token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (!result.payload.paid) {
    return NextResponse.json(
      { error: "Pay $19 to download this notice PDF." },
      { status: 402 },
    );
  }

  const bytes = await renderNoticePdf(result.payload.n);
  const tenant = (result.payload.n.tenantName || "notice")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const filename = `${tenant || "rent"}-increase-notice.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
