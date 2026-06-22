import { useParams, type RouteDefinition } from "@solidjs/router";
import { citiesQuery, listingQuery, streamsQuery } from "~/lib/queries";
import Listing from "~/pages/Listing";

/**
 * City-wide colleges listing: /colleges/{city}. Shows ALL colleges in the city
 * (course not forced), with the full filter rail and a Course filter sourced
 * from the city's available courses. Renders the shared Listing page in city
 * mode.
 */
export const route = {
  preload: ({ params }) => {
    void listingQuery({ city: params.city });
    void streamsQuery();
    void citiesQuery();
  },
} satisfies RouteDefinition;

export default function CityCollegesRoute() {
  const params = useParams();
  return <Listing city={params.city} cityMode />;
}
