import Seo from "~/components/Seo";
import { Section } from "~/components/ui";

export default function Disclosure() {
  return (
    <>
      <Seo
        title="Disclosure"
        description="Independent platform disclosure and our relationship with listed institutions."
        canonical="/disclosure"
      />
      <Section>
        <h1 class="text-3xl font-bold mb-4">Disclosure</h1>
        <p class="max-w-3xl text-[var(--color-muted)]">Full disclosure statement is finalised in Phase 7.</p>
      </Section>
    </>
  );
}
