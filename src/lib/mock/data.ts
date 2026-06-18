/**
 * Static fixtures matching the API contract. Used when VITE_USE_MOCK=true so
 * every page renders before the backend is live. All institutions, logos and
 * figures below are fictional placeholders for development only.
 */
import type {
  CityLite,
  CollegeCard,
  CollegeDetail,
  CourseDetail,
  ExamDetail,
  ListingResponse,
  SearchResults,
  Stream,
  StreamDetail,
} from "../types";

const PLACEHOLDER_LOGO = "/placeholders/college-logo.svg";

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
  return {
    id,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    name,
    city,
    logo: PLACEHOLDER_LOGO,
    key_courses: courses,
    fee_range: fee,
    approvals,
    rating,
    type,
  };
}

export const COLLEGE_CARDS: CollegeCard[] = [
  card(42, "Northbank Institute of Management", "Varanasi", "Private", "INR 6.5L - 9.2L", 4.3, ["AICTE", "NAAC A"], ["MBA", "PGDM"]),
  card(43, "Ganga Valley Business School", "Varanasi", "Private", "INR 4.0L - 6.0L", 4.0, ["AICTE"], ["MBA", "Executive MBA"]),
  card(44, "Kashi Government College of Management", "Varanasi", "Govt", "INR 1.2L - 2.4L", 4.1, ["UGC", "NAAC A+"], ["MBA"]),
  card(45, "Sarnath Deemed University, School of Business", "Varanasi", "Deemed", "INR 7.0L - 11.0L", 4.4, ["AICTE", "NAAC A+", "NBA"], ["MBA", "PGDM", "MBA (Analytics)"]),
  card(46, "Riverstone Management Academy", "Varanasi", "Private", "INR 3.2L - 5.5L", 3.8, ["AICTE"], ["PGDM"]),
  card(47, "Heritage School of Commerce and Management", "Varanasi", "Private", "INR 5.0L - 7.5L", 4.2, ["AICTE", "NAAC A"], ["MBA", "MBA (Finance)"]),
];

export const STREAM_DETAIL: Record<string, StreamDetail> = {
  mba: {
    stream: STREAMS[0],
    courses: [
      { id: 101, name: "MBA / PGDM", slug: "mba-pgdm", level: "Postgraduate", duration: "2 years", fee_range: "INR 1.2L - 25L" },
      { id: 102, name: "Executive MBA", slug: "executive-mba", level: "Postgraduate", duration: "1 year", fee_range: "INR 4L - 30L" },
      { id: 103, name: "MBA in Finance", slug: "mba-finance", level: "Postgraduate", duration: "2 years", fee_range: "INR 2L - 22L" },
      { id: 104, name: "MBA in Marketing", slug: "mba-marketing", level: "Postgraduate", duration: "2 years", fee_range: "INR 2L - 22L" },
    ],
    top_cities: CITIES,
  },
};

export const COURSE_DETAIL: Record<string, CourseDetail> = {
  "mba-pgdm": {
    course: {
      id: 101,
      name: "MBA / PGDM",
      slug: "mba-pgdm",
      level: "Postgraduate",
      duration: "2 years (full time)",
      description:
        "A Master of Business Administration is a postgraduate management degree that builds skills across finance, marketing, operations, strategy and people management. A PGDM is an industry-oriented diploma equivalent offered by autonomous institutes.",
      eligibility:
        "A bachelor's degree in any discipline with a minimum aggregate set by each institute, typically 50 percent. Final year students are usually eligible to apply provisionally.",
      career_scope:
        "Roles span consulting, banking and financial services, product management, marketing, operations and general management. Specialisations let candidates align with a target sector.",
      fee_range: "INR 1.2L - 25L for the full programme",
    },
    specializations: [
      { id: 1, name: "Finance", slug: "finance" },
      { id: 2, name: "Marketing", slug: "marketing" },
      { id: 3, name: "Human Resources", slug: "human-resources" },
      { id: 4, name: "Operations", slug: "operations" },
      { id: 5, name: "Business Analytics", slug: "business-analytics" },
    ],
    related_exams: [
      { id: 1, name: "CAT", slug: "cat", conducting_body: "IIMs" },
      { id: 2, name: "XAT", slug: "xat", conducting_body: "XLRI" },
      { id: 3, name: "MAT", slug: "mat", conducting_body: "AIMA" },
    ],
    top_colleges: COLLEGE_CARDS.slice(0, 4),
  },
};

export const EXAM_DETAIL: Record<string, ExamDetail> = {
  cat: {
    exam: {
      id: 1,
      name: "CAT",
      slug: "cat",
      conducting_body: "Indian Institutes of Management (IIMs)",
      overview:
        "The Common Admission Test is a computer based test used by the IIMs and several hundred other management institutes for admission to MBA and PGDM programmes.",
      eligibility:
        "A bachelor's degree with at least 50 percent aggregate (45 percent for reserved categories). Candidates in their final year may also apply.",
      pattern:
        "Three sections: Verbal Ability and Reading Comprehension, Data Interpretation and Logical Reasoning, and Quantitative Ability. The test runs for two hours.",
      syllabus: [
        "Verbal Ability and Reading Comprehension",
        "Data Interpretation and Logical Reasoning",
        "Quantitative Ability",
      ],
      important_dates: [
        { label: "Registration opens", date: "August" },
        { label: "Admit card", date: "November" },
        { label: "Exam day", date: "Late November" },
        { label: "Results", date: "January" },
      ],
    },
    accepting_colleges: COLLEGE_CARDS.slice(0, 5),
  },
};

const FAQS = [
  {
    q: "How many MBA colleges are there in Varanasi?",
    a: "Our directory currently lists dozens of MBA and PGDM institutes in Varanasi across government, private and deemed categories. Use the filters to narrow by fees, approval and accepted exam.",
  },
  {
    q: "What is the typical fee range for an MBA in Varanasi?",
    a: "Programme fees in Varanasi commonly range from about INR 1.2 lakh at government institutes to around INR 11 lakh at deemed universities for the full two year programme.",
  },
  {
    q: "Which entrance exams are accepted by MBA colleges in Varanasi?",
    a: "Most institutes accept CAT, MAT and XAT scores. Some also consider state level and institute level tests. Check each college page for its accepted exams.",
  },
  {
    q: "Are the listed fees official?",
    a: "Fee ranges are indicative and compiled for comparison. Always confirm the current fee with the institute before taking any decision.",
  },
];

export function buildListing(course: string, city: string): ListingResponse {
  const courseLabel = course
    .split("-")
    .map((w) => w.toUpperCase())
    .join(" ");
  const cityLabel = city
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
  return {
    meta: {
      course: courseLabel,
      city: cityLabel,
      total_colleges: COLLEGE_CARDS.length,
      fee_range: "INR 1.2L - 11L",
      popular_courses: ["MBA", "PGDM", "Executive MBA", "MBA in Finance"],
      intro: `Compare ${courseLabel} colleges in ${cityLabel} by fees, approvals, accepted exams and student rating. Our directory lists ${COLLEGE_CARDS.length} institutes offering ${courseLabel} programmes, with full course and fee detail on each college page.`,
    },
    filters: {
      types: [
        { value: "govt", label: "Government", count: 1 },
        { value: "private", label: "Private", count: 4 },
        { value: "deemed", label: "Deemed", count: 1 },
      ],
      exams: [
        { value: "cat", label: "CAT", count: 5 },
        { value: "mat", label: "MAT", count: 4 },
        { value: "xat", label: "XAT", count: 3 },
      ],
      approvals: [
        { value: "aicte", label: "AICTE", count: 5 },
        { value: "naac-a", label: "NAAC A", count: 3 },
        { value: "ugc", label: "UGC", count: 1 },
      ],
      fee_buckets: [
        { value: "0-200000", label: "Under INR 2L" },
        { value: "200000-500000", label: "INR 2L - 5L" },
        { value: "500000-1000000", label: "INR 5L - 10L" },
        { value: "1000000-", label: "Above INR 10L" },
      ],
    },
    results: COLLEGE_CARDS,
    pagination: { page: 1, page_size: 4, total: COLLEGE_CARDS.length, has_next: true },
    faqs: FAQS,
  };
}

export function buildCollegeDetail(slug: string, id: number): CollegeDetail {
  const found = COLLEGE_CARDS.find((c) => c.id === id) ?? COLLEGE_CARDS[0];
  const name = found.name;
  return {
    header: {
      id,
      slug,
      name,
      short_name: name.split(" ").slice(0, 2).join(" "),
      city: found.city,
      state: "Uttar Pradesh",
      logo: PLACEHOLDER_LOGO,
      cover: "/placeholders/campus-cover.svg",
      type: found.type,
      established: 1998,
      approvals: found.approvals,
      rating: found.rating,
      review_count: 214,
    },
    overview: {
      description: `${name} is a ${found.type.toLowerCase()} management institute in ${found.city}. It offers postgraduate management programmes with a focus on industry readiness, case based learning and placements. The information below is compiled for comparison and should be confirmed with the institute.`,
      highlights: [
        "Industry mentored capstone projects",
        "Dedicated career services cell",
        "Active alumni network across sectors",
        "On campus and virtual recruitment drives",
      ],
      campus_size: "12 acres",
      website: "https://example.edu",
    },
    courses_fees: [
      {
        course: "MBA",
        duration: "2 years",
        total_fee: "INR 6.5L",
        eligibility: "Bachelor's degree with 50 percent and a valid entrance score",
        exams_accepted: ["CAT", "MAT", "XAT"],
      },
      {
        course: "PGDM",
        duration: "2 years",
        total_fee: "INR 7.2L",
        eligibility: "Bachelor's degree with 50 percent and a valid entrance score",
        exams_accepted: ["CAT", "MAT"],
      },
      {
        course: "Executive MBA",
        duration: "1 year",
        total_fee: "INR 9.0L",
        eligibility: "Bachelor's degree with 3 years of work experience",
        exams_accepted: ["Institute test"],
      },
    ],
    admissions: {
      process:
        "Admission is based on a valid entrance exam score followed by a written ability test and personal interview conducted by the institute. Shortlists are published in stages.",
      eligibility:
        "A recognised bachelor's degree with a minimum aggregate of 50 percent and a qualifying score in an accepted entrance exam.",
      important_dates: [
        { label: "Applications open", date: "October" },
        { label: "Last date to apply", date: "February" },
        { label: "Interviews", date: "March to April" },
        { label: "Session begins", date: "July" },
      ],
      accepted_exams: ["CAT", "MAT", "XAT"],
    },
    placements: [
      {
        year: "2025",
        highest_package: "INR 24.0 LPA",
        average_package: "INR 8.6 LPA",
        median_package: "INR 7.9 LPA",
        top_recruiters: ["Placeholder Corp", "Sample Analytics", "Demo Bank", "Example Retail"],
        placement_rate: "92 percent",
      },
      {
        year: "2024",
        highest_package: "INR 21.5 LPA",
        average_package: "INR 8.1 LPA",
        median_package: "INR 7.4 LPA",
        top_recruiters: ["Placeholder Corp", "Sample Analytics", "Demo Bank"],
        placement_rate: "90 percent",
      },
    ],
    rankings: [
      { agency: "Sample Rankings", rank: "#34", category: "Private B-Schools", year: "2025" },
      { agency: "Demo Survey", rank: "#12", category: "North India", year: "2025" },
    ],
    cutoffs: [
      { exam: "CAT", category: "General", round: "Round 1", cutoff: "78 percentile", year: "2025" },
      { exam: "MAT", category: "General", round: "Round 1", cutoff: "650", year: "2025" },
    ],
    media: [
      { type: "image", url: "/placeholders/campus-cover.svg", caption: "Campus" },
      { type: "image", url: "/placeholders/campus-cover.svg", caption: "Library" },
      { type: "image", url: "/placeholders/campus-cover.svg", caption: "Auditorium" },
    ],
    contact: {
      address: "Placeholder Campus Road",
      city: found.city,
      state: "Uttar Pradesh",
      pincode: "221005",
      phone: "",
      email: "",
      latitude: 25.3176,
      longitude: 82.9739,
    },
    operator_disclosure:
      "This page is maintained by AAJneeti Connect Ltd. as part of an independent education discovery platform. We are not affiliated with this institution unless explicitly stated. Information is compiled for comparison and should be verified with the institute.",
  };
}

export function buildSearch(q: string): SearchResults {
  const ql = q.toLowerCase();
  return {
    colleges: COLLEGE_CARDS.filter((c) => c.name.toLowerCase().includes(ql))
      .slice(0, 6)
      .map((c) => ({ id: c.id, slug: c.slug, name: c.name, city: c.city, type: c.type })),
    courses: STREAM_DETAIL.mba.courses
      .filter((c) => c.name.toLowerCase().includes(ql) || ql.length < 2)
      .slice(0, 5)
      .map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    exams: COURSE_DETAIL["mba-pgdm"].related_exams
      .filter((e) => e.name.toLowerCase().includes(ql) || ql.length < 2)
      .slice(0, 5)
      .map((e) => ({ id: e.id, slug: e.slug, name: e.name })),
  };
}
