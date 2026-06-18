/**
 * Server actions for the lead flow. Each runs on the server ("use server") so
 * the API base, and any future secrets or server-side validation, stay off the
 * client and lead traffic does not hit the backend cross-origin from the browser.
 */
import * as api from "./api";
import type { LeadPayload } from "./types";

export async function requestOtpAction(mobile: string) {
  "use server";
  return api.requestOtp(mobile);
}

export async function verifyOtpAction(requestId: string, otp: string) {
  "use server";
  return api.verifyOtp(requestId, otp);
}

export async function submitLeadAction(payload: LeadPayload) {
  "use server";
  // Drop honeypot hits server-side too: report success without persisting.
  if (payload.hp_field && payload.hp_field.trim() !== "") {
    return { id: 0, status: "received" };
  }
  return api.submitLead(payload);
}
