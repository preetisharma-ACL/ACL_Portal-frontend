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
  props: LeadFormProps & { label?: string; variant?: Variant; size?: "sm" | "md" | "lg"; class?: string },
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
      <Modal open={open()} onClose={() => setOpen(false)} title={props.heading ?? "Get free admission guidance"}>
        <LeadForm {...props} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
