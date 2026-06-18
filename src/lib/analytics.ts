import { isServer } from "solid-js/web";

/** Fire a GA4 event when analytics is loaded. No-op on the server or when disabled. */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (isServer) return;
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof g === "function") g("event", event, params);
}
