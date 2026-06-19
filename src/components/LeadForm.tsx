/**
 * Reusable lead form with explicit DPDP consent and an OTP gate.
 *
 * Used on the home, listing, college, course and exam pages (compliance item 2:
 * always category-level guidance, never "apply to college X"). Consent is a
 * single, unbundled, NOT pre-ticked checkbox (compliance item 3); the form
 * cannot be submitted until consent is given AND the mobile number is verified
 * by one time password. source_page and UTM parameters are captured
 * automatically and a hidden honeypot plus a client side rate guard deter spam.
 */
import { Show, createSignal, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { A } from "@solidjs/router";
import { requestOtpAction, verifyOtpAction, submitLeadAction } from "~/lib/actions";
import { CONSENT_TEXT, CONSENT_TEXT_VERSION, USE_MOCK } from "~/lib/config";
import { track } from "~/lib/analytics";
import type { LeadPayload } from "~/lib/types";
import { Button } from "./ui";

export interface LeadFormProps {
  /** Path the lead originated from, sent as source_page. */
  sourcePage: string;
  /** Pre-fill the course/stream of interest field. */
  courseInterest?: string;
  /** Pre-fill the city field. */
  defaultCity?: string;
  /** Heading shown above the form. */
  heading?: string;
  /** Hide the built-in heading and subtext (when the parent supplies its own). */
  hideHeading?: boolean;
  /** Called after a successful submission. */
  onSuccess?: () => void;
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
];

const QUALIFICATIONS = [
  "Class 12",
  "Diploma",
  "Graduate",
  "Postgraduate",
  "Other",
];

const INTAKE_YEARS = ["2026", "2027", "2028"];

/** Capture UTM params from the URL, persisted in sessionStorage across navigation. */
function captureUtm(): Record<string, string> {
  if (isServer) return {};
  let stored: Record<string, string> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem("acl_utm") || "{}");
  } catch {
    stored = {};
  }
  const url = new URLSearchParams(window.location.search);
  const out = { ...stored };
  for (const k of UTM_KEYS) {
    const v = url.get(k);
    if (v) out[k] = v;
  }
  try {
    sessionStorage.setItem("acl_utm", JSON.stringify(out));
  } catch {
    /* sessionStorage may be unavailable; non-fatal */
  }
  return out;
}

const MIN_SUBMIT_GAP_MS = 20_000;

export default function LeadForm(props: LeadFormProps) {
  const [name, setName] = createSignal("");
  const [mobile, setMobile] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [city, setCity] = createSignal(props.defaultCity ?? "");
  const [courseInterest, setCourseInterest] = createSignal(props.courseInterest ?? "");
  const [qualification, setQualification] = createSignal("");
  const [intakeYear, setIntakeYear] = createSignal("");
  const [consent, setConsent] = createSignal(false);
  const [hpField, setHpField] = createSignal(""); // honeypot, must stay empty

  const [otpRequested, setOtpRequested] = createSignal(false);
  const [requestId, setRequestId] = createSignal("");
  const [otp, setOtp] = createSignal("");
  const [otpVerified, setOtpVerified] = createSignal(false);

  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  let utm: Record<string, string> = {};
  onMount(() => {
    utm = captureUtm();
  });

  const mobileValid = () => /^[6-9]\d{9}$/.test(mobile());
  const requiredFilled = () =>
    name().trim().length >= 2 && mobileValid() && city().trim().length >= 2;
  const canSubmit = () => requiredFilled() && consent() && otpVerified() && !busy();

  async function onSendOtp() {
    setError("");
    if (!mobileValid()) {
      setError("Enter a valid 10 digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const r = await requestOtpAction(mobile());
      setRequestId(r.request_id);
      setOtpRequested(true);
      track("lead_otp_request", { source_page: props.sourcePage });
    } catch {
      setError("Could not send the OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp() {
    setError("");
    if (otp().trim().length < 4) {
      setError("Enter the OTP sent to your mobile.");
      return;
    }
    setBusy(true);
    try {
      const r = await verifyOtpAction(requestId(), otp().trim());
      if (r.verified) {
        setOtpVerified(true);
        setRequestId(r.token); // carry the verified token forward as otp_token
        track("lead_otp_verified", { source_page: props.sourcePage });
      } else {
        setError("That OTP did not match. Please check and try again.");
      }
    } catch {
      setError("Could not verify the OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError("");

    // Honeypot: a bot filled the hidden field. Pretend success, persist nothing.
    if (hpField().trim() !== "") {
      setSuccess(true);
      return;
    }
    // Rate guard: block rapid repeat submissions from the same browser.
    if (!isServer) {
      const last = Number(sessionStorage.getItem("acl_lead_ts") || "0");
      if (last && Date.now() - last < MIN_SUBMIT_GAP_MS) {
        setError("You just submitted a request. Please wait a moment before trying again.");
        return;
      }
    }
    if (!consent()) {
      setError("Please tick the consent box so we know how to reach you.");
      return;
    }
    if (!otpVerified()) {
      setError("Please verify your mobile number with the OTP first.");
      return;
    }
    if (!requiredFilled()) {
      setError("Please fill your name, a valid mobile number and your city.");
      return;
    }

    const payload: LeadPayload = {
      name: name().trim(),
      mobile: mobile().trim(),
      email: email().trim(),
      city: city().trim(),
      course_interest: courseInterest().trim(),
      qualification: qualification(),
      intake_year: intakeYear(),
      source_page: props.sourcePage,
      utm,
      consent: { checked: consent(), text_version: CONSENT_TEXT_VERSION },
      otp_token: requestId(), // holds the verified token after onVerifyOtp
      hp_field: hpField(),
    };

    setBusy(true);
    try {
      await submitLeadAction(payload);
      if (!isServer) sessionStorage.setItem("acl_lead_ts", String(Date.now()));
      track("lead_submit", { source_page: props.sourcePage, course_interest: payload.course_interest });
      setSuccess(true);
      props.onSuccess?.();
    } catch {
      setError("Something went wrong submitting your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-primary-500";

  return (
    <Show
      when={!success()}
      fallback={
        <div class="text-center py-6">
          <div class="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] text-2xl">
            ✓
          </div>
          <h3 class="font-semibold text-lg">Request received</h3>
          <p class="mt-2 text-sm text-[var(--color-muted)]">
            Thank you. Our team will reach out with guidance relevant to your enquiry.
          </p>
        </div>
      }
    >
      <form onSubmit={onSubmit} novalidate>
        <Show when={!props.hideHeading}>
          <h3 class="font-semibold text-lg">
            {props.heading ?? "Get free admission guidance"}
          </h3>
          <p class="mt-1 text-sm text-[var(--color-muted)]">
            Independent guidance on courses, fees and admissions. We do not charge students.
          </p>
        </Show>

        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="block sm:col-span-2">
            <span class="block text-sm font-medium mb-1">Full name</span>
            <input
              class={inputClass}
              type="text"
              autocomplete="name"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              required
            />
          </label>

          {/* Mobile + OTP */}
          <label class="block sm:col-span-2">
            <span class="block text-sm font-medium mb-1">Mobile number</span>
            <div class="flex gap-2">
              <input
                class={inputClass}
                type="tel"
                inputmode="numeric"
                autocomplete="tel"
                placeholder="10 digit mobile"
                value={mobile()}
                onInput={(e) => {
                  setMobile(e.currentTarget.value.replace(/\D/g, "").slice(0, 10));
                  setOtpVerified(false);
                  setOtpRequested(false);
                }}
                disabled={otpVerified()}
                required
              />
              <Show when={!otpVerified()}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSendOtp}
                  disabled={!mobileValid() || busy()}
                  class="shrink-0"
                >
                  {otpRequested() ? "Resend" : "Send OTP"}
                </Button>
              </Show>
              <Show when={otpVerified()}>
                <span class="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-success)]">
                  ✓ Verified
                </span>
              </Show>
            </div>
          </label>

          <Show when={otpRequested() && !otpVerified()}>
            <label class="block sm:col-span-2">
              <span class="block text-sm font-medium mb-1">Enter OTP</span>
              <div class="flex gap-2">
                <input
                  class={inputClass}
                  type="text"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  placeholder="6 digit OTP"
                  value={otp()}
                  onInput={(e) => setOtp(e.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={onVerifyOtp}
                  disabled={otp().trim().length < 4 || busy()}
                  class="shrink-0"
                >
                  Verify
                </Button>
              </div>
              <Show when={USE_MOCK}>
                <span class="mt-1 block text-xs text-[var(--color-muted)]">
                  Preview mode: enter any 6 digit code to continue.
                </span>
              </Show>
            </label>
          </Show>

          <label class="block">
            <span class="block text-sm font-medium mb-1">Email</span>
            <input
              class={inputClass}
              type="email"
              autocomplete="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
            />
          </label>

          <label class="block">
            <span class="block text-sm font-medium mb-1">City</span>
            <input
              class={inputClass}
              type="text"
              autocomplete="address-level2"
              value={city()}
              onInput={(e) => setCity(e.currentTarget.value)}
              required
            />
          </label>

          <label class="block">
            <span class="block text-sm font-medium mb-1">Course or stream of interest</span>
            <input
              class={inputClass}
              type="text"
              value={courseInterest()}
              onInput={(e) => setCourseInterest(e.currentTarget.value)}
            />
          </label>

          <label class="block">
            <span class="block text-sm font-medium mb-1">Current qualification</span>
            <select
              class={inputClass}
              value={qualification()}
              onChange={(e) => setQualification(e.currentTarget.value)}
            >
              <option value="">Select</option>
              {QUALIFICATIONS.map((q) => (
                <option value={q}>{q}</option>
              ))}
            </select>
          </label>

          <label class="block sm:col-span-2">
            <span class="block text-sm font-medium mb-1">Intended intake year</span>
            <select
              class={inputClass}
              value={intakeYear()}
              onChange={(e) => setIntakeYear(e.currentTarget.value)}
            >
              <option value="">Select</option>
              {INTAKE_YEARS.map((y) => (
                <option value={y}>{y}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Honeypot: hidden from people, tempting to bots. Must stay empty. */}
        <div class="absolute -left-[9999px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
          <label>
            Company
            <input
              type="text"
              tabindex="-1"
              autocomplete="off"
              name="company"
              value={hpField()}
              onInput={(e) => setHpField(e.currentTarget.value)}
            />
          </label>
        </div>

        {/* Consent: unbundled, not pre-ticked (compliance item 3) */}
        <label class="mt-4 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            class="mt-1 shrink-0"
            checked={consent()}
            onChange={(e) => setConsent(e.currentTarget.checked)}
          />
          <span class="text-[var(--color-ink)]/90">
            {CONSENT_TEXT}{" "}
            <A href="/privacy-policy" class="text-primary-700 hover:underline">
              Read the Privacy Policy
            </A>
            .
          </span>
        </label>

        <Show when={error()}>
          <p class="mt-3 text-sm text-[var(--color-danger)]" role="alert">
            {error()}
          </p>
        </Show>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          class="mt-4 w-full"
          disabled={!canSubmit()}
        >
          {busy() ? "Please wait..." : "Submit request"}
        </Button>

        <p class="mt-2 text-xs text-[var(--color-muted)]">
          Verify your mobile and tick consent to submit.
        </p>
      </form>
    </Show>
  );
}
