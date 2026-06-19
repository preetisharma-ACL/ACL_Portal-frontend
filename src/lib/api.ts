/**
 * Typed API client for the ACL backend contract.
 *
 * Every function works against the live API (VITE_API_BASE) or, when
 * VITE_USE_MOCK=true, against bundled fixtures so the whole site renders before
 * the backend exists. Swap the toggle in .env once the API is reachable.
 */
import { API_BASE, USE_MOCK } from "./config";
import * as mock from "./mock/data";
import type {
  CityLite,
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
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
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
  if (!res.ok) throw new ApiError(res.status, `GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, `POST ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ taxonomy */

export function getStreams(): Promise<Stream[]> {
  if (USE_MOCK) return Promise.resolve(mock.STREAMS);
  return get<Stream[]>("/taxonomy/streams/");
}

export function getStream(slug: string): Promise<StreamDetail> {
  if (USE_MOCK) return Promise.resolve(mock.buildStreamDetail(slug));
  return get<StreamDetail>(`/taxonomy/streams/${slug}/`);
}

export function getCities(): Promise<CityLite[]> {
  if (USE_MOCK) return Promise.resolve(mock.CITIES);
  return get<CityLite[]>("/taxonomy/cities/");
}

/* -------------------------------------------------------------------- courses */

export function getCourse(slug: string): Promise<CourseDetail> {
  if (USE_MOCK) return Promise.resolve(mock.buildCourseDetail(slug));
  return get<CourseDetail>(`/courses/${slug}/`);
}

/* ---------------------------------------------------------------------- exams */

export function getExam(slug: string): Promise<ExamDetail> {
  if (USE_MOCK) return Promise.resolve(mock.buildExamDetail(slug));
  return get<ExamDetail>(`/exams/${slug}/`);
}

/* ------------------------------------------------------------------- listings */

export function getListing(query: ListingQuery): Promise<ListingResponse> {
  if (USE_MOCK) {
    const base = mock.buildListing(query.course ?? "mba", query.city ?? "varanasi");
    return Promise.resolve(applyMockFilters(base, query));
  }
  return get<ListingResponse>("/listings/", query as Record<string, string | undefined>);
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
  return get<CollegeDetail>(`/colleges/${slug}-${id}/`);
}

/* --------------------------------------------------------------------- search */

export function search(q: string): Promise<SearchResults> {
  if (USE_MOCK) return Promise.resolve(mock.buildSearch(q));
  return get<SearchResults>("/search/", { q });
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
