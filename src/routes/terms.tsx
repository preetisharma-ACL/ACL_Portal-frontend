import LegalPage, { LegalTodo } from "~/components/LegalPage";
import { SITE_NAME } from "~/lib/config";

export default function Terms() {
  return (
    <LegalPage
      title="Terms and Conditions"
      description={`The terms that govern your use of ${SITE_NAME}, operated by AAJneeti Connect Ltd.`}
      path="/terms"
      updated="18 June 2026"
    >
      <p>
        These Terms and Conditions govern your use of {SITE_NAME}, operated by AAJneeti Connect
        Ltd. By using the platform you agree to these terms. If you do not agree, please do not
        use the platform.
      </p>

      <h2>What we provide</h2>
      <p>
        We provide a discovery and comparison platform for colleges, courses and entrance exams,
        and free guidance to students who request it. We are an independent platform and are not
        an admissions authority for any institution.
      </p>

      <h2>Accuracy of information</h2>
      <p>
        We compile information from public sources and institutions and organise it for
        comparison. Details such as fees, eligibility, placements, rankings, cutoffs and dates
        are indicative and may change. You should verify any detail directly with the relevant
        institution before acting on it. We do not guarantee admission, scholarships, results or
        any specific outcome.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Provide accurate information when you make an enquiry.</li>
        <li>Use the platform lawfully and not to spam, scrape or disrupt the service.</li>
        <li>Use a mobile number you are authorised to use for verification.</li>
      </ul>

      <h2>Lead enquiries</h2>
      <p>
        When you submit an enquiry with consent, you authorise us to contact you and to share
        your details with relevant institutions, as described in our{" "}
        <a href="/privacy-policy">Privacy Policy</a>. Enquiries are category and guidance level;
        the platform is not an application to any single institution.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The platform, its design and its original content belong to AAJneeti Connect Ltd. or its
        licensors. Institution names, logos and trademarks belong to their respective owners and
        are used for identification and comparison only.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, we are not liable for decisions made on the basis of
        information on the platform, or for the acts of the institutions you choose to contact.
      </p>
      <LegalTodo>
        Confirm the limitation of liability, indemnity and governing law and jurisdiction clauses
        with legal counsel before launch.
      </LegalTodo>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The date above reflects the latest version.
        Continued use after a change means you accept the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India.</p>
    </LegalPage>
  );
}
