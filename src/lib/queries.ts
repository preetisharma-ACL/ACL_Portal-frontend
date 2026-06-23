/**
 * Cached server-side data loaders. Each wraps an API call in `query` with a
 * stable key, and pins execution to the server with "use server" so data is
 * fetched during SSR (and over the SolidStart server on client navigation),
 * never directly from the browser. This is what makes every page indexable.
 */
import { query, redirect } from "@solidjs/router";
import * as api from "./api";
import * as account from "./account";
import type { CourseLite, ListingQuery } from "./types";

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

export const siteImagesQuery = query(async () => {
  "use server";
  return api.getSiteImages();
}, "site-images");

export const courseQuery = query(async (slug: string) => {
  "use server";
  return api.getCourse(slug);
}, "course");

/**
 * Flat list of all courses (distinct {name, slug}) across every stream, for the
 * lead form's "Course of interest" dropdown. Sourcing it from the streams
 * taxonomy guarantees every option is a real backend course slug, so the lead
 * POST never 400s on course_interest. Cached, so it is fetched once.
 */
export const coursesQuery = query(async () => {
  "use server";
  const streams = await api.getStreams();
  const details = await Promise.all(
    streams.map((s) => api.getStream(s.slug).catch(() => null)),
  );
  const bySlug = new Map<string, { name: string; slug: string }>();
  for (const d of details) {
    if (!d) continue;
    for (const c of d.courses) {
      if (c.slug && !bySlug.has(c.slug)) bySlug.set(c.slug, { name: c.name, slug: c.slug });
    }
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}, "courses-all");

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

export const reviewsQuery = query(async (slugId: string, page: number) => {
  "use server";
  return api.getReviews(slugId, page);
}, "reviews");

export const questionsQuery = query(async (slugId: string, page: number) => {
  "use server";
  return api.getQuestions(slugId, page);
}, "questions");

export const articlesQuery = query(async (params: import("./types").ArticleQuery) => {
  "use server";
  return api.getArticles(params);
}, "articles");

export const articleQuery = query(async (slug: string) => {
  "use server";
  return api.getArticle(slug);
}, "article");

export const articleCategoriesQuery = query(async () => {
  "use server";
  return api.getArticleCategories();
}, "article-categories");

/* ---------------------------------------------------------------- accounts */

export const meQuery = query(async () => {
  "use server";
  return account.getCurrentUser();
}, "me");

/** Like meQuery but redirects to the login prompt when not authenticated.
 *  Used to guard the /account pages (SSR-issued redirect). */
export const requireMeQuery = query(async () => {
  "use server";
  const user = await account.getCurrentUser();
  if (!user) throw redirect("/?login=1");
  return user;
}, "require-me");

export const savedQuery = query(async () => {
  "use server";
  return account.getSaved();
}, "saved");

export const trackingQuery = query(async () => {
  "use server";
  return account.getTracking();
}, "tracking");

export const myLeadsQuery = query(async () => {
  "use server";
  return account.getMyLeads();
}, "my-leads");

export const compareQuery = query(async (ids: number[]) => {
  "use server";
  return api.getCompare(ids);
}, "compare");

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

  // Fetch every stream's courses once so the Browse-by-stream explorer switches
  // instantly on the client (no per-click server round-trip, no flicker).
  const streamDetails = await Promise.all(streams.map((s) => api.getStream(s.slug)));
  const coursesByStream: Record<string, CourseLite[]> = {};
  for (const sd of streamDetails) coursesByStream[sd.stream.slug] = sd.courses;

  // Popular courses across a spread of streams, with real slugs for linking.
  const popularStreamSlugs = ["mba", "engineering", "medical", "law", "commerce", "design"];
  const popularCourses = streamDetails
    .filter((sd) => popularStreamSlugs.includes(sd.stream.slug))
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
    coursesByStream,
    counts: { colleges: totalColleges, courses: totalCourses, cities: cities.length },
  };
}, "home");
