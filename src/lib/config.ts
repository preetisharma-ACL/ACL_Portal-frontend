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

/**
 * Whether the site is kept out of search indexes (site-wide noindex meta and a
 * robots.txt Disallow: /). Decoupled from USE_MOCK so the site can run on real
 * data while staying unindexed until public launch is explicitly approved.
 * Defaults to true when unset; only an explicit VITE_NOINDEX=false opts in to
 * being indexable.
 */
export const NOINDEX = String(env.VITE_NOINDEX ?? "true").toLowerCase() !== "false";

// GA4 measurement ID. Defaults to the live property; an env override wins.
// Tracking is independent of indexing — NOINDEX can stay on while GA records.
export const GA4_ID = env.VITE_GA4_ID || "G-HDHF5C0ZKF";

// Google Ads (gtag.js) conversion ID. Loaded alongside GA4 through the same
// gtag library; used for conversion tracking. An env override wins.
export const GOOGLE_ADS_ID = env.VITE_GOOGLE_ADS_ID || "AW-16454201362";

/** Operator disclosure shown in the footer and About page (compliance item 5). */
export const OPERATOR_DISCLOSURE =
  "This is an independent education discovery platform operated by AAJneeti Connect Ltd. We are not affiliated with the institutions listed unless explicitly stated.";

/** Verbatim compliance disclaimer required in the site-wide footer (Google Ads). */
export const COMPLIANCE_DISCLAIMER =
  "ACL Education is an independent education information and counselling platform operated by AAJneeti Connect Ltd. We are not affiliated with or the official admissions channel for any college or university listed. Information is compiled from public sources and does not guarantee admission.";

/** Current version of the consent text. Sent with every lead submission.
 *  Bump this whenever CONSENT_TEXT changes so records match what was shown. */
export const CONSENT_TEXT_VERSION = "2026-06-v3";

export const CONSENT_TEXT =
  "By submitting this form, I confirm that I am 18 years or older (or have my parent's or guardian's consent), and I agree to the Privacy Policy and Terms & Conditions. I consent to be contacted by ACL Education and its partner institutions by call, WhatsApp, SMS, and email regarding my enquiry, even if I am registered under DND.";
