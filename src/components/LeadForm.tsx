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
import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { A } from "@solidjs/router";
import { submitLeadAction } from "~/lib/actions";
import { citiesQuery, coursesQuery } from "~/lib/queries";
import { CONSENT_TEXT, CONSENT_TEXT_VERSION } from "~/lib/config";
import { track } from "~/lib/analytics";
import type { CityLite, LeadPayload } from "~/lib/types";
import { Button } from "./ui";

export interface LeadFormProps {
  /** Path the lead originated from, sent as source_page. */
  sourcePage: string;
  /** Display label of the course/stream of interest (shown for context). */
  courseInterest?: string;
  /** Backend course slug to submit as course_interest (must be a real course slug). */
  courseSlug?: string;
  /** Pre-fill the city field by display name (matched to a city slug). */
  defaultCity?: string;
  /** Explicit city slug to pre-select (preferred over defaultCity). */
  citySlug?: string;
  /** Heading shown above the form. */
  heading?: string;
  /** Hide the built-in heading and subtext (when the parent supplies its own). */
  hideHeading?: boolean;
  /** Submit button colour. Defaults to "accent"; use "primary" where accent is unset. */
  submitVariant?: "primary" | "accent";
  /** Tighter spacing for use inside compact dialogs. */
  dense?: boolean;
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
  // City is submitted as a backend city SLUG (not a display name).
  const [city, setCity] = createSignal(props.citySlug ?? "");
  // Course of interest is submitted as a backend course SLUG.
  const [course, setCourse] = createSignal(props.courseSlug ?? "");
  const [qualification, setQualification] = createSignal("");
  const [intakeYear, setIntakeYear] = createSignal("");
  const [consent, setConsent] = createSignal(false);
  const [hpField, setHpField] = createSignal(""); // honeypot, must stay empty

  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  // City/course options are loaded into plain signals (NOT createAsync) so the
  // form renders immediately and never suspends — the dropdowns just populate
  // when the data arrives. This avoids the whole-form "Loading…" in the popup.
  const [cities, setCitiesData] = createSignal<CityLite[]>([]);
  const [courses, setCoursesData] = createSignal<{ name: string; slug: string }[]>([]);

  // If only a display name was given, resolve it to a slug once cities load.
  createEffect(() => {
    if (city() || !props.defaultCity) return;
    const match = cities().find(
      (c) => c.name.toLowerCase() === props.defaultCity!.toLowerCase(),
    );
    if (match) setCity(match.slug);
  });
  // Best-effort: resolve a course display label to a slug once courses load.
  createEffect(() => {
    if (course() || !props.courseInterest) return;
    const label = props.courseInterest.toLowerCase();
    const match = courses().find((c) => c.name.toLowerCase() === label);
    if (match) setCourse(match.slug);
  });

  let utm: Record<string, string> = {};
  onMount(() => {
    utm = captureUtm();
    // Fetch dropdown options on the client (cached/prefetched, usually instant).
    void citiesQuery()
      .then((c) => setCitiesData(c ?? []))
      .catch(() => {});
    void coursesQuery()
      .then((c) => setCoursesData(c ?? []))
      .catch(() => {});
  });

  const mobileValid = () => /^[6-9]\d{9}$/.test(mobile());
  // City is optional on the backend, so it does not gate submission.
  const requiredFilled = () => name().trim().length >= 2 && mobileValid();
  // No OTP step: the backend accepts leads without one (LEAD_OTP_REQUIRED=false).
  // Submission is gated on the required fields + the mandatory consent checkbox.
  const canSubmit = () => requiredFilled() && consent() && !busy();

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError("");

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
    if (!requiredFilled()) {
      setError("Please fill your name and a valid 10 digit mobile number.");
      return;
    }

    // Only ever send a city slug the backend actually knows; otherwise empty
    // (which the backend accepts). Guards stale/mismatched prefilled slugs.
    const known = cities() ?? [];
    const safeCity = known.some((c) => c.slug === city()) ? city() : "";

    // Same guard for the course: send the selected slug only if it is a known
    // backend course (from the dropdown options or the trusted courseSlug prop),
    // otherwise empty. Prevents an "Unknown course." 400.
    const courseSlugs = new Set((courses() ?? []).map((c) => c.slug));
    if (props.courseSlug) courseSlugs.add(props.courseSlug);
    const safeCourse = courseSlugs.has(course()) ? course() : "";

    const payload: LeadPayload = {
      name: name().trim(),
      mobile: mobile().trim(),
      email: email().trim(),
      city: safeCity, // verified backend city slug, or empty
      course_interest: safeCourse, // verified backend course slug, or empty
      qualification: qualification(),
      // Integer when chosen; omitted when blank (backend rejects "" and null).
      ...(intakeYear() ? { intake_year: Number(intakeYear()) } : {}),
      source_page: props.sourcePage,
      utm,
      consent: { checked: consent(), text_version: CONSENT_TEXT_VERSION },
      hp_field: hpField(), // honeypot dropped server-side, never short-circuits here
    };

    setBusy(true);
    try {
      // Success is shown ONLY when the lead is created (a real response, not the
      // honeypot "rejected" sentinel) — never off the back of a swallowed error.
      const res = (await submitLeadAction(payload)) as { status?: string } | null;
      if (res && res.status !== "rejected") {
        if (!isServer) sessionStorage.setItem("acl_lead_ts", String(Date.now()));
        track("lead_submit", {
          source_page: props.sourcePage,
          course_interest: payload.course_interest,
        });
        setSuccess(true);
        props.onSuccess?.();
      } else {
        setError("We could not submit your request. Please try again.");
      }
    } catch (err) {
      console.error("Lead submit failed", err);
      setError("Something went wrong submitting your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = `w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 ${
    props.dense ? "py-2" : "py-2.5"
  } text-sm outline-none focus:border-primary-500`;

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
        <div class={`mt-4 grid sm:grid-cols-2 ${props.dense ? "gap-2.5" : "gap-3"}`}>
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

          {/* Mobile (no OTP step; backend accepts leads without verification) */}
          <label class="block sm:col-span-2">
            <span class="block text-sm font-medium mb-1">Mobile number</span>
            <input
              class={inputClass}
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              placeholder="10 digit mobile"
              value={mobile()}
              onInput={(e) => setMobile(e.currentTarget.value.replace(/\D/g, "").slice(0, 10))}
              required
            />
          </label>

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
            <select
              class={inputClass}
              value={city()}
              onChange={(e) => setCity(e.currentTarget.value)}
            >
              <option value="">Select city</option>
              <For each={cities() ?? []}>
                {(c) => <option value={c.slug}>{c.name}</option>}
              </For>
            </select>
          </label>

          <label class="block">
            <span class="block text-sm font-medium mb-1">Course of interest</span>
            <select
              class={inputClass}
              value={course()}
              onChange={(e) => setCourse(e.currentTarget.value)}
            >
              <option value="">Select course</option>
              <For each={courses() ?? []}>
                {(c) => <option value={c.slug}>{c.name}</option>}
              </For>
            </select>
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

        {/* Honeypot: hidden from people and from browser autofill (no common
            field name or label), tempting only to naive bots. Must stay empty. */}
        <div class="absolute -left-[9999px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
          <input
            type="text"
            tabindex="-1"
            autocomplete="off"
            name="acl_hp"
            aria-hidden="true"
            value={hpField()}
            onInput={(e) => setHpField(e.currentTarget.value)}
          />
        </div>

        {/* Consent: unbundled, not pre-ticked (compliance item 3) */}
        <label class={`flex items-start gap-3 text-sm ${props.dense ? "mt-3" : "mt-4"}`}>
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
          variant={props.submitVariant ?? "accent"}
          size={props.dense ? "md" : "lg"}
          class={`w-full ${props.dense ? "mt-3" : "mt-4"}`}
          disabled={!canSubmit()}
        >
          {busy() ? "Please wait..." : "Submit request"}
        </Button>

        <p class="mt-2 text-xs text-[var(--color-muted)]">
          Tick consent to submit.
        </p>
      </form>
    </Show>
  );
}
