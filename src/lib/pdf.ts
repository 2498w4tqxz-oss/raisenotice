import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  computeNotice,
  formatLongDate,
  formatUnit,
  money,
  pctLabel,
} from "./notice";
import {
  NYC_RENT_STANDARD_PCT,
  NYC_RENT_STANDARD_SOURCE,
  type Notice,
} from "./types";

const NAVY = rgb(21 / 255, 34 / 255, 56 / 255);
const GOLD = rgb(184 / 255, 134 / 255, 11 / 255);
const CREAM = rgb(246 / 255, 241 / 255, 231 / 255);
const INK = rgb(20 / 255, 24 / 255, 31 / 255);
const MUTE = rgb(92 / 255, 101 / 255, 112 / 255);
const RULE = rgb(226 / 255, 217 / 255, 200 / 255);
const FAINT = rgb(232 / 255, 238 / 255, 246 / 255);

const PAGE_W = 612;
const PAGE_H = 792;
const L = 54;
const R = PAGE_W - 54;
const MAX_W = R - L;

function latin(s: string): string {
  return s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/§/g, "\u00A7")
    .replace(/[^\x00-\xFF]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, max = MAX_W): string[] {
  const words = latin(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  helv: PDFFont;
  helvBold: PDFFont;
  times: PDFFont;
  timesBold: PDFFont;
};

function ensure(ctx: Ctx, need: number) {
  if (ctx.y - need > 64) return;
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 10, width: PAGE_W, height: 10, color: NAVY });
  ctx.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 36, color: NAVY });
  ctx.y = PAGE_H - 40;
}

function para(ctx: Ctx, text: string, size = 10, leading = 13.5, font?: PDFFont) {
  const f = font ?? ctx.times;
  for (const line of wrap(text, f, size)) {
    ensure(ctx, leading + 4);
    ctx.page.drawText(line, { x: L, y: ctx.y, size, font: f, color: INK });
    ctx.y -= leading;
  }
}

function heading(ctx: Ctx, text: string) {
  ensure(ctx, 36);
  ctx.y -= 8;
  ctx.page.drawRectangle({ x: L, y: ctx.y - 6, width: MAX_W, height: 22, color: NAVY });
  ctx.page.drawText(latin(text), {
    x: L + 10,
    y: ctx.y,
    size: 9,
    font: ctx.helvBold,
    color: rgb(1, 1, 1),
  });
  ctx.y -= 28;
}

function kv(ctx: Ctx, label: string, value: string) {
  ensure(ctx, 16);
  ctx.page.drawText(latin(label), { x: L, y: ctx.y, size: 8, font: ctx.helvBold, color: MUTE });
  const lines = wrap(value, ctx.helv, 10, MAX_W - 150);
  ctx.page.drawText(lines[0] || "-", {
    x: L + 150,
    y: ctx.y,
    size: 10,
    font: ctx.helv,
    color: INK,
  });
  ctx.y -= 14;
  for (const extra of lines.slice(1)) {
    ensure(ctx, 14);
    ctx.page.drawText(extra, { x: L + 150, y: ctx.y, size: 10, font: ctx.helv, color: INK });
    ctx.y -= 14;
  }
}

export async function renderNoticePdf(notice: Notice): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const times = await doc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const page = doc.addPage([PAGE_W, PAGE_H]);

  const c = computeNotice(notice);
  const unit = formatUnit(notice);
  const ctx: Ctx = { doc, page, y: PAGE_H - 36, helv, helvBold, times, timesBold };

  page.drawRectangle({ x: 0, y: PAGE_H - 10, width: PAGE_W, height: 10, color: NAVY });
  page.drawRectangle({ x: 0, y: PAGE_H - 78, width: PAGE_W, height: 68, color: CREAM });
  page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 2.5, color: GOLD });

  page.drawText("RAISENOTICE", {
    x: L,
    y: PAGE_H - 36,
    size: 8,
    font: helvBold,
    color: GOLD,
  });
  page.drawText("New York statutory rent notice", {
    x: L,
    y: PAGE_H - 50,
    size: 8,
    font: helv,
    color: MUTE,
  });
  const dateLabel = formatLongDate(notice.noticeDate);
  page.drawText(latin(dateLabel), {
    x: R - helv.widthOfTextAtSize(dateLabel, 9),
    y: PAGE_H - 36,
    size: 9,
    font: helv,
    color: MUTE,
  });
  page.drawText(latin(`Notice date ${notice.noticeDate}`), {
    x: R - helv.widthOfTextAtSize(`Notice date ${notice.noticeDate}`, 8),
    y: PAGE_H - 50,
    size: 8,
    font: helv,
    color: MUTE,
  });

  ctx.y = PAGE_H - 104;
  page.drawText("To the tenant named below", {
    x: L,
    y: ctx.y,
    size: 16,
    font: timesBold,
    color: NAVY,
  });
  ctx.y -= 22;

  kv(ctx, "Landlord", notice.landlordName);
  kv(ctx, "Landlord address", notice.landlordAddress);
  kv(ctx, "Tenant", notice.tenantName);
  kv(ctx, "Premises", unit);
  kv(ctx, "Occupancy began", formatLongDate(notice.occupancyStart));
  kv(ctx, "Current lease term", `${notice.leaseTermMonths} months`);

  ctx.y -= 4;
  page.drawLine({ start: { x: L, y: ctx.y }, end: { x: R, y: ctx.y }, thickness: 0.6, color: RULE });
  ctx.y -= 18;

  if (c.section226cRequired) {
    heading(ctx, "Notice of Rent Increase  -  N.Y. Real Property Law \u00A7226-c");
    para(
      ctx,
      `This is notice under New York Real Property Law section 226-c that the monthly rent for the housing accommodation described above will increase.`,
    );
    ctx.y -= 4;
    para(
      ctx,
      `Current monthly rent: ${money(notice.currentRent)}. New monthly rent: ${money(notice.newRent)}. Increase: ${money(c.increaseAmount)} (${pctLabel(c.increasePct)}). The increase takes effect on ${formatLongDate(notice.effectiveDate)}.`,
    );
    ctx.y -= 4;
    para(
      ctx,
      `Because the increase is ${pctLabel(c.increasePct)} (five percent or more), a statutory notice period applies. Occupancy as of the notice date is ${c.occupancyWholeYears} full year(s) (${c.occupancyNoticeDays}-day bucket). The current agreement is ${notice.leaseTermMonths} months (${c.termNoticeDays}-day bucket). The longer of those periods controls. Required notice: ${c.noticeDays} days. This notice should be served on or before ${formatLongDate(c.sendByDate)}.`,
    );
    ctx.y -= 4;
    para(
      ctx,
      `If this notice is given later than ${formatLongDate(c.sendByDate)}, the increase may not take effect until a date that preserves the full ${c.noticeDays}-day period.`,
    );
    if (c.sendByPast) {
      ctx.y -= 4;
      para(
        ctx,
        `LATE-NOTICE WARNING: The send-by date (${formatLongDate(c.sendByDate)}) is before today (${formatLongDate(c.today)}). RaiseNotice does not treat this as timely service. Earliest lawful effective date giving ${c.noticeDays} days of notice from today: ${formatLongDate(c.suggestedEffectiveDate)}.`,
        9.5,
        13,
        ctx.timesBold,
      );
    }
  } else {
    heading(ctx, "Written notice of rent increase (less than 5%)");
    para(
      ctx,
      `Dear ${notice.tenantName || "Tenant"}: This letter notifies you that the monthly rent for the premises at ${unit} will increase from ${money(notice.currentRent)} to ${money(notice.newRent)}, an increase of ${money(c.increaseAmount)} (${pctLabel(c.increasePct)}), effective ${formatLongDate(notice.effectiveDate)}.`,
    );
    ctx.y -= 4;
    para(
      ctx,
      `Because this increase is less than five percent, a statutory notice under Real Property Law section 226-c is not required. This written notice is provided as a courtesy and for your records. A Good Cause Eviction Law notice under section 231-c is still included below.`,
    );
  }

  ctx.y -= 6;
  ensure(ctx, 70);
  ctx.page.drawRectangle({
    x: L,
    y: ctx.y - 48,
    width: MAX_W,
    height: 58,
    color: FAINT,
  });
  const facts: [string, string][] = [
    ["Current rent", money(notice.currentRent)],
    ["New rent", money(notice.newRent)],
    ["Increase", `${money(c.increaseAmount)}  ${pctLabel(c.increasePct)}`],
    ["Effective", formatLongDate(notice.effectiveDate)],
  ];
  facts.forEach(([label, value], i) => {
    const x = L + 12 + i * 126;
    ctx.page.drawText(label.toUpperCase(), {
      x,
      y: ctx.y - 8,
      size: 7,
      font: helvBold,
      color: MUTE,
    });
    ctx.page.drawText(latin(value), {
      x,
      y: ctx.y - 26,
      size: 10,
      font: helvBold,
      color: NAVY,
    });
  });
  ctx.page.drawText(
    latin(
      `${c.noticeDays}-day notice  ·  send by ${formatLongDate(c.sendByDate)}  ·  ${c.section226cRequired ? "\u00A7226-c required" : "\u00A7226-c not required"}`,
    ),
    {
      x: L + 12,
      y: ctx.y - 44,
      size: 8,
      font: helv,
      color: MUTE,
    },
  );
  ctx.y -= 72;

  heading(ctx, "Good Cause Eviction Law Notice  -  N.Y. Real Property Law \u00A7231-c");
  para(
    ctx,
    "This notice is given as required by New York Real Property Law section 231-c. It tells the tenant whether the housing accommodation is subject to the Good Cause Eviction Law, and if an increase above the applicable local rent standard is proposed, the landlord's stated justification.",
  );
  ctx.y -= 6;

  ensure(ctx, 52);
  ctx.page.drawRectangle({
    x: L,
    y: ctx.y - 34,
    width: MAX_W,
    height: 42,
    color: c.gceCovered ? FAINT : rgb(247 / 255, 239 / 255, 214 / 255),
  });
  ctx.page.drawText(c.gceCovered ? "COVERED" : "NOT COVERED", {
    x: L + 12,
    y: ctx.y - 8,
    size: 8,
    font: helvBold,
    color: GOLD,
  });
  ctx.page.drawText(latin(c.gceLabel), {
    x: L + 12,
    y: ctx.y - 24,
    size: 11,
    font: timesBold,
    color: NAVY,
  });
  ctx.y -= 48;

  para(ctx, c.gceReason);
  ctx.y -= 4;
  para(
    ctx,
    `NYC local rent standard: ${NYC_RENT_STANDARD_PCT.toFixed(2)}%. Source: ${NYC_RENT_STANDARD_SOURCE}. An increase at or below that figure is presumptively lawful for a covered unit; an increase above it requires a justification under the Good Cause Eviction Law.`,
  );

  if (c.gceCovered) {
    ctx.y -= 4;
    if (c.increasePct > NYC_RENT_STANDARD_PCT) {
      para(
        ctx,
        `This proposed increase of ${pctLabel(c.increasePct)} exceeds the ${NYC_RENT_STANDARD_PCT.toFixed(2)}% local rent standard. The landlord's justification: ${notice.justification.trim() || "(none provided)"}.`,
      );
    } else {
      para(
        ctx,
        `This proposed increase of ${pctLabel(c.increasePct)} does not exceed the ${NYC_RENT_STANDARD_PCT.toFixed(2)}% local rent standard.`,
      );
    }
  }

  ctx.y -= 16;
  ensure(ctx, 70);
  ctx.page.drawLine({
    start: { x: L, y: ctx.y },
    end: { x: L + 240, y: ctx.y },
    thickness: 0.8,
    color: INK,
  });
  ctx.y -= 14;
  ctx.page.drawText(latin(notice.signatureName || "Landlord / agent"), {
    x: L,
    y: ctx.y,
    size: 11,
    font: timesBold,
    color: INK,
  });
  ctx.y -= 13;
  ctx.page.drawText("Signature (print name)", {
    x: L,
    y: ctx.y,
    size: 8,
    font: helv,
    color: MUTE,
  });
  ctx.page.drawText(latin(`Dated ${formatLongDate(notice.noticeDate)}`), {
    x: L + 260,
    y: ctx.y + 13,
    size: 10,
    font: helv,
    color: INK,
  });

  const pages = doc.getPages();
  const footer =
    "Not legal advice. RaiseNotice fills a statutory notice; it is not a law firm.";
  for (const p of pages) {
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 36, color: NAVY });
    p.drawText(latin(footer), {
      x: L,
      y: 14,
      size: 7.5,
      font: helv,
      color: rgb(0.85, 0.88, 0.92),
    });
    p.drawText("RaiseNotice", {
      x: R - helv.widthOfTextAtSize("RaiseNotice", 7.5),
      y: 14,
      size: 7.5,
      font: helvBold,
      color: GOLD,
    });
  }

  return doc.save();
}
