import { useParams, type RouteDefinition } from "@solidjs/router";
import { collegeQuery } from "~/lib/queries";
import { parseSlugId } from "~/lib/slug";
import CollegeDetail from "~/pages/CollegeDetail";

export const route = {
  preload: ({ params }) => {
    const { slug, id } = parseSlugId(params.slugId);
    void collegeQuery(slug, id);
  },
} satisfies RouteDefinition;

export default function CollegeReviewsRoute() {
  const params = useParams();
  return <CollegeDetail slugId={params.slugId ?? ""} tab="reviews" />;
}
