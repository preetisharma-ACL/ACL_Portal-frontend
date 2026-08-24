import { createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { useLocation } from "@solidjs/router";
import Modal from "./Modal";
import LeadForm from "./LeadForm";
import { track } from "~/lib/analytics";

/**
 * Auto-opening lead-capture popup.
 *
 * Timing: appears once, 5s after mount. It does NOT auto re-open after being
 * dismissed. It is suppressed for the rest of the session once it has been
 * shown once, or once a lead has been submitted.
 *
 * "Submitted this session" is read from the `acl_lead_ts` sessionStorage key,
 * which LeadForm sets on every successful submit — so submitting ANY form on the
 * site (which all route through LeadForm) also suppresses this popup. On submit
 * the form redirects to /thank-you (the Google Ads conversion page).
 *
 * Mounted site-wide from app.tsx with no props. Pages that want a popup carrying
 * their own context (the college detail page) render a second instance with
 * their heading/course/city and their own `shownKey`, and the site-wide instance
 * skips those paths so only one popup can fire on a page.
 */
const FIRST_DELAY_MS = 5_000;
/** Set whenever ANY popup fires, so the site-wide one shows at most once. */
const SHOWN_KEY = "acl_popup_shown";
const DEFAULT_SKIP_PATHS = ["/thank-you"];

export interface LeadPopupProps {
  /**
   * sessionStorage key recording that THIS popup already fired. Defaults to the
   * site-wide key; pass a page-scoped key so a contextual popup can still show
   * to someone who already saw the generic one earlier in the session.
   */
  shownKey?: string;
  /** Delay from mount before the first open attempt. Defaults to 5s. */
  delayMs?: number;
  /** Path prefixes this popup never opens on. */
  skipPaths?: string[];
  /** Header copy. */
  heading?: string;
  subtitle?: string;
  /** Passed through to LeadForm. */
  sourcePage?: string;
  courseInterest?: string;
  courseOptions?: { name: string; slug: string }[];
  defaultCity?: string;
  hideQualification?: boolean;
  hideIntakeYear?: boolean;
}

export default function LeadPopup(props: LeadPopupProps = {}) {
  const location = useLocation();
  const [open, setOpen] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const shownKey = () => props.shownKey ?? SHOWN_KEY;
  const skipPaths = () => props.skipPaths ?? DEFAULT_SKIP_PATHS;

  function readKey(key: string): boolean {
    try {
      return !!sessionStorage.getItem(key);
    } catch {
      return false;
    }
  }

  /** A lead was already submitted in this session → never show the popup. */
  function submittedThisSession(): boolean {
    return readKey("acl_lead_ts");
  }

  /** This popup has already been shown once this session. */
  function alreadyShown(): boolean {
    return readKey(shownKey());
  }

  function markShown() {
    try {
      sessionStorage.setItem(shownKey(), "1");
      // Any popup firing also spends the site-wide slot, so a contextual popup
      // and the generic one never both appear in one session.
      sessionStorage.setItem(SHOWN_KEY, "1");
    } catch {
      /* sessionStorage may be unavailable; non-fatal */
    }
  }

  /** Another dialog (login / brochure / lead modal) is currently open. */
  function anotherModalOpen(): boolean {
    return !open() && document.body.style.overflow === "hidden";
  }

  function clear() {
    if (timer) clearTimeout(timer);
    timer = undefined;
  }

  function tryOpen() {
    // Show only once: skip if already shown or already submitted.
    if (alreadyShown() || submittedThisSession()) return;
    // On a skipped path, or stacked over another open dialog, retry shortly
    // without consuming the single show.
    if (skipPaths().some((p) => location.pathname.startsWith(p)) || anotherModalOpen()) {
      timer = setTimeout(tryOpen, 2_000);
      return;
    }
    markShown();
    track("popup_view", { source_page: location.pathname });
    setOpen(true);
  }

  // Dismissed → just close. It does not re-open.
  function handleClose() {
    setOpen(false);
  }

  onMount(() => {
    if (isServer) return;
    if (alreadyShown() || submittedThisSession()) return;
    timer = setTimeout(tryOpen, props.delayMs ?? FIRST_DELAY_MS);
  });

  onCleanup(clear);

  const heading = () => props.heading ?? "Get free admission guidance";
  const subtitle = () =>
    props.subtitle ?? "Courses, fees, cutoffs and admissions, in one place";

  return (
    <Modal open={open()} onClose={handleClose} title={heading()} hideHeader>
      <div class="bg-gradient-to-b from-primary-50 via-primary-50/40 to-[var(--color-surface)] px-5 pt-5 pb-3 text-center sm:px-6">
        <img src="/acl-logo.png" alt="ACL Education" class="mx-auto h-9 w-auto" />
        <h2 class="mt-3 text-xl font-extrabold leading-tight tracking-tight text-[var(--color-ink)]">
          {heading()}
        </h2>
        <p class="mt-1 text-sm text-[var(--color-muted)]">{subtitle()}</p>
        <p class="mt-3 text-[15px] font-bold text-primary-600">Free for students. No spam, ever.</p>
      </div>
      <div class="px-5 py-5 sm:px-6">
        <LeadForm
          sourcePage={props.sourcePage ?? `${location.pathname}#popup`}
          courseInterest={props.courseInterest}
          courseOptions={props.courseOptions}
          defaultCity={props.defaultCity}
          hideQualification={props.hideQualification}
          hideIntakeYear={props.hideIntakeYear}
          hideHeading
          dense
          onSuccess={() => {
            // Lead captured: close. LeadForm then navigates to /thank-you.
            clear();
            setOpen(false);
          }}
        />
      </div>
    </Modal>
  );
}
