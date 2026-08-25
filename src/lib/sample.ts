import type { Notice } from "./types";
import { todayYmd } from "./notice";

export const SAMPLE_NOTICE: Notice = {
  landlordName: "Maria Chen",
  landlordAddress: "31-11 21st Avenue, Astoria, NY 11105",
  tenantName: "James Park",
  unitStreet: "24-18 31st St",
  unitApt: "2R",
  unitCity: "Astoria",
  unitState: "NY",
  unitZip: "11106",
  occupancyStart: "2023-09-01",
  leaseTermMonths: 12,
  currentRent: 2200,
  newRent: 2400,
  effectiveDate: "2026-12-01",
  gceKind: "exempt_small_landlord",
  gceOtherReason: "",
  justification: "",
  signatureName: "Maria Chen",
  noticeDate: todayYmd(),
};
