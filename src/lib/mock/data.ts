/**
 * Static fixtures matching the API contract. Used when VITE_USE_MOCK=true so
 * every page renders before the backend is live. All institutions, logos and
 * figures below are fictional placeholders for development and demo only.
 *
 * Demo coverage (Phase: Vercel preview): listings, college details, stream,
 * course and exam pages are generated per stream so every default navigation
 * path shows realistic, full sample data. Colleges are generated deterministically
 * from an id that encodes (stream, city, index), so a card on a listing resolves
 * to a coherent detail page. Edge-case fixtures (zero-result city, all-blocks-empty
 * college, no-logo, very-long-name) stay isolated behind explicit slugs and ids
 * and never appear on a default navigation path.
 */
import type {
  CityLite,
  CollegeCard,
  CollegeDetail,
  CourseDetail,
  CourseFeeRow,
  CourseLite,
  ExamDetail,
  ExamLite,
  FilterOption,
  ListingResponse,
  SearchResults,
  Specialization,
  Stream,
  StreamDetail,
} from "../types";

const PLACEHOLDER_LOGO = "/placeholders/college-logo.svg";
const COVER = "/placeholders/campus-cover.svg";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function titleCase(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export const STREAMS: Stream[] = [
  { id: 1, name: "MBA", slug: "mba", icon: "briefcase", order: 1, course_count: 24 },
  { id: 2, name: "Engineering", slug: "engineering", icon: "cog", order: 2, course_count: 41 },
  { id: 3, name: "Medical", slug: "medical", icon: "heart", order: 3, course_count: 18 },
  { id: 4, name: "Law", slug: "law", icon: "scale", order: 4, course_count: 12 },
  { id: 5, name: "Arts", slug: "arts", icon: "palette", order: 5, course_count: 22 },
  { id: 6, name: "Commerce", slug: "commerce", icon: "chart", order: 6, course_count: 16 },
  { id: 7, name: "Science", slug: "science", icon: "flask", order: 7, course_count: 19 },
  { id: 8, name: "Design", slug: "design", icon: "pen", order: 8, course_count: 9 },
];

export const CITIES: CityLite[] = [
  { id: 1, name: "Varanasi", slug: "varanasi", state: "Uttar Pradesh", tier: 2, college_count: 84 },
  { id: 2, name: "Lucknow", slug: "lucknow", state: "Uttar Pradesh", tier: 2, college_count: 121 },
  { id: 3, name: "Delhi NCR", slug: "delhi-ncr", state: "Delhi", tier: 1, college_count: 410 },
  { id: 4, name: "Noida", slug: "noida", state: "Uttar Pradesh", tier: 1, college_count: 156 },
  { id: 5, name: "Bengaluru", slug: "bengaluru", state: "Karnataka", tier: 1, college_count: 380 },
  { id: 6, name: "Pune", slug: "pune", state: "Maharashtra", tier: 1, college_count: 295 },
];

const STREAM_INDEX: Record<string, number> = Object.fromEntries(
  STREAMS.map((s, i) => [s.slug, i + 1]),
);
const CITY_INDEX: Record<string, number> = Object.fromEntries(
  CITIES.map((c, i) => [c.slug, i]),
);
const CITY_BY_SLUG: Record<string, CityLite> = Object.fromEntries(
  CITIES.map((c) => [c.slug, c]),
);

/* ----------------------------------------------------------------- profiles */

interface StreamProfile {
  /** Builds a plausible college name from a name prefix and a city. */
  name: (prefix: string, city: string) => string;
  prefixes: string[];
  types: string[];
  approvals: string[][];
  feeRanges: string[];
  keyCourses: string[];
  metaFeeRange: string;
  popularCourses: string[];
  filterExams: FilterOption[];
  courses: CourseLite[];
  specializations: Specialization[];
  relatedExams: ExamLite[];
  coursesFees: CourseFeeRow[];
  recruiters: string[];
  overview: (name: string, city: string) => string;
  careerScope: string;
}

const COMMON_TYPES = ["Private", "Government", "Deemed", "Private", "Autonomous", "Private"];

function feeRow(course: string, duration: string, total: string, exams: string[]): CourseFeeRow {
  return {
    course,
    duration,
    total_fee: total,
    eligibility: "Qualifying degree or exam score as specified by the institute",
    exams_accepted: exams,
  };
}
function course(name: string, level: string, duration: string, fee: string): CourseLite {
  return { id: 0, name, slug: slugify(name), level, duration, fee_range: fee };
}
function spec(name: string): Specialization {
  return { id: 0, name, slug: slugify(name) };
}
function exam(name: string, body: string): ExamLite {
  return { id: 0, name, slug: slugify(name), conducting_body: body };
}

const PROFILES: Record<string, StreamProfile> = {
  mba: {
    name: (p, c) => `${p} School of Business, ${c}`,
    prefixes: ["Northbank", "Ganga Valley", "Heritage", "Sunrise", "Meridian", "Crestwood"],
    types: COMMON_TYPES,
    approvals: [["AICTE", "NAAC A"], ["AICTE"], ["UGC", "NAAC A+"], ["AICTE", "NAAC A+", "NBA"], ["AICTE"], ["AICTE", "NAAC A"]],
    feeRanges: ["INR 6.5L - 9.2L", "INR 4.0L - 6.0L", "INR 1.2L - 2.4L", "INR 7.0L - 11.0L", "INR 3.2L - 5.5L", "INR 5.0L - 7.5L"],
    keyCourses: ["MBA", "PGDM", "Executive MBA"],
    metaFeeRange: "INR 1.2L - 11L",
    popularCourses: ["MBA", "PGDM", "Executive MBA", "MBA in Finance"],
    filterExams: [
      { value: "cat", label: "CAT", count: 6 },
      { value: "mat", label: "MAT", count: 5 },
      { value: "xat", label: "XAT", count: 4 },
    ],
    courses: [
      course("MBA / PGDM", "Postgraduate", "2 years", "INR 1.2L - 25L"),
      course("Executive MBA", "Postgraduate", "1 year", "INR 4L - 30L"),
      course("MBA in Finance", "Postgraduate", "2 years", "INR 2L - 22L"),
      course("MBA in Marketing", "Postgraduate", "2 years", "INR 2L - 22L"),
    ],
    specializations: ["Finance", "Marketing", "Human Resources", "Operations", "Business Analytics"].map(spec),
    relatedExams: [exam("CAT", "IIMs"), exam("XAT", "XLRI"), exam("MAT", "AIMA")],
    coursesFees: [
      feeRow("MBA", "2 years", "INR 6.5L", ["CAT", "MAT", "XAT"]),
      feeRow("PGDM", "2 years", "INR 7.2L", ["CAT", "MAT"]),
      feeRow("Executive MBA", "1 year", "INR 9.0L", ["Institute test"]),
    ],
    recruiters: ["Meridian Consulting", "Sample Analytics", "Demo Bank", "Example Retail"],
    overview: (n, c) =>
      `${n} is a management institute in ${c} offering postgraduate programmes with a focus on industry readiness, case based learning and placements. The information below is compiled for comparison and should be confirmed with the institute.`,
    careerScope:
      "Roles span consulting, banking and financial services, product management, marketing, operations and general management.",
  },
  engineering: {
    name: (p, c) => `${c} Institute of Technology${p ? `, ${p} Campus` : ""}`,
    prefixes: ["Riverside", "Greenfield", "Summit", "Lakeview", "Orion", "Pioneer"],
    types: COMMON_TYPES,
    approvals: [["AICTE", "NBA"], ["AICTE"], ["UGC", "NAAC A+"], ["AICTE", "NAAC A+", "NBA"], ["AICTE"], ["AICTE", "NBA"]],
    feeRanges: ["INR 4.0L - 8.0L", "INR 2.5L - 4.0L", "INR 0.8L - 1.6L", "INR 6.0L - 12.0L", "INR 3.0L - 5.0L", "INR 4.5L - 7.0L"],
    keyCourses: ["B.Tech CSE", "B.Tech ECE", "B.Tech Mechanical"],
    metaFeeRange: "INR 0.8L - 12L",
    popularCourses: ["B.Tech CSE", "B.Tech ECE", "B.Tech Mechanical", "M.Tech"],
    filterExams: [
      { value: "jee-main", label: "JEE Main", count: 6 },
      { value: "jee-advanced", label: "JEE Advanced", count: 3 },
      { value: "gate", label: "GATE", count: 4 },
    ],
    courses: [
      course("B.Tech Computer Science", "Undergraduate", "4 years", "INR 2L - 16L"),
      course("B.Tech Electronics", "Undergraduate", "4 years", "INR 2L - 14L"),
      course("B.Tech Mechanical", "Undergraduate", "4 years", "INR 2L - 12L"),
      course("M.Tech", "Postgraduate", "2 years", "INR 1L - 6L"),
    ],
    specializations: ["Computer Science", "Electronics", "Mechanical", "Civil", "Data Science"].map(spec),
    relatedExams: [exam("JEE Main", "NTA"), exam("JEE Advanced", "IITs"), exam("GATE", "IISc and IITs")],
    coursesFees: [
      feeRow("B.Tech Computer Science", "4 years", "INR 6.4L", ["JEE Main"]),
      feeRow("B.Tech Electronics", "4 years", "INR 5.8L", ["JEE Main"]),
      feeRow("M.Tech", "2 years", "INR 2.4L", ["GATE"]),
    ],
    recruiters: ["Demo Systems", "Sample Semiconductors", "Example Software", "Orion Robotics"],
    overview: (n, c) =>
      `${n} is an engineering institute in ${c} offering undergraduate and postgraduate technology programmes with laboratories, project work and campus recruitment. Details are compiled for comparison and should be confirmed with the institute.`,
    careerScope:
      "Graduates work in software, electronics, core engineering, research and product development, with strong campus placement activity.",
  },
  medical: {
    name: (p, c) => `${p} Institute of Medical Sciences, ${c}`,
    prefixes: ["Sapphire", "Lifeline", "Carewell", "Trinity", "Wellspring", "Aravali"],
    types: ["Government", "Private", "Deemed", "Government", "Private", "Deemed"],
    approvals: [["NMC", "NAAC A"], ["NMC"], ["NMC", "UGC"], ["NMC", "NAAC A+"], ["NMC"], ["NMC", "NAAC A"]],
    feeRanges: ["INR 5.0L - 11.0L", "INR 1.0L - 3.0L", "INR 12.0L - 22.0L", "INR 0.6L - 1.5L", "INR 8.0L - 16.0L", "INR 6.0L - 12.0L"],
    keyCourses: ["MBBS", "BDS", "BSc Nursing"],
    metaFeeRange: "INR 0.6L - 22L",
    popularCourses: ["MBBS", "BDS", "BSc Nursing", "MD / MS"],
    filterExams: [
      { value: "neet-ug", label: "NEET UG", count: 6 },
      { value: "neet-pg", label: "NEET PG", count: 3 },
    ],
    courses: [
      course("MBBS", "Undergraduate", "5.5 years", "INR 0.6L - 22L"),
      course("BDS", "Undergraduate", "5 years", "INR 1L - 12L"),
      course("BSc Nursing", "Undergraduate", "4 years", "INR 0.5L - 4L"),
      course("MD / MS", "Postgraduate", "3 years", "INR 2L - 25L"),
    ],
    specializations: ["General Medicine", "Surgery", "Pediatrics", "Orthopaedics", "Radiology"].map(spec),
    relatedExams: [exam("NEET UG", "NTA"), exam("NEET PG", "NBE"), exam("INI CET", "AIIMS")],
    coursesFees: [
      feeRow("MBBS", "5.5 years", "INR 8.5L", ["NEET UG"]),
      feeRow("BDS", "5 years", "INR 4.2L", ["NEET UG"]),
      feeRow("BSc Nursing", "4 years", "INR 1.6L", ["NEET UG", "Institute test"]),
    ],
    recruiters: ["City General Hospital", "Sample Care Network", "Demo Diagnostics", "Wellspring Clinics"],
    overview: (n, c) =>
      `${n} is a medical institute in ${c} offering undergraduate and postgraduate programmes with attached teaching hospital and clinical training. Details are compiled for comparison and should be confirmed with the institute.`,
    careerScope:
      "Graduates pursue clinical practice, hospital roles, postgraduate specialisation and public health, after the required licensing.",
  },
  law: {
    name: (p, c) => `${p} School of Law, ${c}`,
    prefixes: ["Westminster", "Sentinel", "Justitia", "Kautilya", "Beacon", "Aequitas"],
    types: COMMON_TYPES,
    approvals: [["BCI", "NAAC A"], ["BCI"], ["BCI", "UGC"], ["BCI", "NAAC A+"], ["BCI"], ["BCI", "NAAC A"]],
    feeRanges: ["INR 2.0L - 6.0L", "INR 1.2L - 2.5L", "INR 0.6L - 1.2L", "INR 4.0L - 9.0L", "INR 2.5L - 4.5L", "INR 3.0L - 6.0L"],
    keyCourses: ["BA LLB", "LLB", "LLM"],
    metaFeeRange: "INR 0.6L - 9L",
    popularCourses: ["BA LLB", "BBA LLB", "LLB", "LLM"],
    filterExams: [
      { value: "clat", label: "CLAT", count: 5 },
      { value: "ailet", label: "AILET", count: 3 },
      { value: "lsat-india", label: "LSAT India", count: 3 },
    ],
    courses: [
      course("BA LLB", "Undergraduate", "5 years", "INR 1L - 15L"),
      course("BBA LLB", "Undergraduate", "5 years", "INR 1L - 15L"),
      course("LLB", "Undergraduate", "3 years", "INR 0.6L - 6L"),
      course("LLM", "Postgraduate", "1 year", "INR 1L - 5L"),
    ],
    specializations: ["Corporate Law", "Criminal Law", "Constitutional Law", "Intellectual Property", "Taxation"].map(spec),
    relatedExams: [exam("CLAT", "Consortium of NLUs"), exam("AILET", "NLU Delhi"), exam("LSAT India", "Pearson VUE")],
    coursesFees: [
      feeRow("BA LLB", "5 years", "INR 4.5L", ["CLAT", "AILET"]),
      feeRow("LLB", "3 years", "INR 1.8L", ["CLAT", "Institute test"]),
      feeRow("LLM", "1 year", "INR 2.2L", ["CLAT PG"]),
    ],
    recruiters: ["Sample Legal LLP", "Demo Associates", "Meridian Chambers", "Example Compliance"],
    overview: (n, c) =>
      `${n} is a law school in ${c} offering integrated and standalone law programmes with moot courts, internships and placement support. Details are compiled for comparison and should be confirmed with the institute.`,
    careerScope:
      "Graduates enter litigation, corporate law firms, judicial services, compliance and policy roles.",
  },
};

/** Generic profile for the long-tail streams (arts, commerce, science, design). */
function genericProfile(streamSlug: string): StreamProfile {
  const label = STREAMS.find((s) => s.slug === streamSlug)?.name ?? titleCase(streamSlug);
  return {
    name: (p, c) => `${p} College of ${label}, ${c}`,
    prefixes: ["Heritage", "Greenfield", "Sunrise", "Crestwood", "Lakeview", "Pioneer"],
    types: COMMON_TYPES,
    approvals: [["UGC", "NAAC A"], ["UGC"], ["UGC", "NAAC A+"], ["UGC", "NAAC A"], ["UGC"], ["UGC", "NAAC A"]],
    feeRanges: ["INR 0.6L - 1.8L", "INR 1.0L - 2.5L", "INR 0.4L - 1.2L", "INR 1.5L - 3.5L", "INR 0.8L - 2.0L", "INR 1.2L - 2.8L"],
    keyCourses: [`BA ${label}`, `BSc ${label}`, `MA ${label}`],
    metaFeeRange: "INR 0.4L - 3.5L",
    popularCourses: [`BA ${label}`, `BSc ${label}`, `MA ${label}`, `Diploma in ${label}`],
    filterExams: [
      { value: "cuet", label: "CUET", count: 6 },
      { value: "institute-test", label: "Institute test", count: 4 },
    ],
    courses: [
      course(`BA ${label}`, "Undergraduate", "3 years", "INR 0.4L - 3L"),
      course(`BSc ${label}`, "Undergraduate", "3 years", "INR 0.5L - 3L"),
      course(`MA ${label}`, "Postgraduate", "2 years", "INR 0.6L - 3L"),
    ],
    specializations: ["Foundations", "Applied", "Research", "Professional Practice"].map(spec),
    relatedExams: [exam("CUET", "NTA"), exam("Institute Test", "Respective institutes")],
    coursesFees: [
      feeRow(`BA ${label}`, "3 years", "INR 1.2L", ["CUET"]),
      feeRow(`BSc ${label}`, "3 years", "INR 1.4L", ["CUET"]),
      feeRow(`MA ${label}`, "2 years", "INR 1.6L", ["CUET", "Institute test"]),
    ],
    recruiters: ["Sample Studio", "Demo Media", "Example Foundation", "Meridian Labs"],
    overview: (n, c) =>
      `${n} is a ${label.toLowerCase()} college in ${c} offering undergraduate and postgraduate programmes with strong fundamentals and project work. Details are compiled for comparison and should be confirmed with the institute.`,
    careerScope: `Graduates pursue further study, research, teaching and applied roles across the ${label.toLowerCase()} sector.`,
  };
}

function profileFor(streamSlug: string): StreamProfile {
  return PROFILES[streamSlug] ?? genericProfile(streamSlug);
}

/* --------------------------------------------------- deterministic colleges */

const PER_LISTING = 9;

function streamFromId(id: number): { streamSlug: string; citySlug: string; index: number } | null {
  if (id < 100000) return null;
  const streamIdx = Math.floor(id / 100000);
  const rest = id % 100000;
  const cityIdx = Math.floor(rest / 100);
  const index = rest % 100;
  const stream = STREAMS[streamIdx - 1];
  const city = CITIES[cityIdx];
  if (!stream || !city) return null;
  return { streamSlug: stream.slug, citySlug: city.slug, index };
}

function genCollegeCard(streamSlug: string, citySlug: string, index: number): CollegeCard {
  const p = profileFor(streamSlug);
  const cityName = CITY_BY_SLUG[citySlug]?.name ?? titleCase(citySlug);
  const prefix = p.prefixes[index % p.prefixes.length];
  const name = p.name(prefix, cityName);
  const streamIdx = STREAM_INDEX[streamSlug] ?? 9;
  const cityIdx = CITY_INDEX[citySlug] ?? 0;
  const id = streamIdx * 100000 + cityIdx * 100 + index;
  const rating = Math.min(4.7, Math.round((3.8 + index * 0.11) * 10) / 10);
  return {
    id,
    slug: slugify(name),
    name,
    city: cityName,
    logo: PLACEHOLDER_LOGO,
    key_courses: p.keyCourses.slice(0, 2 + (index % 2)),
    fee_range: p.feeRanges[index % p.feeRanges.length],
    approvals: p.approvals[index % p.approvals.length],
    rating,
    type: p.types[index % p.types.length],
  };
}

function generateColleges(streamSlug: string, citySlug: string, count = PER_LISTING): CollegeCard[] {
  return Array.from({ length: count }, (_, i) => genCollegeCard(streamSlug, citySlug, i));
}

/* ------------------------------------------------------------------ filters */

const APPROVAL_FILTERS: FilterOption[] = [
  { value: "naac-a", label: "NAAC A", count: 5 },
  { value: "naac-a+", label: "NAAC A+", count: 3 },
  { value: "ugc", label: "UGC", count: 4 },
];
const TYPE_FILTERS: FilterOption[] = [
  { value: "private", label: "Private", count: 5 },
  { value: "government", label: "Government", count: 2 },
  { value: "deemed", label: "Deemed", count: 2 },
];
const FEE_BUCKETS: FilterOption[] = [
  { value: "0-200000", label: "Under INR 2L" },
  { value: "200000-500000", label: "INR 2L - 5L" },
  { value: "500000-1000000", label: "INR 5L - 10L" },
  { value: "1000000-", label: "Above INR 10L" },
];

function faqsFor(courseLabel: string, cityLabel: string): { q: string; a: string }[] {
  return [
    {
      q: `How many ${courseLabel} colleges are there in ${cityLabel}?`,
      a: `Our directory lists dozens of ${courseLabel} institutes in ${cityLabel} across government, private and deemed categories. Use the filters to narrow by fees, approval and accepted exam.`,
    },
    {
      q: `What is the typical fee range for ${courseLabel} in ${cityLabel}?`,
      a: `Programme fees in ${cityLabel} vary widely between government and private institutes. Compare the indicative fee range on each college page before deciding.`,
    },
    {
      q: `Which entrance exams are accepted by ${courseLabel} colleges in ${cityLabel}?`,
      a: `Most institutes accept the common national or state entrance exams for this field. Check each college page for its accepted exams.`,
    },
    {
      q: "Are the listed fees official?",
      a: "Fee ranges are indicative and compiled for comparison. Always confirm the current fee with the institute before taking any decision.",
    },
  ];
}

/* ------------------------------------------------------ edge-case fixtures */

function card(
  id: number,
  name: string,
  city: string,
  type: string,
  fee: string,
  rating: number,
  approvals: string[],
  courses: string[],
): CollegeCard {
  return { id, slug: slugify(name), name, city, logo: PLACEHOLDER_LOGO, key_courses: courses, fee_range: fee, approvals, rating, type };
}

const LONG_NAME_CARD: CollegeCard = card(
  91,
  "International Institute of Advanced Management Studies and Postgraduate Research in Business Administration",
  "Greater Visakhapatnam Metropolitan Region",
  "Private",
  "INR 8.0L - 14.5L",
  4.2,
  ["AICTE", "NAAC A+", "NBA"],
  ["MBA", "PGDM in Business Analytics and Artificial Intelligence Applications"],
);
const NO_LOGO_CARD: CollegeCard = {
  ...card(92, "Riverside Polytechnic and Management College", "Noida", "Private", "INR 2.5L - 4.0L", 3.9, ["AICTE"], ["MBA"]),
  logo: "",
};
const EDGE_CARDS: CollegeCard[] = [LONG_NAME_CARD, NO_LOGO_CARD];

/* ----------------------------------------------------- contract: taxonomy */

export const STREAM_DETAIL: Record<string, StreamDetail> = {};

export function buildStreamDetail(slug: string): StreamDetail {
  const stream =
    STREAMS.find((s) => s.slug === slug) ?? {
      id: 0,
      name: titleCase(slug),
      slug,
      icon: "book",
      order: 99,
      course_count: 0,
    };
  const p = profileFor(slug);
  return { stream, courses: p.courses, top_cities: CITIES };
}

/* ------------------------------------------------------- contract: courses */

interface CourseIndexEntry {
  streamSlug: string;
  course: CourseLite;
}
const COURSE_INDEX: Record<string, CourseIndexEntry> = {};
for (const s of STREAMS) {
  const p = profileFor(s.slug);
  for (const c of p.courses) COURSE_INDEX[c.slug] = { streamSlug: s.slug, course: c };
}

export const COURSE_DETAIL: Record<string, CourseDetail> = {};

export function buildCourseDetail(slug: string): CourseDetail {
  const entry = COURSE_INDEX[slug];
  const streamSlug = entry?.streamSlug ?? "mba";
  const p = profileFor(streamSlug);
  const c = entry?.course ?? p.courses[0];
  const cityDefault = "varanasi";
  return {
    course: {
      id: 0,
      name: c.name,
      slug,
      level: c.level ?? "Postgraduate",
      duration: c.duration ?? "2 years",
      description: `${c.name} is a ${(c.level ?? "postgraduate").toLowerCase()} programme. It builds the knowledge and practical skills needed for a career in this field, through coursework, projects and supervised practice.`,
      eligibility:
        "A qualifying degree or examination as specified by each institute, with the minimum aggregate the institute sets. Final year students can usually apply provisionally.",
      career_scope: p.careerScope,
      fee_range: c.fee_range ?? p.metaFeeRange,
    },
    specializations: p.specializations,
    related_exams: p.relatedExams,
    top_colleges: generateColleges(streamSlug, cityDefault, 4),
  };
}

/* --------------------------------------------------------- contract: exams */

interface ExamSeed {
  streamSlug: string;
  name: string;
  body: string;
  overview: string;
  eligibility: string;
  pattern: string;
  syllabus: string[];
  dates: { label: string; date: string }[];
}
const STANDARD_DATES = [
  { label: "Registration opens", date: "August" },
  { label: "Admit card", date: "November" },
  { label: "Exam day", date: "December" },
  { label: "Results", date: "January" },
];
const EXAM_SEEDS: Record<string, ExamSeed> = {
  cat: {
    streamSlug: "mba",
    name: "CAT",
    body: "Indian Institutes of Management (IIMs)",
    overview:
      "The Common Admission Test is a computer based test used by the IIMs and several hundred other management institutes for admission to MBA and PGDM programmes.",
    eligibility: "A bachelor's degree with at least 50 percent aggregate, 45 percent for reserved categories. Final year students may also apply.",
    pattern: "Three sections: Verbal Ability and Reading Comprehension, Data Interpretation and Logical Reasoning, and Quantitative Ability. The test runs for two hours.",
    syllabus: ["Verbal Ability and Reading Comprehension", "Data Interpretation and Logical Reasoning", "Quantitative Ability"],
    dates: STANDARD_DATES,
  },
  "jee-main": {
    streamSlug: "engineering",
    name: "JEE Main",
    body: "National Testing Agency (NTA)",
    overview:
      "The Joint Entrance Examination Main is a national engineering entrance test for admission to undergraduate technology programmes and a qualifier for JEE Advanced.",
    eligibility: "Passed or appearing in class 12 with Physics, Chemistry and Mathematics. Age and attempt limits as notified each year.",
    pattern: "Computer based test with Mathematics, Physics and Chemistry. Multiple choice and numerical questions across two sessions in a year.",
    syllabus: ["Mathematics", "Physics", "Chemistry"],
    dates: [
      { label: "Session 1 registration", date: "November" },
      { label: "Session 1 exam", date: "January" },
      { label: "Session 2 exam", date: "April" },
      { label: "Results", date: "April" },
    ],
  },
  "neet-ug": {
    streamSlug: "medical",
    name: "NEET UG",
    body: "National Testing Agency (NTA)",
    overview:
      "The National Eligibility cum Entrance Test is the single national entrance examination for admission to MBBS, BDS and allied undergraduate medical programmes.",
    eligibility: "Passed or appearing in class 12 with Physics, Chemistry and Biology and the minimum marks notified each year.",
    pattern: "Pen and paper test with Physics, Chemistry and Biology, Botany and Zoology. Duration of three hours and twenty minutes.",
    syllabus: ["Physics", "Chemistry", "Botany", "Zoology"],
    dates: [
      { label: "Registration opens", date: "February" },
      { label: "Admit card", date: "April" },
      { label: "Exam day", date: "May" },
      { label: "Results", date: "June" },
    ],
  },
  clat: {
    streamSlug: "law",
    name: "CLAT",
    body: "Consortium of National Law Universities",
    overview:
      "The Common Law Admission Test is a national entrance examination for admission to integrated undergraduate and postgraduate law programmes at the National Law Universities and many other institutes.",
    eligibility: "Class 12 with the minimum aggregate notified for the undergraduate test. A law degree is required for the postgraduate test.",
    pattern: "Comprehension based test covering English, Current Affairs, Legal Reasoning, Logical Reasoning and Quantitative Techniques.",
    syllabus: ["English Language", "Current Affairs and General Knowledge", "Legal Reasoning", "Logical Reasoning", "Quantitative Techniques"],
    dates: [
      { label: "Registration opens", date: "July" },
      { label: "Admit card", date: "November" },
      { label: "Exam day", date: "December" },
      { label: "Results", date: "December" },
    ],
  },
};

export const EXAM_DETAIL: Record<string, ExamDetail> = {};

export function buildExamDetail(slug: string): ExamDetail {
  const seed =
    EXAM_SEEDS[slug] ??
    (() => {
      const name = titleCase(slug.replace(/-exam$/, ""));
      return {
        streamSlug: "mba",
        name,
        body: "Respective conducting authority",
        overview: `${name} is an entrance examination used by institutes for admission. Details below are indicative and should be confirmed with the official authority.`,
        eligibility: "As specified by the conducting authority for the relevant programme.",
        pattern: "A structured test across the relevant subject areas. Confirm the latest pattern with the official notification.",
        syllabus: ["Core subjects", "Aptitude", "General awareness"],
        dates: STANDARD_DATES,
      } as ExamSeed;
    })();
  return {
    exam: {
      id: 0,
      name: seed.name,
      slug,
      conducting_body: seed.body,
      overview: seed.overview,
      eligibility: seed.eligibility,
      pattern: seed.pattern,
      syllabus: seed.syllabus,
      important_dates: seed.dates,
    },
    accepting_colleges: generateColleges(seed.streamSlug, "delhi-ncr", 5),
  };
}

/* ------------------------------------------------------- contract: listing */

export function buildListing(course: string, city: string): ListingResponse {
  const streamSlug = course || "mba";
  const courseLabel = titleCase(course);
  const cityLabel = titleCase(city);
  const p = profileFor(streamSlug);

  // Edge-case city slugs let QA reach sparse result sets. Never on a default path.
  let results: CollegeCard[];
  if (city === "emptyville") results = [];
  else if (city === "onlyone") results = [genCollegeCard(streamSlug, "varanasi", 0)];
  else if (city === "longtown") results = [LONG_NAME_CARD, NO_LOGO_CARD, ...generateColleges(streamSlug, "noida", 4)];
  else results = generateColleges(streamSlug, city, PER_LISTING);

  const total = results.length;
  return {
    meta: {
      course: courseLabel,
      city: cityLabel,
      total_colleges: total,
      fee_range: total ? p.metaFeeRange : "Not available yet",
      popular_courses: p.popularCourses,
      intro: total
        ? `Compare ${courseLabel} colleges in ${cityLabel} by fees, approvals, accepted exams and student rating. Our directory lists ${total} institutes offering ${courseLabel} programmes, with full course and fee detail on each college page.`
        : `We are still adding ${courseLabel} colleges in ${cityLabel}. Explore nearby cities or other courses while we expand this list.`,
    },
    filters: {
      types: TYPE_FILTERS,
      exams: p.filterExams,
      approvals: APPROVAL_FILTERS,
      fee_buckets: FEE_BUCKETS,
    },
    results,
    pagination: { page: 1, page_size: 6, total, has_next: total > 6 },
    faqs: total ? faqsFor(courseLabel, cityLabel) : [],
  };
}

/* ------------------------------------------------------- contract: college */

export function buildCollegeDetail(slug: string, id: number): CollegeDetail {
  // Resolve the source card: generated (id encodes stream/city), edge, or default.
  let found: CollegeCard;
  let streamSlug = "mba";
  const decoded = streamFromId(id);
  if (decoded) {
    streamSlug = decoded.streamSlug;
    found = genCollegeCard(decoded.streamSlug, decoded.citySlug, decoded.index);
  } else {
    found = EDGE_CARDS.find((c) => c.id === id) ?? genCollegeCard("mba", "varanasi", 0);
  }
  const p = profileFor(streamSlug);
  const name = found.name;
  const cityState = CITIES.find((c) => c.name === found.city)?.state ?? "India";

  const detail: CollegeDetail = {
    header: {
      id,
      slug,
      name,
      short_name: name.split(" ").slice(0, 2).join(" "),
      city: found.city,
      state: cityState,
      logo: found.logo,
      cover: COVER,
      type: found.type,
      established: 1998 + (id % 20),
      approvals: found.approvals,
      rating: found.rating,
      review_count: 120 + (id % 200),
    },
    overview: {
      description: p.overview(name, found.city),
      highlights: [
        "Industry mentored projects and practical training",
        "Dedicated career services and placement cell",
        "Active alumni network across sectors",
        "Modern campus, labs and library",
      ],
      campus_size: "12 acres",
      website: "https://example.edu",
    },
    courses_fees: p.coursesFees,
    admissions: {
      process:
        "Admission is based on a valid entrance score followed by the institute's selection process. Shortlists are published in stages.",
      eligibility:
        "A recognised qualifying degree or class 12 as applicable, with the minimum aggregate set by the institute and a valid entrance score.",
      important_dates: [
        { label: "Applications open", date: "October" },
        { label: "Last date to apply", date: "February" },
        { label: "Selection rounds", date: "March to April" },
        { label: "Session begins", date: "July" },
      ],
      accepted_exams: p.relatedExams.map((e) => e.name),
    },
    placements: [
      {
        year: "2025",
        highest_package: "INR 24.0 LPA",
        average_package: "INR 8.6 LPA",
        median_package: "INR 7.9 LPA",
        top_recruiters: p.recruiters,
        placement_rate: "92 percent",
      },
      {
        year: "2024",
        highest_package: "INR 21.5 LPA",
        average_package: "INR 8.1 LPA",
        median_package: "INR 7.4 LPA",
        top_recruiters: p.recruiters.slice(0, 3),
        placement_rate: "90 percent",
      },
    ],
    rankings: [
      { agency: "Sample Rankings", rank: "#34", category: `${profileFor(streamSlug).courses[0].name} institutes`, year: "2025" },
      { agency: "Demo Survey", rank: "#12", category: "North India", year: "2025" },
    ],
    cutoffs: p.relatedExams.slice(0, 2).map((e, i) => ({
      exam: e.name,
      category: "General",
      round: "Round 1",
      cutoff: i === 0 ? "Top percentile" : "Qualifying score",
      year: "2025",
    })),
    media: [
      { type: "image", url: COVER, caption: "Campus" },
      { type: "image", url: COVER, caption: "Library" },
      { type: "image", url: COVER, caption: "Auditorium" },
    ],
    contact: {
      address: "Placeholder Campus Road",
      city: found.city,
      state: cityState,
      pincode: "221005",
      phone: "",
      email: "",
      latitude: 25.3176,
      longitude: 82.9739,
    },
    operator_disclosure:
      "This page is maintained by AAJneeti Connect Ltd. as part of an independent education discovery platform. We are not affiliated with this institution unless explicitly stated. Information is compiled for comparison and should be verified with the institute.",
  };

  // Sparse edge-case college (testing only, reachable solely by id 90).
  if (id === 90) {
    detail.header.review_count = 0;
    detail.overview.highlights = [];
    detail.overview.campus_size = undefined;
    detail.overview.website = undefined;
    detail.courses_fees = [];
    detail.placements = [];
    detail.rankings = [];
    detail.cutoffs = [];
    detail.media = [];
    detail.overview.description = `${name} is a newly listed institute. We are still compiling its courses, fees, placements and other details. Please confirm directly with the institute.`;
  }
  return detail;
}

/* --------------------------------------------------------- contract: search */

const SEARCH_COLLEGES: CollegeCard[] = [
  ...generateColleges("mba", "varanasi", 3),
  ...generateColleges("engineering", "lucknow", 3),
  ...generateColleges("medical", "delhi-ncr", 2),
  ...generateColleges("law", "noida", 2),
];
const SEARCH_COURSES = Object.values(COURSE_INDEX).map((e) => e.course);
const SEARCH_EXAMS: ExamLite[] = Array.from(
  new Map(
    STREAMS.flatMap((s) => profileFor(s.slug).relatedExams).map((e) => [e.slug, e]),
  ).values(),
);

export function buildSearch(q: string): SearchResults {
  const ql = q.toLowerCase().trim();
  const match = (s: string) => ql.length < 2 || s.toLowerCase().includes(ql);
  return {
    colleges: SEARCH_COLLEGES.filter((c) => match(c.name) || match(c.city))
      .slice(0, 6)
      .map((c) => ({ id: c.id, slug: c.slug, name: c.name, city: c.city, type: c.type })),
    courses: SEARCH_COURSES.filter((c) => match(c.name))
      .slice(0, 6)
      .map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    exams: SEARCH_EXAMS.filter((e) => match(e.name))
      .slice(0, 6)
      .map((e) => ({ id: e.id, slug: e.slug, name: e.name })),
  };
}
