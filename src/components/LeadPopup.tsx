import { createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { useLocation } from "@solidjs/router";
import Modal from "./Modal";
import LeadForm from "./LeadForm";
import { track } from "~/lib/analytics";

/**
 * Site-wide lead-capture popup.
 *
 * Timing (per the product spec):
 *  - first appearance: 5s after the page loads (first visit of the session),
 *  - thereafter: re-opens 10s after each time the visitor closes it,
 *  - the 10s cycle keeps running until the visitor submits a lead, after which
 *    it is suppressed for the rest of the browser session.
 *
 * "Submitted this session" is read from the `acl_lead_ts` sessionStorage key,
 * which LeadForm sets on every successful submit — so submitting ANY form on the
 * site (which all route through LeadForm) also suppresses this popup. On submit
 * the form redirects to /thank-you (the Google Ads conversion page).
 */
const FIRST_DELAY_MS = 5_000;
const CYCLE_DELAY_MS = 10_000;

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

  /** Another dialog (login / brochure / lead modal) is currently open. */
  function anotherModalOpen(): boolean {
    return !open() && document.body.style.overflow === "hidden";
  }

  function clear() {
    if (timer) clearTimeout(timer);
    timer = undefined;
  }

  function schedule(delay: number) {
    clear();
    timer = setTimeout(tryOpen, delay);
  }

  function tryOpen() {
    // Stop the cycle for good once a lead has been captured this session.
    if (submittedThisSession() || location.pathname === "/thank-you") return;
    // Don't stack over another open dialog — try again next cycle.
    if (anotherModalOpen()) {
      schedule(CYCLE_DELAY_MS);
      return;
    }
    track("popup_view", { source_page: location.pathname });
    setOpen(true);
  }

  // Visitor dismissed the popup → re-arm the 10s cycle.
  function handleClose() {
    setOpen(false);
    schedule(CYCLE_DELAY_MS);
  }

  onMount(() => {
    if (isServer) return;
    if (submittedThisSession()) return;
    schedule(FIRST_DELAY_MS);
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
            // Lead captured: stop the cycle and close. LeadForm then navigates
            // to /thank-you, and submittedThisSession() stays true all session.
            clear();
            setOpen(false);
          }}
        />
      </div>
    </Modal>
  );
}
