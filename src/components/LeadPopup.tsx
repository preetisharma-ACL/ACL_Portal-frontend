import { createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { useLocation } from "@solidjs/router";
import Modal from "./Modal";
import LeadForm from "./LeadForm";
import { track } from "~/lib/analytics";

/**
 * Site-wide lead-capture popup.
 *
 * Timing: appears once, 5s after the first page load of the session. It does
 * NOT auto re-open after being dismissed. It is suppressed for the rest of the
 * session once it has been shown once, or once a lead has been submitted.
 *
 * "Submitted this session" is read from the `acl_lead_ts` sessionStorage key,
 * which LeadForm sets on every successful submit — so submitting ANY form on the
 * site (which all route through LeadForm) also suppresses this popup. On submit
 * the form redirects to /thank-you (the Google Ads conversion page).
 */
const FIRST_DELAY_MS = 5_000;
const SHOWN_KEY = "acl_popup_shown";

export default function LeadPopup() {
  const location = useLocation();
  const [open, setOpen] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** A lead was already submitted in this session → never show the popup. */
  function submittedThisSession(): boolean {
    try {
      return !!sessionStorage.getItem("acl_lead_ts");
    } catch {
      return false;
    }
  }

  /** The popup has already been shown once this session. */
  function alreadyShown(): boolean {
    try {
      return !!sessionStorage.getItem(SHOWN_KEY);
    } catch {
      return false;
    }
  }

  function markShown() {
    try {
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
    // Show only once: skip if already shown, already submitted, or on /thank-you.
    if (alreadyShown() || submittedThisSession() || location.pathname === "/thank-you") return;
    // Don't stack over another open dialog — retry shortly without consuming the
    // single show.
    if (anotherModalOpen()) {
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
    timer = setTimeout(tryOpen, FIRST_DELAY_MS);
  });

  onCleanup(clear);

  return (
    <Modal open={open()} onClose={handleClose} title="Get free admission guidance" hideHeader>
      <div class="bg-gradient-to-b from-primary-50 via-primary-50/40 to-[var(--color-surface)] px-5 pt-5 pb-3 text-center sm:px-6">
        <img src="/acl-logo.png" alt="ACL Education" class="mx-auto h-9 w-auto" />
        <h2 class="mt-3 text-xl font-extrabold leading-tight tracking-tight text-[var(--color-ink)]">
          Get free admission guidance
        </h2>
        <p class="mt-1 text-sm text-[var(--color-muted)]">
          Courses, fees, cutoffs and admissions, in one place
        </p>
        <p class="mt-3 text-[15px] font-bold text-primary-600">Free for students. No spam, ever.</p>
      </div>
      <div class="px-5 py-5 sm:px-6">
        <LeadForm
          sourcePage={`${location.pathname}#popup`}
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
