import Seo from "~/components/Seo";
import { Section } from "~/components/ui";
import { SITE_NAME } from "~/lib/config";

export default function About() {
  return (
    <>
      <Seo
        title={`About ${SITE_NAME}`}
        description={`About ${SITE_NAME}, an independent education discovery platform operated by AAJneeti Connect Ltd.`}
        canonical="/about"
      />
      <Section>
        <h1 class="text-3xl font-bold mb-4">About {SITE_NAME}</h1>
        <p class="max-w-3xl text-[var(--color-muted)]">
          Independent discovery for colleges, courses and exams. Full content is finalised in
          Phase 7.
        </p>
      </Section>
    </>
  );
}
