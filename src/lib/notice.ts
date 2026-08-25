import {
  NYC_RENT_STANDARD_PCT,
  type GceKind,
  type Notice,
} from "./types";

export type NoticeDays = 30 | 60 | 90;

export type Computed = {
  increaseAmount: number;
  increasePct: number;
  section226cRequired: boolean;
  noticeDays: NoticeDays;
  occupancyWholeYears: number;
  occupancyNoticeDays: NoticeDays;
  termNoticeDays: NoticeDays;
  sendByDate: string;
  sendByPast: boolean;
  suggestedEffectiveDate: string;
  gceCovered: boolean;
  gceLabel: string;
  gceReason: string;
  justificationRequired: boolean;
  today: string;
  unitLine: string;
};

export function todayYmd(timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function parseYmd(ymd: string): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

export function formatLongDate(ymd: string): string {
  const dt = parseYmd(ymd);
  if (!dt) return ymd || "—";
  return dt.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function addDays(ymd: string, days: number): string {
  const dt = parseYmd(ymd);
  if (!dt) return ymd;
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function pctLabel(n: number): string {
  return `${n.toFixed(2)}%`;
}

function bucketFromYears(years: number): NoticeDays {
  if (years < 1) return 30;
  if (years < 2) return 60;
  return 90;
}

function bucketFromMonths(months: number): NoticeDays {
  if (months < 12) return 30;
  if (months < 24) return 60;
  return 90;
}

function wholeYearsBetween(start: string, asOf: string): number {
  const a = parseYmd(start);
  const b = parseYmd(asOf);
  if (!a || !b || b.getTime() < a.getTime()) return 0;
  let years = b.getUTCFullYear() - a.getUTCFullYear();
  const anniversary = Date.UTC(
    b.getUTCFullYear(),
    a.getUTCMonth(),
    a.getUTCDate(),
  );
  if (b.getTime() < anniversary) years -= 1;
  return Math.max(0, years);
}

export function gceCopy(kind: GceKind, otherReason: string): {
  covered: boolean;
  label: string;
  reason: string;
} {
  switch (kind) {
    case "covered":
      return {
        covered: true,
        label: "Covered",
        reason:
          "This housing accommodation is covered by the Good Cause Eviction Law.",
      };
    case "exempt_small_landlord":
      return {
        covered: false,
        label: "Not covered — small landlord",
        reason:
          "The housing accommodation is not subject to the Good Cause Eviction Law because the owner is a small landlord who owns no more than ten units statewide in New York.",
      };
    case "exempt_owner_occupied":
      return {
        covered: false,
        label: "Not covered — owner lives in a ≤10 unit building",
        reason:
          "The housing accommodation is not subject to the Good Cause Eviction Law because the owner lives in a building with ten or fewer units.",
      };
    case "exempt_other":
      return {
        covered: false,
        label: "Not covered — other exemption",
        reason:
          otherReason.trim() ||
          "The housing accommodation is not subject to the Good Cause Eviction Law (other exemption).",
      };
  }
}

export function formatUnit(n: Notice): string {
  const apt = n.unitApt.trim() ? `Apt ${n.unitApt.trim()}, ` : "";
  return `${apt}${n.unitStreet.trim()}, ${n.unitCity.trim()}, ${n.unitState} ${n.unitZip.trim()}`.replace(
    /\s+/g,
    " ",
  );
}

export function computeNotice(n: Notice, today = todayYmd()): Computed {
  const current = Number(n.currentRent) || 0;
  const next = Number(n.newRent) || 0;
  const increaseAmount = next - current;
  const increasePct = current > 0 ? (increaseAmount / current) * 100 : 0;
  const occupancyAsOf = parseYmd(n.noticeDate) ? n.noticeDate : today;
  const occupancyWholeYears = wholeYearsBetween(n.occupancyStart, occupancyAsOf);
  const occupancyNoticeDays = bucketFromYears(occupancyWholeYears);
  const termNoticeDays = bucketFromMonths(Number(n.leaseTermMonths) || 0);
  const noticeDays = Math.max(occupancyNoticeDays, termNoticeDays) as NoticeDays;
  const sendByDate = n.effectiveDate ? addDays(n.effectiveDate, -noticeDays) : "";
  const sendByPast = Boolean(sendByDate && sendByDate < today);
  const suggestedEffectiveDate = addDays(today, noticeDays);
  const gce = gceCopy(n.gceKind, n.gceOtherReason);
  const justificationRequired =
    gce.covered && increasePct > NYC_RENT_STANDARD_PCT;
  return {
    increaseAmount,
    increasePct,
    section226cRequired: increasePct >= 5,
    noticeDays,
    occupancyWholeYears,
    occupancyNoticeDays,
    termNoticeDays,
    sendByDate,
    sendByPast,
    suggestedEffectiveDate,
    gceCovered: gce.covered,
    gceLabel: gce.label,
    gceReason: gce.reason,
    justificationRequired,
    today,
    unitLine: formatUnit(n),
  };
}

export function emptyNotice(today = todayYmd()): Notice {
  return {
    landlordName: "",
    landlordAddress: "",
    tenantName: "",
    unitStreet: "",
    unitApt: "",
    unitCity: "",
    unitState: "NY",
    unitZip: "",
    occupancyStart: "",
    leaseTermMonths: 12,
    currentRent: 0,
    newRent: 0,
    effectiveDate: "",
    gceKind: "exempt_small_landlord",
    gceOtherReason: "",
    justification: "",
    signatureName: "",
    noticeDate: today,
  };
}

export const DISCLAIMER =
  "This is not legal advice. RaiseNotice fills a notice from the facts you enter. New York landlord-tenant law is fact-specific. Confirm coverage, deadlines, and service rules, or consult an attorney.";

export const GCE_OPTIONS: { value: GceKind; title: string; hint: string }[] = [
  {
    value: "covered",
    title: "Covered",
    hint: "Good Cause Eviction applies to this unit.",
  },
  {
    value: "exempt_small_landlord",
    title: "Exempt — small landlord (≤10 units in NY)",
    hint: "Owner owns ten or fewer units statewide.",
  },
  {
    value: "exempt_owner_occupied",
    title: "Exempt — owner lives in a ≤10 unit building",
    hint: "Owner occupies a unit in a building of ten or fewer units.",
  },
  {
    value: "exempt_other",
    title: "Exempt — other",
    hint: "Another exemption. Short reason required.",
  },
];

export function validateNotice(n: Notice): string | null {
  if (!n.landlordName.trim()) return "Add the landlord name.";
  if (!n.landlordAddress.trim()) return "Add the landlord mailing address.";
  if (!n.tenantName.trim()) return "Add the tenant name.";
  if (!n.unitStreet.trim()) return "Add the unit street address.";
  if (!n.unitCity.trim()) return "Add the city.";
  if (!n.unitZip.trim()) return "Add the ZIP.";
  if (!n.occupancyStart || !parseYmd(n.occupancyStart)) {
    return "Add the occupancy start date.";
  }
  if (!Number(n.leaseTermMonths) || Number(n.leaseTermMonths) < 1) {
    return "Add the current lease term in months.";
  }
  if (!(Number(n.currentRent) > 0)) return "Add the current monthly rent.";
  if (!(Number(n.newRent) > 0)) return "Add the new monthly rent.";
  if (!n.effectiveDate || !parseYmd(n.effectiveDate)) {
    return "Add the proposed effective date.";
  }
  if (!n.signatureName.trim()) return "Add a signature name.";
  if (!n.noticeDate || !parseYmd(n.noticeDate)) return "Add the notice date.";
  if (n.gceKind === "exempt_other" && !n.gceOtherReason.trim()) {
    return "Add a short exemption reason.";
  }
  const c = computeNotice(n);
  if (c.justificationRequired && !n.justification.trim()) {
    return "A justification is required when the unit is covered by Good Cause Eviction and the increase exceeds the 8.38% local rent standard.";
  }
  return null;
}

export function parseNoticeBody(raw: unknown): Notice | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.landlordName !== "string") return null;
  const gce = o.gceKind ?? o.gceStatus;
  const kind =
    gce === "covered" ||
    gce === "exempt_small_landlord" ||
    gce === "exempt_owner_occupied" ||
    gce === "exempt_other"
      ? gce
      : "exempt_small_landlord";
  const n: Notice = {
    landlordName: String(o.landlordName ?? ""),
    landlordAddress: String(o.landlordAddress ?? ""),
    tenantName: String(o.tenantName ?? ""),
    unitStreet: String(o.unitStreet ?? ""),
    unitApt: String(o.unitApt ?? ""),
    unitCity: String(o.unitCity ?? ""),
    unitState: "NY",
    unitZip: String(o.unitZip ?? ""),
    occupancyStart: String(o.occupancyStart ?? ""),
    leaseTermMonths: Number(o.leaseTermMonths) || 0,
    currentRent: Number(o.currentRent) || 0,
    newRent: Number(o.newRent) || 0,
    effectiveDate: String(o.effectiveDate ?? ""),
    gceKind: kind,
    gceOtherReason: String(o.gceOtherReason ?? ""),
    justification: String(o.justification ?? ""),
    signatureName: String(o.signatureName ?? ""),
    noticeDate: String(o.noticeDate ?? ""),
  };
  return n;
}

