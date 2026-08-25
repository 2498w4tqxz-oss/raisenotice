export const GCE_KINDS = [
  "covered",
  "exempt_small_landlord",
  "exempt_owner_occupied",
  "exempt_other",
] as const;

export type GceKind = (typeof GCE_KINDS)[number];

export type Notice = {
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  unitStreet: string;
  unitApt: string;
  unitCity: string;
  unitState: "NY";
  unitZip: string;
  occupancyStart: string;
  leaseTermMonths: number;
  currentRent: number;
  newRent: number;
  effectiveDate: string;
  gceKind: GceKind;
  gceOtherReason: string;
  justification: string;
  signatureName: string;
  noticeDate: string;
};

export type TokenPayload = {
  n: Notice;
  paid: boolean;
  iat: number;
  paidAt?: number;
};

export const NYC_RENT_STANDARD_PCT = 8.38;
export const NYC_RENT_STANDARD_SOURCE =
  "DHCR notice dated May 4, 2026 (CPI 3.38% + 5%)";
export const PRICE_CENTS = 1900;
export const PRICE_LABEL = "$19";
