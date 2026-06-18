import Seo from "~/components/Seo";
import { Section } from "~/components/ui";

export default function PrivacyPolicy() {
  return (
    <>
      <Seo
        title="Privacy Policy"
        description="How we collect, use, share and protect your personal data, aligned with India's DPDP Act."
        canonical="/privacy-policy"
      />
      <Section>
        <h1 class="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p class="max-w-3xl text-[var(--color-muted)]">Full DPDP-aligned policy is finalised in Phase 7.</p>
      </Section>
    </>
  );
}
