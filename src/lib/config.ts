/**
 * Central runtime configuration. All env-derived values funnel through here so
 * the brand, API target and analytics id each live in exactly one place.
 */

const env = import.meta.env;

export const SITE_NAME = env.VITE_SITE_NAME || "ACL Education Portal";

export const SITE_ORIGIN = (env.VITE_SITE_ORIGIN || "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const API_BASE = (env.VITE_API_BASE || "http://localhost:8000/api/v1").replace(
  /\/$/,
  "",
);

export const USE_MOCK = String(env.VITE_USE_MOCK).toLowerCase() === "true";

export const GA4_ID = env.VITE_GA4_ID || "";

/** Operator disclosure shown in the footer and About page (compliance item 5). */
export const OPERATOR_DISCLOSURE =
  "This is an independent education discovery platform operated by AAJneeti Connect Ltd. We are not affiliated with the institutions listed unless explicitly stated.";

/** Current version of the consent text. Sent with every lead submission. */
export const CONSENT_TEXT_VERSION = "2026-06-v1";

export const CONSENT_TEXT =
  "I authorise AAJneeti Connect Ltd. and the relevant listed institutions to contact me by call, SMS, WhatsApp and email about admissions and courses relevant to my enquiry. I have read the Privacy Policy.";
