import LegalPage from "~/components/LegalPage";
import { OPERATOR_DISCLOSURE, SITE_NAME } from "~/lib/config";

export default function Disclosure() {
  return (
    <LegalPage
      title="Disclosure"
      description={`${SITE_NAME} is an independent education discovery platform operated by AAJneeti Connect Ltd. and is not affiliated with the institutions listed unless stated.`}
      path="/disclosure"
      updated="18 June 2026"
    >
      <p>{OPERATOR_DISCLOSURE}</p>

      <h2>Independent platform</h2>
      <p>
        {SITE_NAME} is a discovery and comparison platform. We are not a college, university or
        admissions authority. Listing an institution does not imply that the institution endorses
        us, or that we endorse the institution.
      </p>

      <h2>No unearned endorsement</h2>
      <p>
        We do not impersonate any single institution and we do not imply approval, ranking or
        accreditation that has not been earned. Approvals and accreditations shown (for example
        AICTE, UGC or NAAC) are attributed to the institution as compiled from available sources
        and should be verified with the institution.
      </p>

      <h2>Commercial relationships</h2>
      <p>
        We may have commercial relationships with some institutions, for example when we connect
        interested students to them. These relationships do not buy a higher rating or more
        favourable editorial treatment. Sponsored or commercial content, where present, is
        labelled.
      </p>

      <h2>How we present figures</h2>
      <p>
        Fees, placements, rankings, cutoffs and dates are indicative, compiled for comparison and
        subject to change. We do not manufacture urgency and we do not make unverifiable claims.
        Always confirm current details with the institution before taking any decision.
      </p>

      <h2>Tell us about an error</h2>
      <p>
        If you are an institution or a reader and you spot an inaccuracy, write to us at{" "}
        <a href="mailto:corrections@aajneeti.example">corrections@aajneeti.example</a> and we will
        review it.
      </p>
    </LegalPage>
  );
}
