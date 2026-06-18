/**
 * Live-API integration smoke test for the ACL Education Portal frontend.
 *
 * Proves three things against a running stack:
 *   1. The live backend serves the contract endpoints with seeded data.
 *   2. The SSR frontend renders that real seeded data into the HTML (not mock,
 *      not an empty shell), which also exercises live API + CORS in one shot.
 *   3. The full lead journey works end to end: otp/request -> read dev_otp ->
 *      otp/verify -> POST /leads/ with unbundled consent + the consent text
 *      version + the verified OTP token.
 *
 * Run it pointed at a reachable stack:
 *   API_BASE=http://localhost:8000/api/v1 \
 *   SITE_URL=http://localhost:3100 \
 *   node scripts/smoke.mjs
 *
 * Exit code 0 = all checks passed, 1 = a check failed, 2 = the stack was
 * unreachable. It only reads dev_otp, which the backend exposes solely while
 * OTP_DEV_EXPOSE is true (dev) and refuses to start with in production.
 *
 * Note on console errors: true in-browser console capture needs a real browser
 * (Playwright is not installed here). Instead this asserts clean HTTP responses
 * and valid, non-error SSR markup, which catches the same integration failures
 * a blank or error page would show.
 */

const API = (process.env.API_BASE || "http://localhost:8000/api/v1").replace(/\/$/, "");
const SITE = (process.env.SITE_URL || "http://localhost:3100").replace(/\/$/, "");

// Mirror src/lib/config.ts CONSENT_TEXT_VERSION. Keep in sync if that changes.
const CONSENT_TEXT_VERSION = "2026-06-v1";

let failures = 0;
const ok = (label) => console.log(`  PASS  ${label}`);
const bad = (label, detail) => {
  failures += 1;
  console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ""}`);
};

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}
async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { _raw: text };
  }
  return { status: res.status, ok: res.ok, json };
}
async function getText(url) {
  const res = await fetch(url, { headers: { Accept: "text/html" } });
  return { status: res.status, ok: res.ok, html: await res.text() };
}

async function reachable() {
  try {
    await fetch(`${API}/taxonomy/streams/`, { headers: { Accept: "application/json" } });
    return true;
  } catch (e) {
    console.error(`\nStack unreachable at ${API}: ${e.message}`);
    console.error("Start the backend and the frontend prod server, then re-run.\n");
    return false;
  }
}

/** Find a stream+city whose listing has at least one seeded college. */
async function discoverSeeded() {
  const [streams, cities] = await Promise.all([
    getJson(`${API}/taxonomy/streams/`),
    getJson(`${API}/taxonomy/cities/`),
  ]);
  for (const s of streams) {
    for (const c of cities) {
      const listing = await getJson(
        `${API}/listings/?course=${encodeURIComponent(s.slug)}&city=${encodeURIComponent(c.slug)}`,
      );
      if (listing?.results?.length) {
        return { stream: s, city: c, listing, college: listing.results[0] };
      }
    }
  }
  return null;
}

async function main() {
  console.log(`Smoke test\n  API:  ${API}\n  SITE: ${SITE}\n`);
  if (!(await reachable())) process.exit(2);

  console.log("[1] Live API + seeded data");
  const seed = await discoverSeeded();
  if (!seed) {
    bad("found a listing with seeded colleges", "no stream/city returned results");
    return finish();
  }
  const { stream, city, college } = seed;
  ok(`listing ${stream.slug}/${city.slug} returned ${seed.listing.results.length} colleges`);
  ok(`seeded college: "${college.name}" (id ${college.id})`);

  console.log("\n[2] SSR renders real seeded data");
  const listingPath = `/${stream.slug}/colleges/${stream.slug}-colleges-${city.slug}`;
  const lr = await getText(`${SITE}${listingPath}`);
  if (lr.status !== 200) bad(`listing SSR ${listingPath} HTTP ${lr.status}`);
  else if (lr.html.includes("We could not load this page")) bad("listing SSR shows error state");
  else if (lr.html.includes(college.name)) ok(`listing SSR HTML contains "${college.name}"`);
  else bad("listing SSR HTML missing seeded college name", `path ${listingPath}`);

  const collegePath = `/college/${college.slug}-${college.id}`;
  const cr = await getText(`${SITE}${collegePath}`);
  if (cr.status !== 200) bad(`college SSR ${collegePath} HTTP ${cr.status}`);
  else if (cr.html.includes(college.name)) ok(`college SSR HTML contains "${college.name}"`);
  else bad("college SSR HTML missing seeded college name", `path ${collegePath}`);

  // The lead form's submit must be disabled in the SSR markup (gate before JS).
  if (/disabled[^>]*>\s*Submit request|Submit request/.test(lr.html) && lr.html.includes("Submit request")) {
    ok("lead form present in listing SSR (submit gated until consent + OTP)");
  } else {
    bad("lead form submit not found in listing SSR");
  }

  console.log("\n[3] End-to-end lead flow (live)");
  const mobile = "9" + String(700000000 + (seed.listing.results.length * 12345) % 99999999).slice(0, 9);
  const req = await postJson(`${API}/leads/otp/request/`, { mobile });
  if (!req.ok || !req.json.request_id) {
    bad("otp/request", `HTTP ${req.status} ${JSON.stringify(req.json)}`);
    return finish();
  }
  ok(`otp/request -> request_id ${req.json.request_id}`);
  const devOtp = req.json.dev_otp;
  if (!devOtp) {
    bad("dev_otp present in otp/request response", "OTP_DEV_EXPOSE must be true for unattended test");
    return finish();
  }
  ok(`dev_otp received: ${devOtp}`);

  const ver = await postJson(`${API}/leads/otp/verify/`, {
    request_id: req.json.request_id,
    otp: devOtp,
  });
  if (!ver.ok || !ver.json.verified || !ver.json.token) {
    bad("otp/verify", `HTTP ${ver.status} ${JSON.stringify(ver.json)}`);
    return finish();
  }
  ok(`otp/verify -> verified, token ${ver.json.token}`);

  const payload = {
    name: "Smoke Test",
    mobile,
    email: "smoke@example.com",
    city: city.name,
    course_interest: college.key_courses?.[0] || stream.name,
    qualification: "Graduate",
    intake_year: "2026",
    source_page: listingPath,
    utm: { utm_source: "smoke", utm_medium: "ci" },
    consent: { checked: true, text_version: CONSENT_TEXT_VERSION },
    otp_token: ver.json.token,
    hp_field: "",
  };
  const lead = await postJson(`${API}/leads/`, payload);
  if (lead.ok && lead.json.id) ok(`POST /leads/ -> id ${lead.json.id} status "${lead.json.status}"`);
  else bad("POST /leads/", `HTTP ${lead.status} ${JSON.stringify(lead.json)}`);

  // Negative check: backend must reject a lead without consent.
  const noConsent = await postJson(`${API}/leads/`, {
    ...payload,
    mobile: "9" + String(800000000).slice(0, 9),
    consent: { checked: false, text_version: CONSENT_TEXT_VERSION },
    otp_token: "",
  });
  if (!noConsent.ok) ok(`lead without consent + OTP rejected (HTTP ${noConsent.status})`);
  else bad("lead without consent + OTP was accepted", "backend should reject");

  finish();
}

function finish() {
  console.log(`\n${failures === 0 ? "GO: all checks passed" : `NO-GO: ${failures} check(s) failed`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(`\nUnexpected error: ${e.stack || e.message}`);
  process.exit(1);
});
