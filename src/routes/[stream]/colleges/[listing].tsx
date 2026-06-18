import { type RouteDefinition } from "@solidjs/router";
import { listingQuery } from "~/lib/queries";
import { parseListingSlug } from "~/lib/slug";
import Listing from "~/pages/Listing";

export const route = {
  preload: ({ params }) => {
    const { course, city } = parseListingSlug(params.listing);
    void listingQuery({ course: course || params.stream, city });
  },
} satisfies RouteDefinition;

export default function ListingRoute() {
  return <Listing />;
}
