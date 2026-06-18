import Seo from "~/components/Seo";
import { Section, LinkButton } from "~/components/ui";
import { SITE_NAME } from "~/lib/config";
import { organizationLd, websiteLd } from "~/lib/jsonld";

export default function Home() {
  return (
    <>
      <Seo
        title={`${SITE_NAME}: Compare Colleges, Courses and Exams`}
        description="Independent discovery platform to compare colleges, courses and entrance exams across India with clear fees, approvals and placement information."
        canonical="/"
        jsonLd={[organizationLd(), websiteLd()]}
      />
      <Section>
        <div class="text-center max-w-2xl mx-auto py-10">
          <h1 class="text-3xl md:text-5xl font-extrabold">{SITE_NAME}</h1>
          <p class="mt-4 text-lg text-[var(--color-muted)]">
            Compare colleges, courses and exams with clear, comparable information.
          </p>
          <div class="mt-8 flex justify-center gap-3">
            <LinkButton href="/mba" variant="primary" size="lg">
              Browse MBA
            </LinkButton>
            <LinkButton href="/search" variant="outline" size="lg">
              Search
            </LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}
