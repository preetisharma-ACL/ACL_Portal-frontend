/**
 * Cached server-side data loaders. Each wraps an API call in `query` with a
 * stable key, and pins execution to the server with "use server" so data is
 * fetched during SSR (and over the SolidStart server on client navigation),
 * never directly from the browser. This is what makes every page indexable.
 */
import { query } from "@solidjs/router";
import * as api from "./api";
import type { ListingQuery } from "./types";

export const streamsQuery = query(async () => {
  "use server";
  return api.getStreams();
}, "streams");

export const streamQuery = query(async (slug: string) => {
  "use server";
  return api.getStream(slug);
}, "stream");

export const citiesQuery = query(async () => {
  "use server";
  return api.getCities();
}, "cities");

export const courseQuery = query(async (slug: string) => {
  "use server";
  return api.getCourse(slug);
}, "course");

export const examQuery = query(async (slug: string) => {
  "use server";
  return api.getExam(slug);
}, "exam");

export const listingQuery = query(async (q: ListingQuery) => {
  "use server";
  return api.getListing(q);
}, "listing");

export const collegeQuery = query(async (slug: string, id: number) => {
  "use server";
  return api.getCollege(slug, id);
}, "college");

export const searchQuery = query(async (q: string) => {
  "use server";
  if (!q || q.trim().length < 1) return { colleges: [], courses: [], exams: [] };
  return api.search(q.trim());
}, "search");

/**
 * Homepage aggregate, composed from contract endpoints so it works against the
 * live API without a bespoke /home route. Returns streams, popular cities, a
 * set of top colleges, popular courses and headline counts.
 */
export const homeQuery = query(async () => {
  "use server";
  const [streams, cities, topColleges] = await Promise.all([
    api.getStreams(),
    api.getCities(),
    api.getTopColleges(),
  ]);

  // Popular courses across a spread of streams, with real slugs for linking.
  const popularStreamSlugs = ["mba", "engineering", "medical", "law", "commerce", "design"];
  const streamDetails = await Promise.all(popularStreamSlugs.map((s) => api.getStream(s)));
  const popularCourses = streamDetails
    .flatMap((sd) =>
      sd.courses.slice(0, 2).map((c) => ({ name: c.name, slug: c.slug, stream: sd.stream.name })),
    )
    .slice(0, 10);

  const totalColleges = cities.reduce((n, c) => n + c.college_count, 0);
  const totalCourses = streams.reduce((n, s) => n + s.course_count, 0);
  return {
    streams,
    cities,
    topColleges,
    popularCourses,
    counts: { colleges: totalColleges, courses: totalCourses, cities: cities.length },
  };
}, "home");
