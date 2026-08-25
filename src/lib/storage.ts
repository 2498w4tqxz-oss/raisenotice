import type { Notice } from "./types";

const KEY = "raisenotice.notice.v1";

export function loadNotice(): Notice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Notice;
  } catch {
    return null;
  }
}

export function saveNotice(n: Notice): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(n));
}
