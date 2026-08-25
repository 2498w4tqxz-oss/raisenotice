import { computeNotice, type Computed } from "./notice";
import { GCE_KINDS, type GceKind, type Notice } from "./types";

export type FieldErrors = Partial<Record<keyof Notice | "form", string>>;

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function normalizeNotice(raw: unknown): Notice | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const kind = str(r.gceKind) as GceKind;
  if (!GCE_KINDS.includes(kind)) return null;
  return {
    landlordName: str(r.landlordName),
    landlordAddress: str(r.landlordAddress),
    tenantName: str(r.tenantName),
    unitStreet: str(r.unitStreet),
    unitApt: str(r.unitApt),
    unitCity: str(r.unitCity),
    unitState: "NY",
    unitZip: str(r.unitZip),
    occupancyStart: str(r.occupancyStart),
    leaseTermMonths: Math.round(num(r.leaseTermMonths)),
    currentRent: num(r.currentRent),
    newRent: num(r.newRent),
    effectiveDate: str(r.effectiveDate),
    gceKind: kind,
    gceOtherReason: str(r.gceOtherReason),
    justification: str(r.justification),
    signatureName: str(r.signatureName),
    noticeDate: str(r.noticeDate),
  };
}

export function validateNotice(
  n: Notice,
  computed?: Computed,
): { ok: boolean; errors: FieldErrors; computed: Computed } {
  const c = computed ?? computeNotice(n);
  const errors: FieldErrors = {};
  if (!n.landlordName.trim()) errors.landlordName = "Landlord name is required.";
  if (!n.landlordAddress.trim()) {
    errors.landlordAddress = "Landlord mailing address is required.";
  }
  if (!n.tenantName.trim()) errors.tenantName = "Tenant name is required.";
  if (!n.unitStreet.trim()) errors.unitStreet = "Street address is required.";
  if (!n.unitCity.trim()) errors.unitCity = "City is required.";
  if (!n.unitZip.trim()) errors.unitZip = "ZIP is required.";
  if (!n.occupancyStart) {
    errors.occupancyStart = "Occupancy start date is required.";
  }
  if (!n.effectiveDate) {
    errors.effectiveDate = "Proposed effective date is required.";
  }
  if (!n.noticeDate) errors.noticeDate = "Notice date is required.";
  if (!n.leaseTermMonths || n.leaseTermMonths < 1) {
    errors.leaseTermMonths = "Current lease term is required.";
  }
  if (!n.currentRent || n.currentRent <= 0) {
    errors.currentRent = "Current rent must be greater than $0.";
  }
  if (!n.newRent || n.newRent <= 0) {
    errors.newRent = "New rent must be greater than $0.";
  }
  if (n.gceKind === "exempt_other" && !n.gceOtherReason.trim()) {
    errors.gceOtherReason = "Describe the exemption.";
  }
  if (c.justificationRequired && !n.justification.trim()) {
    errors.justification =
      "Justification is required when the unit is covered and the increase exceeds the 8.38% NYC local rent standard.";
  }
  if (!n.signatureName.trim()) {
    errors.signatureName = "Signature name is required.";
  }
  return { ok: Object.keys(errors).length === 0, errors, computed: c };
}
