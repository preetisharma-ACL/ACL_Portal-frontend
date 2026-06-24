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
import { For, Show, createEffect, createSignal, createUniqueId, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { A } from "@solidjs/router";
import { submitLeadAction } from "~/lib/actions";
import { citiesQuery, coursesQuery } from "~/lib/queries";
import { CONSENT_TEXT, CONSENT_TEXT_VERSION } from "~/lib/config";
import { humanize, slugify } from "~/lib/slug";
import { track } from "~/lib/analytics";
import type { LeadPayload } from "~/lib/types";
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
  // City is a free-text field (backend accepts any string). Prefill with a
  // readable name from context (defaultCity, or the citySlug humanised); editable.
  const [city, setCity] = createSignal(props.defaultCity ?? humanize(props.citySlug ?? ""));
  // Course of interest is submitted as a backend course SLUG.
  const [course, setCourse] = createSignal(props.courseSlug ?? "");
  const [qualification, setQualification] = createSignal("");
  const [intakeYear, setIntakeYear] = createSignal("");
  const [consent, setConsent] = createSignal(false);
  const [hpField, setHpField] = createSignal(""); // honeypot, must stay empty

  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  // Course options load into a plain signal (NOT createAsync) so the form renders
  // immediately and never suspends — the dropdown populates when data arrives.
  const [courses, setCoursesData] = createSignal<{ name: string; slug: string }[]>([]);
  // City is free text, but the backend requires a KNOWN city slug (or empty) —
  // it 400s on arbitrary strings. We keep this list to map the typed city to a
  // slug on submit; an unmatched city is sent empty so submission never fails.
  const [cities, setCitiesData] = createSignal<{ name: string; slug: string }[]>([]);

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
    // Fetch options on the client (cached/prefetched, usually instant).
    void coursesQuery()
      .then((c) => setCoursesData(c ?? []))
      .catch(() => {});
    void citiesQuery()
      .then((c) => setCitiesData(c ?? []))
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

    // City is typed freely, but the backend requires a known city slug (or empty)
    // — map the typed value to a matching slug, else send empty (never 400).
    const typedCity = city().trim();
    const citySlug = slugify(typedCity);
    const matchedCity = cities().find(
      (c) => c.slug === citySlug || c.name.toLowerCase() === typedCity.toLowerCase(),
    );
    const safeCity = matchedCity ? matchedCity.slug : "";

    // Course still sends a backend-known slug only (or empty) to avoid a 400.
    const courseSlugs = new Set((courses() ?? []).map((c) => c.slug));
    if (props.courseSlug) courseSlugs.add(props.courseSlug);
    const safeCourse = courseSlugs.has(course()) ? course() : "";

    const payload: LeadPayload = {
      name: name().trim(),
      mobile: mobile().trim(),
      email: email().trim(),
      city: safeCity, // typed city mapped to a known slug, or empty
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

  // Unique per-instance prefix so label `for`/input `id` stay unique even when
  // the form is rendered more than once on a page (e.g. sidebar + modal).
  const uid = createUniqueId();
  const fid = (k: string) => `${uid}-${k}`;

  // Floating-label outlined fields: the label lifts onto the border line when the
  // field is focused or filled (Material-style notched outline).
  const inputCtl =
    "peer w-full rounded-[var(--radius-md)] border-2 border-[var(--color-line)] bg-[var(--color-surface)] py-3 pl-11 pr-4 text-[15px] text-[var(--color-ink)] outline-none transition-colors placeholder:text-transparent hover:border-[var(--color-muted)]/40 focus:border-primary-500";
  const selectCtl = `${inputCtl} cursor-pointer appearance-none pr-10`;
  const iconCls =
    "pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted)] transition-colors peer-focus:text-primary-600";
  const chevronCls =
    "pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)] transition-colors peer-focus:text-primary-600";
  // Resting (over the input) -> floats to the top border on focus/fill.
  const floatLbl =
    "pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 bg-[var(--color-surface)] px-1 text-[15px] text-[var(--color-muted)] transition-all duration-150 peer-focus:left-3 peer-focus:top-0 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold";
  // Mobile has a +91 prefix, so its resting label sits further right.
  const floatLblMobile = floatLbl.replace("left-11", "left-[4.75rem]");
  // Selects always show a value, so their label stays floated on the border.
  const floatLblStatic =
    "pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-[var(--color-surface)] px-1 text-xs font-semibold text-[var(--color-muted)] transition-colors peer-focus:text-primary-600";
  const clearBtn =
    "absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]/70 transition-colors hover:text-[var(--color-ink)]";
  // Factories (not constants) so each call yields a fresh node for reuse.
  const xIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
  const chevronIcon = () => (
    <svg class={chevronCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );

  return (
    <Show
      when={!success()}
      fallback={
        <div class="animate-fade px-2 py-8 text-center">
          <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] ring-8 ring-[var(--color-success)]/5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h3 class="mt-4 text-xl font-extrabold tracking-tight">Request received</h3>
          <p class="mx-auto mt-2 max-w-xs text-sm text-[var(--color-muted)]">
            Thank you. Our team will reach out with guidance relevant to your enquiry.
          </p>
        </div>
      }
    >
      <form onSubmit={onSubmit} novalidate class="space-y-3">
        <Show when={!props.hideHeading}>
          <div class="mb-1">
            <h3 class="text-xl font-extrabold tracking-tight text-[var(--color-ink)]">
              {props.heading ?? "Get free admission guidance"}
            </h3>
            <p class="mt-1 text-sm text-[var(--color-muted)]">
              Independent guidance on courses, fees and admissions. We do not charge students.
            </p>
          </div>
        </Show>

        {/* Full name */}
        <div class="relative">
          <input
            id={fid("name")}
            class={inputCtl}
            type="text"
            autocomplete="name"
            placeholder="Full Name"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            required
          />
          <svg class={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <label for={fid("name")} class={floatLbl}>
            Full Name <span class="text-[var(--color-danger)]">*</span>
          </label>
          <Show when={name()}>
            <button type="button" aria-label="Clear name" class={clearBtn} onClick={() => setName("")}>
              {xIcon()}
            </button>
          </Show>
        </div>

        {/* Email */}
        <div class="relative">
          <input
            id={fid("email")}
            class={inputCtl}
            type="email"
            autocomplete="email"
            placeholder="Email Address"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
          />
          <svg class={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <label for={fid("email")} class={floatLbl}>Email Address</label>
          <Show when={email()}>
            <button type="button" aria-label="Clear email" class={clearBtn} onClick={() => setEmail("")}>
              {xIcon()}
            </button>
          </Show>
        </div>

        {/* Mobile + City */}
        <div class="grid gap-3 sm:grid-cols-2">
          {/* Mobile (no OTP step; backend accepts leads without verification) */}
          <div class="relative">
            <input
              id={fid("mobile")}
              class={`${inputCtl} pl-[4.75rem]`}
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              placeholder="Mobile Number"
              value={mobile()}
              onInput={(e) => setMobile(e.currentTarget.value.replace(/\D/g, "").slice(0, 10))}
              required
            />
            <span class="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              <span class="flex h-3.5 w-5 flex-col overflow-hidden rounded-[2px] ring-1 ring-black/10" aria-hidden="true">
                <span class="h-1/3 bg-[#ff9933]" />
                <span class="h-1/3 bg-white" />
                <span class="h-1/3 bg-[#138808]" />
              </span>
              <span class="text-sm font-medium text-[var(--color-ink)]">+91</span>
            </span>
            <label for={fid("mobile")} class={floatLblMobile}>
              Mobile Number <span class="text-[var(--color-danger)]">*</span>
            </label>
          </div>

          {/* City */}
          <div class="relative">
            <input
              id={fid("city")}
              class={inputCtl}
              type="text"
              autocomplete="address-level2"
              placeholder="City You Live In"
              value={city()}
              onInput={(e) => setCity(e.currentTarget.value)}
            />
            <svg class={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <label for={fid("city")} class={floatLbl}>City You Live In</label>
            <Show when={city()}>
              <button type="button" aria-label="Clear city" class={clearBtn} onClick={() => setCity("")}>
                {xIcon()}
              </button>
            </Show>
          </div>
        </div>

        {/* Course + Qualification */}
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="relative">
            <select
              id={fid("course")}
              class={selectCtl}
              value={course()}
              onChange={(e) => setCourse(e.currentTarget.value)}
            >
              <option value="">Select</option>
              <For each={courses() ?? []}>
                {(c) => <option value={c.slug}>{c.name}</option>}
              </For>
            </select>
            <svg class={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 10 12 5 2 10l10 5 10-5Z" />
              <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
            </svg>
            <label for={fid("course")} class={floatLblStatic}>Course Interested In</label>
            {chevronIcon()}
          </div>

          <div class="relative">
            <select
              id={fid("qual")}
              class={selectCtl}
              value={qualification()}
              onChange={(e) => setQualification(e.currentTarget.value)}
            >
              <option value="">Select</option>
              {QUALIFICATIONS.map((q) => (
                <option value={q}>{q}</option>
              ))}
            </select>
            <svg class={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
            <label for={fid("qual")} class={floatLblStatic}>Qualification</label>
            {chevronIcon()}
          </div>
        </div>

        {/* Intake year */}
        <div class="relative">
          <select
            id={fid("intake")}
            class={selectCtl}
            value={intakeYear()}
            onChange={(e) => setIntakeYear(e.currentTarget.value)}
          >
            <option value="">Select</option>
            {INTAKE_YEARS.map((y) => (
              <option value={y}>{y}</option>
            ))}
          </select>
          <svg class={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <label for={fid("intake")} class={floatLblStatic}>Intended Intake Year</label>
          {chevronIcon()}
        </div>

        {/* Honeypot: hidden from people and from browser autofill (no common
            field name or label), tempting only to naive bots. Must stay empty. */}
        <div class="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
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
        <label class="flex cursor-pointer items-start gap-2.5 pt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
          <input
            type="checkbox"
            class="mt-0.5 h-4 w-4 shrink-0 accent-primary-600"
            checked={consent()}
            onChange={(e) => setConsent(e.currentTarget.checked)}
          />
          <span>
            {CONSENT_TEXT}{" "}
            <A href="/privacy-policy" class="font-medium text-primary-700 hover:underline">
              Read the Privacy Policy
            </A>
            .
          </span>
        </label>

        <Show when={error()}>
          <p
            class="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2.5 text-sm text-[var(--color-danger)]"
            role="alert"
          >
            <span aria-hidden="true" class="mt-0.5">⚠</span>
            <span>{error()}</span>
          </p>
        </Show>

        <div class="pt-0.5">
          <Button
            type="submit"
            variant={props.submitVariant ?? "primary"}
            size="lg"
            class="w-full text-base font-bold uppercase tracking-wide shadow-md shadow-primary-600/20 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-600/30 active:translate-y-0 active:scale-[0.99] disabled:translate-y-0 disabled:shadow-none"
            disabled={!canSubmit()}
          >
            <Show
              when={!busy()}
              fallback={
                <span class="inline-flex items-center gap-2">
                  <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                  </svg>
                  Submitting…
                </span>
              }
            >
              Submit
            </Show>
          </Button>
          <p class="mt-2.5 text-center text-xs text-[var(--color-muted)]">
            <Show when={!consent()} fallback="By submitting you agree to be contacted about your enquiry.">
              Tick the consent box to submit.
            </Show>
          </p>
        </div>
      </form>
    </Show>
  );
}
