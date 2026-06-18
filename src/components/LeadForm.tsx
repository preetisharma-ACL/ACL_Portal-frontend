/**
 * Reusable lead form. Phase 2 ships this stub so triggers render everywhere;
 * Phase 6 implements the full consent + OTP flow against the /leads endpoints.
 */
export interface LeadFormProps {
  /** Path the lead originated from, sent as source_page. */
  sourcePage: string;
  /** Pre-fill the course/stream of interest field. */
  courseInterest?: string;
  /** Pre-fill the city field. */
  defaultCity?: string;
  /** Heading shown above the form. */
  heading?: string;
  /** Called after a successful submission. */
  onSuccess?: () => void;
}

export default function LeadForm(props: LeadFormProps) {
  return (
    <div>
      <h3 class="font-semibold text-lg">
        {props.heading ?? "Get free admission guidance"}
      </h3>
      <p class="mt-2 text-sm text-[var(--color-muted)]">
        The full guidance form with verification arrives in the next build step. It will
        collect your details with explicit consent and a one time password on your mobile.
      </p>
    </div>
  );
}
