import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import { breadcrumbLd } from "~/lib/jsonld";
import { OPERATOR_DISCLOSURE, SITE_NAME } from "~/lib/config";

/**
 * Operator disclosure page (compliance item 5). Static content, kept separate
 * from the admin-editable legal pages (/disclaimer, /privacy-policy, ...).
 */
export default function Disclosure() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Disclosure", path: "/disclosure" },
  ];
  return (
    <>
      <Seo
        title="Disclosure"
        description={`${SITE_NAME} is an independent education discovery platform operated by AAJneeti Connect Ltd. and is not affiliated with the institutions listed unless stated.`}
        canonical="/disclosure"
        jsonLd={breadcrumbLd(crumbs)}
      />
      <div class="container-x py-8 md:py-12">
        <Breadcrumbs crumbs={crumbs} />
        <article class="mt-4 max-w-3xl legal-prose">
          <h1 class="text-3xl font-bold">Disclosure</h1>
          <div class="mt-6 space-y-5 text-[var(--color-ink)]/90">
            <p>{OPERATOR_DISCLOSURE}</p>

            <h2>Independent platform</h2>
            <p>
              {SITE_NAME} is a discovery and comparison platform. We are not a college, university
              or admissions authority. Listing an institution does not imply that the institution
              endorses us, or that we endorse the institution.
            </p>

            <h2>No unearned endorsement</h2>
            <p>
              We do not impersonate any single institution and we do not imply approval, ranking or
              accreditation that has not been earned. Approvals and accreditations shown (for
              example AICTE, UGC or NAAC) are attributed to the institution as compiled from
              available sources and should be verified with the institution.
            </p>

            <h2>Commercial relationships</h2>
            <p>
              We may have commercial relationships with some institutions, for example when we
              connect interested students to them. These relationships do not buy a higher rating
              or more favourable editorial treatment. Sponsored or commercial content, where
              present, is labelled.
            </p>

            <h2>How we present figures</h2>
            <p>
              Fees, placements, rankings, cutoffs and dates are indicative, compiled for comparison
              and subject to change. We do not manufacture urgency and we do not make unverifiable
              claims. Always confirm current details with the institution before taking any
              decision.
            </p>

            <h2>Tell us about an error</h2>
            <p>
              If you are an institution or a reader and you spot an inaccuracy, write to us at{" "}
              <a href="mailto:contact@aajneeti.social">contact@aajneeti.social</a> and we will
              review it.
            </p>
          </div>
        </article>
      </div>
    </>
  );
}
