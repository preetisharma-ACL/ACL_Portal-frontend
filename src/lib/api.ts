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
  CityLite,
  CollegeCard,
  CollegeDetail,
  CourseDetail,
  ExamDetail,
  LeadPayload,
  LeadResponse,
  ListingQuery,
  ListingResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  SearchResults,
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
  return {
    stream: {
      id: r.id,
      name: r.name,
      slug: r.slug,
      icon: r.icon ?? "book",
      order: r.order ?? 99,
      course_count: (r.courses ?? []).length,
    },
    courses: (r.courses ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      level: c.level,
      duration: c.typical_duration ?? c.duration,
      fee_range: c.fee_range ? formatFeeRange(c.fee_range) : c.fee_range,
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
      established: h.established_year ?? ov.established_year ?? 0,
      approvals: h.approvals ?? ov.approvals ?? [],
      rating: Number(h.rating) || 0,
      review_count: 0,
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
    placements: [],
    rankings: [],
    cutoffs: [],
    media: [],
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

export { ApiError };
