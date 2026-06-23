import { createSignal } from "solid-js";
import type { TrackingStatus } from "./types";

/** Global login-modal state. Components call openLogin() (optionally with a
 *  callback to run after a successful login, e.g. completing a pending save). */
const [loginOpen, setLoginOpen] = createSignal(false);
let pending: (() => void) | null = null;

export { loginOpen };

export function openLogin(onSuccess?: () => void) {
  pending = onSuccess ?? null;
  setLoginOpen(true);
}

export function closeLogin() {
  setLoginOpen(false);
  pending = null;
}

/** Called by the modal after a successful login to run any queued action. */
export function runPendingAfterLogin() {
  const p = pending;
  pending = null;
  if (p) p();
}

export const TRACKING_STATUSES: TrackingStatus[] = [
  "INTERESTED",
  "INQUIRED",
  "APPLIED",
  "ADMITTED",
];

export const TRACKING_LABELS: Record<TrackingStatus, string> = {
  INTERESTED: "Interested",
  INQUIRED: "Inquired",
  APPLIED: "Applied",
  ADMITTED: "Admitted",
  NOT_INTERESTED: "Not interested",
};
