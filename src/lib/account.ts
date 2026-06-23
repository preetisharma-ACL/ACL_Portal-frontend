"use server";
/**
 * Server-only account/auth module. Marked "use server" at module scope so the
 * whole thing (and its server-only cookie imports) never reaches the client
 * bundle; every export is a server action callable from the client as an async
 * function.
 *
 * Session handling: the JWT access + refresh tokens live in httpOnly, secure,
 * SameSite=Lax cookies (XSS-safe; SSR can read them). meFetch attaches the
 * access token to /me/* calls and transparently refreshes on 401, logging the
 * user out only when refresh itself fails.
 */
import { getRequestEvent } from "solid-js/web";
import { getCookie, setCookie, deleteCookie } from "vinxi/http";
import { API_BASE } from "./config";
import type {
  AuthUser,
  CollegeCard,
  CollegeInterest,
  LeadPayload,
  MyLead,
  ProfilePatch,
} from "./types";

const ACCESS = "acl_access";
const REFRESH = "acl_refresh";
const ACCESS_MAX_AGE = 60 * 60; // 1h; refresh covers longer sessions
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30d

function evt() {
  return getRequestEvent()!.nativeEvent;
}

function readCookie(name: string): string | undefined {
  return getCookie(evt(), name);
}

function writeCookie(name: string, value: string, maxAge: number) {
  setCookie(evt(), name, value, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

function setTokens(access: string, refresh?: string) {
  writeCookie(ACCESS, access, ACCESS_MAX_AGE);
  if (refresh) writeCookie(REFRESH, refresh, REFRESH_MAX_AGE);
}

function clearTokens() {
  deleteCookie(evt(), ACCESS, { path: "/" });
  deleteCookie(evt(), REFRESH, { path: "/" });
}

/** Read the current access token (server-side). Exposed so the lead action can
 *  attach it for logged-in submissions. */
export function getAccessToken(): string | null {
  return readCookie(ACCESS) ?? null;
}

async function tryRefresh(): Promise<string | null> {
  const refresh = readCookie(REFRESH);
  if (!refresh) return null;
  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const tok = await res.json().catch(() => null);
  if (!tok?.access) {
    clearTokens();
    return null;
  }
  setTokens(tok.access, tok.refresh ?? refresh);
  return tok.access as string;
}

/** Authenticated fetch to a /me/* endpoint, with one transparent refresh retry.
 *  Returns null when the user is not authenticated (no/expired session). */
async function meFetch(path: string, init: RequestInit = {}): Promise<Response | null> {
  let access = readCookie(ACCESS);
  if (!access) access = (await tryRefresh()) ?? undefined;
  if (!access) return null;

  const call = (token: string) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
    });

  let res = await call(access);
  if (res.status === 401) {
    const fresh = await tryRefresh();
    if (!fresh) return null;
    res = await call(fresh);
  }
  return res;
}

/* ------------------------------------------------------------------- auth */

export async function loginRequestOtp(phone: string): Promise<{ ok: boolean; detail?: string }> {
  const res = await fetch(`${API_BASE}/auth/otp/request/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim() }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, detail: data?.detail };
}

export async function loginVerify(
  phone: string,
  otp: string,
): Promise<{ ok: boolean; user?: AuthUser | null; detail?: string }> {
  const res = await fetch(`${API_BASE}/auth/otp/verify/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.access) {
    return { ok: false, detail: data?.detail || "That code did not match. Please try again." };
  }
  setTokens(data.access, data.refresh);
  const user = await getCurrentUser();
  return { ok: true, user };
}

export async function logout(): Promise<{ ok: boolean }> {
  const refresh = readCookie(REFRESH);
  // Best-effort backend logout (blacklist the refresh token); ignore failures.
  if (refresh) {
    await meFetch("/auth/logout/", { method: "POST", body: JSON.stringify({ refresh }) }).catch(
      () => null,
    );
  }
  clearTokens();
  return { ok: true };
}

/* -------------------------------------------------------------------- /me/ */

export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await meFetch("/me/");
  if (!res || !res.ok) return null;
  return res.json().catch(() => null);
}

export async function updateProfile(patch: ProfilePatch): Promise<AuthUser | null> {
  const res = await meFetch("/me/", { method: "PATCH", body: JSON.stringify(patch) });
  if (!res || !res.ok) return null;
  return res.json().catch(() => null);
}

export async function getSaved(): Promise<CollegeCard[]> {
  const res = await meFetch("/me/saved-colleges/");
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : (data?.results ?? []);
}

export async function saveCollege(collegeId: number): Promise<{ ok: boolean; authed: boolean }> {
  const res = await meFetch("/me/saved-colleges/", {
    method: "POST",
    body: JSON.stringify({ college_id: collegeId }),
  });
  if (!res) return { ok: false, authed: false };
  return { ok: res.ok, authed: true };
}

export async function unsaveCollege(collegeId: number): Promise<{ ok: boolean; authed: boolean }> {
  const res = await meFetch(`/me/saved-colleges/${collegeId}/`, { method: "DELETE" });
  if (!res) return { ok: false, authed: false };
  return { ok: res.ok || res.status === 204, authed: true };
}

export async function getTracking(): Promise<CollegeInterest[]> {
  const res = await meFetch("/me/tracking/");
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : (data?.results ?? []);
}

export async function setTracking(payload: {
  college_id: number;
  status?: string;
  notes?: string;
}): Promise<{ ok: boolean; authed: boolean; item?: CollegeInterest }> {
  const res = await meFetch("/me/tracking/", { method: "POST", body: JSON.stringify(payload) });
  if (!res) return { ok: false, authed: false };
  const item = res.ok ? await res.json().catch(() => undefined) : undefined;
  return { ok: res.ok, authed: true, item };
}

export async function getMyLeads(): Promise<MyLead[]> {
  const res = await meFetch("/me/leads/");
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : (data?.results ?? []);
}

/** Submit a lead, attaching the access token when the user is logged in so the
 *  backend links it to their account. Anonymous submission is unchanged. */
export async function submitLeadMaybeAuthed(payload: LeadPayload): Promise<unknown> {
  const access = readCookie(ACCESS);
  const res = await fetch(`${API_BASE}/leads/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`POST /leads/ failed: ${res.status} ${text.slice(0, 800)}`);
  }
  return json;
}
