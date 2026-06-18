import LegalPage from "~/components/LegalPage";
import { SITE_NAME } from "~/lib/config";

export default function About() {
  return (
    <LegalPage
      title={`About ${SITE_NAME}`}
      description={`${SITE_NAME} is an independent education discovery platform operated by AAJneeti Connect Ltd. Learn how we compile and present college, course and exam information.`}
      path="/about"
      updated="18 June 2026"
    >
      <p>
        {SITE_NAME} is an independent education discovery platform. We help students and
        parents find and compare colleges, courses and entrance exams with clear, comparable
        information so they can make a confident decision.
      </p>

      <h2>Who operates this platform</h2>
      <p>
        This platform is operated by AAJneeti Connect Ltd. We are a technology and media company.
        We are not a college, a university or an admissions authority, and we are not affiliated
        with the institutions listed here unless that relationship is explicitly stated on the
        relevant page.
      </p>

      <h2>How we compile information</h2>
      <p>
        College, course, fee and exam details are compiled from publicly available sources and
        from institutions, and are organised for comparison. Figures such as fees, placements
        and cutoffs are indicative and can change. Always confirm the current details with the
        institution before taking any decision.
      </p>

      <h2>Editorial independence</h2>
      <p>
        Our listings and editorial content are produced independently. A college appearing on
        the platform, or working with us commercially, does not buy a higher rating or a more
        favourable write up. Where content is sponsored or commercial in nature, we label it.
      </p>

      <h2>How we earn</h2>
      <p>
        We offer free guidance to students. When you request guidance, we may share your details
        with relevant institutions so they can respond to your enquiry, and we may be paid by
        those institutions for connecting genuine, interested students. We never charge students
        for this service.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about the platform, write to us at{" "}
        <a href="mailto:hello@aajneeti.example">hello@aajneeti.example</a>. For data and privacy
        requests, see our <a href="/privacy-policy">Privacy Policy</a>.
      </p>
    </LegalPage>
  );
}
