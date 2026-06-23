/**
 * Typed API client for the ACL backend contract.
 *
 * Every function works against the live API (VITE_API_BASE) or, when
 * VITE_USE_MOCK=true, against bundled fixtures so the whole site renders before
 * the backend exists. Swap the toggle in .env once the API is reachable.
 */
import { API_BASE, USE_MOCK } from "./config";
import * as mock from "./mock/data";
import { formatFeeRange, inrShort, titleCaseType } from "./format";
import { slugify } from "./slug";
import type {
  AnswerPayload,
  ArticleCategory,
  ArticleDetail,
  ArticleQuery,
  ArticlesPage,
  CityLite,
  CollegeCard,
  CollegeDetail,
  CompareResponse,
  CourseDetail,
  ExamDetail,
  LeadPayload,
  LeadResponse,
  ListingQuery,
  ListingResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  QuestionPayload,
  QuestionsResponse,
  ReviewPayload,
  ReviewsResponse,
  SearchResults,
  SiteImages,
  Stream,
  StreamDetail,
} from "./types";

class ApiError extends Error {
  status: number;
  /** The backend error body (parsed JSON when possible, else text). */
  detail: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.name = "ApiError";
  }
}

/** Read a non-2xx response body once, preferring JSON, so the backend's error
 *  detail (e.g. DRF field errors) is never thrown away. */
async function readError(res: Response): Promise<{ text: string; json?: unknown }> {
  let text = "";
  try {
    text = await res.text();
  } catch {
    return { text: "" };
  }
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text };
  }
}

async function get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(API_BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const e = await readError(res);
    console.error(`GET ${path} -> ${res.status}`, e.json ?? e.text);
    throw new ApiError(res.status, `GET ${path} failed: ${res.status} ${e.text.slice(0, 800)}`, e.json ?? e.text);
  }
  return (await res.json()) as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await readError(res);
    console.error(`POST ${path} -> ${res.status}`, e.json ?? e.text);
    throw new ApiError(res.status, `POST ${path} failed: ${res.status} ${e.text.slice(0, 800)}`, e.json ?? e.text);
  }
  return (await res.json()) as T;
}

/* ------------------------------------------------------------ live mappers */
/*
 * The live API returns richer, structured shapes (objects for course/city,
 * {min,max} fee ranges, string ratings, flat detail payloads). These mappers
 * normalise each response into the frontend display types in one place, so the
 * components and mock fixtures stay unchanged. Missing optional fields degrade
 * to empty (sections then hide gracefully) rather than crashing.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

function mapCard(r: any): CollegeCard {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    city: r.city ?? "",
    logo: r.logo ?? "",
    key_courses: r.key_courses ?? [],
    fee_range: formatFeeRange(r.fee_range),
    approvals: r.approvals ?? [],
    rating: Number(r.rating) || 0,
    type: titleCaseType(r.type),
  };
}

function mapFilterOpts(arr: any): { value: string; label: string; count?: number }[] {
  return (arr ?? []).map((o: any) => ({
    value: String(o.value ?? o.key ?? ""),
    label: o.label,
    count: o.count,
  }));
}

function mapListing(r: any): ListingResponse {
  const m = r.meta ?? {};
  return {
    meta: {
      course: m.course?.name ?? String(m.course ?? ""),
      city: m.city?.name ?? String(m.city ?? ""),
      total_colleges: m.total_colleges ?? (r.results ?? []).length,
      fee_range: formatFeeRange(m.fee_range),
      popular_courses: (m.popular_courses ?? []).map((p: any) =>
        typeof p === "object"
          ? { name: p.name, slug: p.slug ?? slugify(p.name ?? "") }
          : { name: String(p), slug: slugify(String(p)) },
      ),
      intro: m.intro,
    },
    filters: {
      types: mapFilterOpts(r.filters?.types),
      exams: mapFilterOpts(r.filters?.exams),
      approvals: mapFilterOpts(r.filters?.approvals),
      fee_buckets: mapFilterOpts(r.filters?.fee_buckets),
    },
    results: (r.results ?? []).map(mapCard),
    pagination: r.pagination ?? { page: 1, page_size: 20, total: 0, has_next: false },
    faqs: r.faqs ?? [],
  };
}

function mapStreamDetail(r: any): StreamDetail {
  // Live shape is nested: { stream: {id,name,slug}, courses, top_cities }.
  // Fall back to the flat shape so either is handled.
  const st = r.stream ?? r;
  return {
    stream: {
      id: st.id,
      name: st.name,
      slug: st.slug,
      icon: st.icon ?? "book",
      order: st.order ?? 99,
      course_count: (r.courses ?? st.courses ?? []).length,
    },
    courses: (r.courses ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      level: c.level,
      duration: c.typical_duration ?? c.duration,
      fee_range: formatFeeRange(c.fee_range),
    })),
    top_cities: (r.top_cities ?? []).map((c: any) => ({
      id: c.id ?? 0,
      name: c.name,
      slug: c.slug,
      state: c.state ?? "",
      tier: c.tier ?? 0,
      college_count: c.college_count ?? 0,
    })),
  };
}

function mapCollege(r: any): CollegeDetail {
  const h = r.header ?? {};
  const ov = r.overview ?? {};
  const campus = (ov.campuses ?? [])[0] ?? {};
  const name = h.name ?? r.name ?? "";
  const courses_fees = (r.courses_fees ?? []).map((x: any) => ({
    course: x.specialization ? `${x.course} (${x.specialization})` : x.course,
    duration: x.duration ?? "",
    total_fee: x.fees_amount
      ? `${inrShort(Number(x.fees_amount))}${x.fees_period === "YEAR" ? " / year" : ""}`
      : "",
    eligibility: x.eligibility ?? "",
    exams_accepted: x.exams_accepted ?? [],
  }));
  const accepted_exams = Array.from(
    new Set(courses_fees.flatMap((x: { exams_accepted: string[] }) => x.exams_accepted)),
  ) as string[];
  return {
    header: {
      id: r.id,
      slug: r.slug,
      name,
      short_name: name.split(" ").slice(0, 2).join(" "),
      city: h.primary_city ?? campus.city ?? "",
      state: campus.state ?? "",
      logo: h.logo ?? "",
      cover: "",
      type: titleCaseType(h.type),
      // null (not 0) when unknown, so the UI can hide it cleanly.
      established: h.established_year ?? ov.established_year ?? null,
      affiliation: ov.affiliation ?? "",
      approvals: h.approvals ?? ov.approvals ?? [],
      rating: Number(h.rating ?? r.review_summary?.average) || 0,
      review_count: h.review_count ?? r.review_summary?.count ?? 0,
    },
    overview: {
      description: ov.about ?? "",
      highlights: [],
      campus_size: undefined,
      website: undefined,
    },
    courses_fees,
    admissions: {
      process: "",
      eligibility: "",
      important_dates: [],
      accepted_exams,
    },
    // Consume the real backend blocks (these were previously hardcoded to []).
    placements: (r.placements ?? []).map((x: any) => ({
      year: x.year != null ? String(x.year) : "",
      highest_package:
        x.highest != null ? inrShort(Number(x.highest)) : (x.highest_package ?? ""),
      average_package:
        x.average != null ? inrShort(Number(x.average)) : (x.average_package ?? ""),
      median_package: x.median != null ? inrShort(Number(x.median)) : (x.median_package ?? ""),
      placement_rate:
        x.placement_pct != null ? `${x.placement_pct}%` : (x.placement_rate ?? ""),
      top_recruiters: x.top_recruiters ?? [],
    })),
    rankings: (r.rankings ?? []).map((x: any) => ({
      agency: x.agency ?? "",
      rank: x.rank != null ? `#${x.rank}` : "",
      category: x.category ?? "",
      year: x.year != null ? String(x.year) : "",
    })),
    cutoffs: (r.cutoffs ?? []).map((x: any) => ({
      exam: x.exam ?? x.exam_name ?? "",
      category: x.category ?? "",
      round: x.round != null ? String(x.round) : "",
      cutoff: x.cutoff != null ? String(x.cutoff) : (x.value ?? ""),
      year: x.year != null ? String(x.year) : "",
    })),
    media: (r.media ?? []).map((x: any) => ({
      type: x.type === "video" ? ("video" as const) : ("image" as const),
      url: x.url ?? x.image ?? "",
      caption: x.caption ?? x.title ?? "",
    })),
    contact: {
      address: campus.address ?? "",
      city: h.primary_city ?? campus.city ?? "",
      state: campus.state ?? "",
      pincode: "",
      phone: "",
      email: "",
      latitude: campus.latitude ?? undefined,
      longitude: campus.longitude ?? undefined,
    },
    operator_disclosure:
      r.operator_disclosure ??
      "This page is maintained by AAJneeti Connect Ltd. as part of an independent education discovery platform. We are not affiliated with this institution unless explicitly stated.",
  };
}

function mapSearch(r: any): SearchResults {
  return {
    colleges: (r.colleges ?? []).map((c: any) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      city: c.city ?? "",
      type: titleCaseType(c.type),
    })),
    courses: (r.courses ?? []).map((c: any) => ({ id: c.id, slug: c.slug, name: c.name })),
    exams: (r.exams ?? []).map((e: any) => ({ id: e.id, slug: e.slug, name: e.name })),
  };
}

/* ------------------------------------------------------------------ taxonomy */

export function getStreams(): Promise<Stream[]> {
  if (USE_MOCK) return Promise.resolve(mock.STREAMS);
  // Resilient: a streams failure must never blank core navigation or the home.
  return get<Stream[]>("/taxonomy/streams/").catch(() => []);
}

export function getStream(slug: string): Promise<StreamDetail> {
  if (USE_MOCK) return Promise.resolve(mock.buildStreamDetail(slug));
  return get<any>(`/taxonomy/streams/${slug}/`).then(mapStreamDetail);
}

export function getCities(): Promise<CityLite[]> {
  if (USE_MOCK) return Promise.resolve(mock.CITIES);
  return get<CityLite[]>("/taxonomy/cities/");
}

/* --------------------------------------------------------------- site images
 * Backend-managed background/hero slots. Returns only active uploaded slots
 * ({slot: {image_url, alt, caption}}); the UI falls back to bundled defaults
 * for any slot not present. Resilient: a failure must not blank a hero. */

export function getSiteImages(): Promise<SiteImages> {
  if (USE_MOCK) return Promise.resolve({});
  return get<SiteImages>("/site-images/").catch(() => ({}));
}

/* -------------------------------------------------------------------- courses */

export function getCourse(slug: string): Promise<CourseDetail> {
  if (USE_MOCK) return Promise.resolve(mock.buildCourseDetail(slug));
  // Backend returns the native {course, specializations, related_exams,
  // top_colleges} shape; consume it directly, only normalizing the embedded
  // college cards (shared card normalizer, used everywhere cards render).
  return get<any>(`/courses/${slug}/`).then((r) => ({
    course: r.course,
    specializations: r.specializations ?? [],
    related_exams: r.related_exams ?? [],
    top_colleges: (r.top_colleges ?? []).map(mapCard),
  }));
}

/* ---------------------------------------------------------------------- exams */

export function getExam(slug: string): Promise<ExamDetail> {
  if (USE_MOCK) return Promise.resolve(mock.buildExamDetail(slug));
  // Backend returns the native {exam, accepting_colleges} shape, with syllabus
  // and important_dates inside exam. Consume directly; normalize only the cards.
  return get<any>(`/exams/${slug}/`).then((r) => ({
    exam: r.exam,
    accepting_colleges: (r.accepting_colleges ?? []).map(mapCard),
  }));
}

/* ------------------------------------------------------------------- listings */

export function getListing(query: ListingQuery): Promise<ListingResponse> {
  if (USE_MOCK) {
    const base = mock.buildListing(query.course ?? "mba", query.city ?? "varanasi");
    return Promise.resolve(applyMockFilters(base, query));
  }
  return get<any>("/listings/", query as Record<string, string | undefined>).then(mapListing);
}

/**
 * Every college in a city (across courses and all pages), for the on-page
 * college name search. The backend has no name-search param, so we fetch the
 * full set (page_size is capped at 50, so we page through) and filter client
 * side. Used by the city-wide listing search box.
 */
export async function getCityColleges(city: string): Promise<CollegeCard[]> {
  if (USE_MOCK) {
    const base = mock.buildListing("", city);
    return base.results;
  }
  const out: CollegeCard[] = [];
  for (let page = 1; page <= 20; page++) {
    const r = await get<any>("/listings/", {
      city,
      page_size: "50",
      page: String(page),
    });
    out.push(...(r.results ?? []).map(mapCard));
    if (!r.pagination?.has_next) break;
  }
  return out;
}

/** Mirror the most common filters client-side so mock mode behaves like the API. */
function applyMockFilters(base: ListingResponse, q: ListingQuery): ListingResponse {
  let results = [...base.results];
  if (q.type) {
    results = results.filter((r) => r.type.toLowerCase() === q.type!.toLowerCase());
  }
  if (q.approval) {
    const want = q.approval.toLowerCase();
    results = results.filter((r) =>
      r.approvals.some((a) => a.toLowerCase().replace(/\s+/g, "-") === want),
    );
  }
  if (q.sort === "rating") {
    results.sort((a, b) => b.rating - a.rating);
  } else if (q.sort === "fees") {
    results.sort((a, b) => parseFee(a.fee_range) - parseFee(b.fee_range));
  }
  const total = results.length;
  const pageSize = base.pagination.page_size;
  const page = Math.max(1, parseInt(q.page ?? "1", 10) || 1);
  const start = (page - 1) * pageSize;
  const paged = results.slice(start, start + pageSize);
  return {
    ...base,
    results: paged,
    pagination: {
      page,
      page_size: pageSize,
      total,
      has_next: start + pageSize < total,
    },
  };
}

function parseFee(range: string): number {
  const m = range.match(/([\d.]+)L/);
  return m ? parseFloat(m[1]) : 0;
}

/* ------------------------------------------------------------------- colleges */

export function getCollege(slug: string, id: number): Promise<CollegeDetail> {
  if (USE_MOCK) return Promise.resolve(mock.buildCollegeDetail(slug, id));
  return get<any>(`/colleges/${slug}-${id}/`).then(mapCollege);
}

/** Curated list of real top colleges shown on the homepage carousel.
 *  Resilient: a missing/failing endpoint must not blank the whole homepage. */
export function getTopColleges(): Promise<CollegeCard[]> {
  if (USE_MOCK) return Promise.resolve(mock.TOP_COLLEGES);
  return get<any[]>("/colleges/top/")
    .then((arr) => (arr ?? []).map(mapCard))
    .catch(() => []);
}

/* -------------------------------------------------------------------- compare
 * GET /colleges/compare/?ids=a,b (2 to 4 valid ids; the backend 400s otherwise
 * and silently drops unknown ids when >=2 valid remain). */

export function getCompare(ids: number[]): Promise<CompareResponse> {
  if (USE_MOCK) return Promise.resolve(mock.buildCompare(ids));
  // The backend 400s when fewer than 2 valid ids remain; degrade to empty so the
  // page can show the "add more colleges" prompt instead of an error screen.
  return get<CompareResponse>("/colleges/compare/", { ids: ids.join(",") }).catch(() => ({
    colleges: [],
  }));
}

/* ------------------------------------------------------------------ editorial
 * CMS articles. featured_image/author.photo may be null or a URL; normalize to
 * string|null. The index uses DRF pagination (count/next/previous/results),
 * mapped to a simpler {results, count, page, has_next, has_prev}. */

function mapImage(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && typeof v.url === "string") return v.url;
  return null;
}

function mapArticleCard(r: any) {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt ?? "",
    featured_image: mapImage(r.featured_image),
    category: { name: r.category?.name ?? "", slug: r.category?.slug ?? "" },
    author: { name: r.author?.name ?? "", slug: r.author?.slug ?? "" },
    published_at: r.published_at ?? "",
    reading_time: r.reading_time ?? 0,
    featured: !!r.featured,
  };
}

function mapArticleDetail(r: any): ArticleDetail {
  return {
    ...mapArticleCard(r),
    body: r.body ?? "",
    category: r.category ?? { name: "", slug: "" },
    author: { ...(r.author ?? { name: "", slug: "" }), photo: mapImage(r.author?.photo) },
    status: r.status,
    meta_title: r.meta_title,
    meta_description: r.meta_description,
    canonical_url: r.canonical_url,
    related_colleges: (r.related_colleges ?? []).map(mapCard),
    related_courses: r.related_courses ?? [],
    related_exams: r.related_exams ?? [],
    related_articles: (r.related_articles ?? []).map(mapArticleCard),
  };
}

export function getArticles(params: ArticleQuery = {}): Promise<ArticlesPage> {
  if (USE_MOCK) return Promise.resolve(mock.buildArticles(params));
  const page = parseInt(params.page ?? "1", 10) || 1;
  return get<any>("/articles/", params as Record<string, string | undefined>)
    .then((r) => ({
      results: (r.results ?? []).map(mapArticleCard),
      count: r.count ?? 0,
      page,
      has_next: !!r.next,
      has_prev: !!r.previous,
    }))
    .catch(() => ({ results: [], count: 0, page, has_next: false, has_prev: false }));
}

export function getArticle(slug: string): Promise<ArticleDetail> {
  if (USE_MOCK) return Promise.resolve(mock.buildArticle(slug));
  return get<any>(`/articles/${slug}/`).then(mapArticleDetail);
}

export function getArticleCategories(): Promise<ArticleCategory[]> {
  if (USE_MOCK) return Promise.resolve(mock.ARTICLE_CATEGORIES);
  return get<ArticleCategory[]>("/article-categories/").catch(() => []);
}

/* --------------------------------------------------------------------- search */

export function search(q: string): Promise<SearchResults> {
  if (USE_MOCK) return Promise.resolve(mock.buildSearch(q));
  return get<any>("/search/", { q }).then(mapSearch);
}

/* ---------------------------------------------------------------------- leads */

export function requestOtp(mobile: string): Promise<OtpRequestResponse> {
  if (USE_MOCK) return Promise.resolve({ request_id: "mock-" + mobile.slice(-4) });
  return post<OtpRequestResponse>("/leads/otp/request/", { mobile });
}

export function verifyOtp(request_id: string, otp: string): Promise<OtpVerifyResponse> {
  if (USE_MOCK) {
    // Preview/demo mode: accept any 4 to 6 digit code so the flow completes
    // without a backend. Nothing is sent anywhere.
    const verified = /^\d{4,6}$/.test(otp.trim());
    return Promise.resolve({ verified, token: "mock-otp-token" });
  }
  return post<OtpVerifyResponse>("/leads/otp/verify/", { request_id, otp });
}

export function submitLead(payload: LeadPayload): Promise<LeadResponse> {
  if (USE_MOCK) return Promise.resolve({ id: 1, status: "received" });
  return post<LeadResponse>("/leads/", payload);
}

/* ----------------------------------------------------- reviews & q&a (Phase A)
 * GET lists are addressed by the "slug-id" form (the numeric-only path is
 * POST-only on the backend). Creates POST to the numeric college/question id.
 * All created content is moderated server-side: it is NOT live until approved. */

export function getReviews(slugId: string, page = 1): Promise<ReviewsResponse> {
  if (USE_MOCK) return Promise.resolve(mock.buildReviews());
  return get<ReviewsResponse>(`/colleges/${slugId}/reviews/`, { page: String(page) });
}

export function getQuestions(slugId: string, page = 1): Promise<QuestionsResponse> {
  if (USE_MOCK) return Promise.resolve(mock.buildQuestions());
  return get<QuestionsResponse>(`/colleges/${slugId}/questions/`, { page: String(page) });
}

export function postReview(collegeId: number, payload: ReviewPayload) {
  if (USE_MOCK) return Promise.resolve({ id: 0, status: "pending" });
  return post(`/colleges/${collegeId}/reviews/`, payload);
}

export function postQuestion(collegeId: number, payload: QuestionPayload) {
  if (USE_MOCK) return Promise.resolve({ id: 0, status: "pending" });
  return post(`/colleges/${collegeId}/questions/`, payload);
}

export function postAnswer(questionId: number, payload: AnswerPayload) {
  if (USE_MOCK) return Promise.resolve({ id: 0, status: "pending" });
  return post(`/questions/${questionId}/answers/`, payload);
}

export { ApiError };
