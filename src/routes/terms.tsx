import Seo from "~/components/Seo";
import { Section } from "~/components/ui";

export default function Terms() {
  return (
    <>
      <Seo
        title="Terms and Conditions"
        description="The terms that govern your use of this platform."
        canonical="/terms"
      />
      <Section>
        <h1 class="text-3xl font-bold mb-4">Terms and Conditions</h1>
        <p class="max-w-3xl text-[var(--color-muted)]">Full terms are finalised in Phase 7.</p>
      </Section>
    </>
  );
}
