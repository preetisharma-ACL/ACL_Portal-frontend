import { createSignal } from "solid-js";
import Modal from "./Modal";
import LeadForm, { type LeadFormProps } from "./LeadForm";
import { buttonClass } from "./ui";
import { track } from "~/lib/analytics";

type Variant = "primary" | "accent" | "outline" | "ghost";

/**
 * Button that opens the shared lead form in a modal. Used for the global
 * "Get free admission guidance" capture and contextual page CTAs. The form is
 * always category-level guidance, never "apply to a specific college".
 */
export default function LeadTrigger(
  props: LeadFormProps & {
    label?: string;
    variant?: Variant;
    size?: "sm" | "md" | "lg";
    class?: string;
    /** Runs after a successful lead submit (e.g. reveal a gated brochure PDF). */
    onLeadSuccess?: () => void;
  },
) {
  const [open, setOpen] = createSignal(false);

  function show() {
    track("lead_form_view", { source_page: props.sourcePage });
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        class={buttonClass(props.variant ?? "accent", props.size ?? "md", props.class ?? "")}
        onClick={show}
      >
        {props.label ?? "Get free admission guidance"}
      </button>
      <Modal
        open={open()}
        onClose={() => setOpen(false)}
        title={props.heading ?? "Get free admission guidance"}
        hideHeader
      >
        {/* Rich header (logo + title + subtitle + tagline). The form renders with
            hideHeading so the heading is not duplicated. */}
        <div class="bg-gradient-to-b from-primary-50 via-primary-50/40 to-[var(--color-surface)] px-5 pt-5 pb-3 text-center sm:px-6">
          <img src="/acl-logo.png" alt="ACL Education" class="mx-auto h-9 w-auto" />
          <h2 class="mt-3 text-xl font-extrabold leading-tight tracking-tight text-[var(--color-ink)]">
            {props.heading ?? "Get free admission guidance"}
          </h2>
          <p class="mt-1 text-sm text-[var(--color-muted)]">
            {props.courseInterest
              ? `Independent guidance for ${props.courseInterest}`
              : "Courses, fees, cutoffs and admissions, in one place"}
          </p>
          <p class="mt-3 text-[15px] font-bold text-primary-600">
            Free for students. No spam, ever.
          </p>
        </div>
        <div class="px-5 py-5 sm:px-6">
          <LeadForm
          {...props}
          hideHeading
          onSuccess={() => {
            setOpen(false);
            props.onLeadSuccess?.();
          }}
        />
        </div>
      </Modal>
    </>
  );
}
