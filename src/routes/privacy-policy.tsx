import LegalPage, { LegalTodo } from "~/components/LegalPage";
import { SITE_NAME } from "~/lib/config";

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How we collect, use, share, retain and protect your personal data, aligned with India's Digital Personal Data Protection Act, 2023."
      path="/privacy-policy"
      updated="18 June 2026"
    >
      <p>
        This Privacy Policy explains how AAJneeti Connect Ltd. ("we", "us"), which operates{" "}
        {SITE_NAME}, collects and processes your personal data. It is aligned with the Digital
        Personal Data Protection Act, 2023 (the DPDP Act).
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          Contact and enquiry details you give us: name, mobile number, email, city, course or
          stream of interest, current qualification and intended intake year.
        </li>
        <li>Verification data: the one time password status used to confirm your mobile number.</li>
        <li>
          Technical and usage data: device and browser information, pages viewed, and campaign
          parameters (for example UTM tags) that tell us how you reached us.
        </li>
      </ul>

      <h2>Purpose of processing</h2>
      <p>We process your data to:</p>
      <ul>
        <li>respond to your enquiry and provide free admission guidance;</li>
        <li>
          share your details with the relevant listed institutions you enquired about so they can
          contact you;
        </li>
        <li>verify your mobile number and prevent spam and fraudulent submissions;</li>
        <li>improve the platform and measure how our content and campaigns perform.</li>
      </ul>

      <h2>Consent</h2>
      <p>
        We rely on your consent, given through a clear and unbundled checkbox at the point of
        enquiry, to contact you and to share your details with relevant institutions. We record
        the version of the consent text you agreed to. You may withdraw consent at any time (see
        Your rights). Withdrawing consent does not affect processing already carried out.
      </p>

      <h2>Sharing with institutions and partners</h2>
      <p>
        When you request guidance, we share the details you provided with the institutions
        relevant to your enquiry and with service providers who help us operate (for example
        communication and hosting providers). These partners are required to use your data only
        for the purpose of responding to or supporting your enquiry.
      </p>

      <h2>Retention</h2>
      <p>
        We keep your personal data only as long as needed for the purposes above, or as required
        by law, after which it is deleted or anonymised.
      </p>
      <LegalTodo>
        Confirm the exact retention period (for example 24 months from last contact) with legal
        and operations before launch.
      </LegalTodo>

      <h2>Your rights</h2>
      <p>Under the DPDP Act you may:</p>
      <ul>
        <li>access a summary of the personal data we hold about you and how we process it;</li>
        <li>request correction, completion or erasure of your personal data;</li>
        <li>withdraw consent;</li>
        <li>nominate another person to exercise your rights in case of incapacity or death;</li>
        <li>raise a grievance with us and, if unresolved, with the Data Protection Board.</li>
      </ul>

      <h2>Grievance officer</h2>
      <p>
        For any privacy question, consent withdrawal or rights request, contact our Grievance
        Officer:
      </p>
      <ul>
        <li>Email: <a href="mailto:grievance@aajneeti.example">grievance@aajneeti.example</a></li>
        <li>Address: AAJneeti Connect Ltd., India</li>
      </ul>
      <LegalTodo>
        Insert the named Grievance Officer, postal address and response timelines required by
        the DPDP Act.
      </LegalTodo>

      <h2>Children</h2>
      <p>
        If you are under 18, please use this platform with the involvement of a parent or
        guardian, who provides consent on your behalf as required by law.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy. We will revise the date above and, where appropriate, notify
        you of significant changes.
      </p>
    </LegalPage>
  );
}
