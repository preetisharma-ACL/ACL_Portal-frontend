/**
 * Types mirroring the backend API contract. Hand-typed from the contract in the
 * build brief; if an openapi.json is published these can be regenerated.
 */

export interface Stream {
  id: number;
  name: string;
  slug: string;
  icon: string;
  order: number;
  course_count: number;
}

export interface CityLite {
  id: number;
  name: string;
  slug: string;
  state: string;
  tier: number;
  college_count: number;
}

export interface CourseLite {
  id: number;
  name: string;
  slug: string;
  level?: string;
  duration?: string;
  fee_range?: string;
}

export interface StreamDetail {
  stream: Stream;
  courses: CourseLite[];
  top_cities: CityLite[];
}

export interface Specialization {
  id: number;
  name: string;
  slug: string;
}

export interface ExamLite {
  id: number;
  name: string;
  slug: string;
  conducting_body?: string;
}

export interface CollegeCard {
  id: number;
  slug: string;
  name: string;
  city: string;
  logo: string;
  key_courses: string[];
  fee_range: string;
  approvals: string[];
  rating: number;
  type: string;
  /** Optional per-college cover image, if the listing API ever provides one.
   *  When absent, the card uses a per-college neutral gradient (never a shared
   *  stock photo). */
  hero_image?: string;
  /** NIRF ranking, when the listing provides it (used by the directory). */
  nirf_rank?: { agency: string; rank: number; year: number; category: string } | null;
  /** Highest placement package, when provided. */
  highest_package?: string | null;
  /** Number of published reviews, when provided. */
  review_count?: number;
}

export interface CourseDetail {
  course: {
    id: number;
    name: string;
    slug: string;
    level: string;
    stream?: string;
    stream_slug?: string;
    overview: string;
    description: string;
    eligibility: string;
    duration: string;
    career_scope: string;
    /** Native backend shape is {min,max}; formatFeeRange handles it for display. */
    fee_range: { min?: number | null; max?: number | null } | string | null;
    job_roles?: string[];
    top_recruiters?: string[];
    average_salary?: string;
  };
  specializations: Specialization[];
  related_exams: ExamLite[];
  top_colleges: CollegeCard[];
}

export interface ExamDetail {
  exam: {
    id: number;
    name: string;
    slug: string;
    level?: string;
    conducting_body: string;
    overview: string;
    eligibility: string;
    pattern: string;
    mode?: string;
    frequency?: string;
    syllabus: string[];
    important_dates: { label: string; date: string }[];
  };
  accepting_colleges: CollegeCard[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface ListingMeta {
  course: string;
  city: string;
  total_colleges: number;
  fee_range: string;
  /** Courses available in this listing/city, with backend slugs for filtering. */
  popular_courses: { name: string; slug: string }[];
  intro?: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface ListingFilters {
  types: FilterOption[];
  exams: FilterOption[];
  approvals: FilterOption[];
  fee_buckets: FilterOption[];
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
}

export interface ListingResponse {
  meta: ListingMeta;
  filters: ListingFilters;
  results: CollegeCard[];
  pagination: Pagination;
  faqs: Faq[];
}

export interface ListingQuery {
  course?: string;
  city?: string;
  type?: string;
  fees_min?: string;
  fees_max?: string;
  exam?: string;
  approval?: string;
  sort?: string;
  page?: string;
}

export interface CourseFeeRow {
  course: string;
  duration: string;
  total_fee: string;
  eligibility: string;
  exams_accepted: string[];
}

/** Placements block (backend shape: { summary, recruiters, highlights }).
 *  Package figures are formatted strings ("" when null); the section hides when
 *  there is nothing to show. */
export interface PlacementsBlock {
  summary: {
    year: number | null;
    highest_package: string;
    average_package: string;
    median_package: string;
    placement_percentage: number | null;
    students_placed: number | null;
    recruiters_count: number | null;
  };
  recruiters: string[];
  highlights: string[];
}

export interface RankingRow {
  agency: string;
  rank: string;
  category: string;
  year: string;
}

export interface CutoffRow {
  exam: string;
  category: string;
  round: string;
  cutoff: string;
  year: string;
}

export interface MediaItem {
  type: "image" | "video";
  /** Backend slot category: HERO (used as the cover) vs GALLERY. */
  category: "HERO" | "GALLERY" | string;
  url: string;
  caption: string;
  order?: number;
}

export interface CollegeDetail {
  header: {
    id: number;
    slug: string;
    name: string;
    short_name: string;
    city: string;
    state: string;
    logo: string;
    cover: string;
    type: string;
    established: number | null;
    affiliation?: string;
    approvals: string[];
    rating: number;
    review_count: number;
  };
  overview: {
    description: string;
    highlights: string[];
    campus_size?: string;
    website?: string;
  };
  courses_fees: CourseFeeRow[];
  admissions: {
    process: string;
    eligibility: string;
    important_dates: { label: string; date: string }[];
    accepted_exams: string[];
  };
  placements: PlacementsBlock;
  rankings: RankingRow[];
  cutoffs: CutoffRow[];
  media: MediaItem[];
  contact: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
    email?: string;
    website?: string;
    map_embed?: string;
    latitude?: number;
    longitude?: number;
  };
  /** "CO_ED" | "GIRLS" | "BOYS" | "" — shown in the header meta line. */
  gender_intake: string;
  scholarships: {
    name: string;
    type: string;
    amount_or_benefit: string;
    eligibility: string;
  }[];
  facilities: { category: string; name: string; description: string }[];
  hostel: {
    available: boolean | null;
    boys: boolean | null;
    girls: boolean | null;
    /** Formatted fee range, "" when unknown ("Hostel fees on request"). */
    fee: string;
  };
  /** Brochure PDF URL, "" when none (button hidden). */
  brochure_url: string;
  operator_disclosure: string;
}

export interface SearchResults {
  colleges: { id: number; slug: string; name: string; city: string; type: string }[];
  courses: { id: number; slug: string; name: string }[];
  exams: { id: number; slug: string; name: string }[];
}

// Leads
export interface OtpRequestResponse {
  request_id: string;
}

export interface OtpVerifyResponse {
  verified: boolean;
  token: string;
}

/* ------------------------------------------------------------ site images */

export interface SiteImage {
  image_url: string;
  alt?: string;
  caption?: string;
}

/** Backend returns only active slots that have an uploaded image, as a
 *  {slot: {image_url, alt, caption}} map. Any slot not present uses a bundled
 *  default in the UI. */
export type SiteImages = Record<string, SiteImage>;

/* ---------------------------------------------------------------- accounts */

export type TrackingStatus =
  | "INTERESTED"
  | "INQUIRED"
  | "APPLIED"
  | "ADMITTED"
  | "NOT_INTERESTED";

export interface AuthUser {
  phone: string;
  name?: string;
  email?: string;
  education_background?: string;
  preferences?: { streams?: string[]; cities?: string[] } | Record<string, unknown> | null;
}

export interface ProfilePatch {
  name?: string;
  email?: string;
  education_background?: string;
  preferences?: { streams?: string[]; cities?: string[] };
}

export interface CollegeInterest {
  id: number;
  college_id: number;
  college_name: string;
  college_slug: string;
  status: TrackingStatus;
  notes?: string;
  updated_at: string;
}

export interface MyLead {
  id?: number;
  college_name?: string;
  college?: string;
  course_interest?: string;
  city?: string;
  status?: string;
  created_at?: string;
}

/* --------------------------------------------------------------- editorial */

export interface ArticleCategory {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  order?: number;
}

export interface ArticleAuthor {
  name: string;
  slug: string;
  bio?: string;
  photo?: string | null;
  role?: string;
}

export interface ArticleCard {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  category: { name: string; slug: string };
  author: { name: string; slug: string };
  published_at: string;
  reading_time: number;
  featured: boolean;
}

export interface ArticleDetail extends Omit<ArticleCard, "category" | "author"> {
  body: string;
  category: ArticleCategory;
  author: ArticleAuthor;
  status?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  related_colleges: CollegeCard[];
  related_courses: { id: number; name: string; slug: string; level?: string }[];
  related_exams: { id: number; name: string; slug: string; conducting_body?: string }[];
  related_articles: ArticleCard[];
}

export interface ArticlesPage {
  results: ArticleCard[];
  count: number;
  page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ArticleQuery {
  page?: string;
  category?: string;
  college?: string;
  course?: string;
  exam?: string;
  author?: string;
  featured?: string;
}

/* --------------------------------------------------------------- compare */

export interface CompareCollege {
  id: number;
  slug: string;
  name: string;
  logo: string | null;
  city: string | null;
  type: string | null;
  established_year: number | null;
  approvals: string[];
  affiliation: string | null;
  rating: { average: number | null; count: number } | null;
  fee_range: { min: number | null; max: number | null } | null;
  key_courses: { name: string; slug: string }[];
  placements: {
    highest: number | null;
    average: number | null;
    median: number | null;
    placement_pct: number | null;
    year: number | null;
  } | null;
  ranking: { agency: string | null; rank: number | null; year: number | null } | null;
  seats: number | null;
  exams_accepted: string[];
}

export interface CompareResponse {
  colleges: CompareCollege[];
}

/* ----------------------------------------------------------- reviews & q&a */

export interface CollegeReview {
  id: number;
  author_name: string;
  author_context?: string;
  overall_rating: number;
  placements?: number;
  faculty?: number;
  infrastructure?: number;
  campus_life?: number;
  title: string;
  body: string;
  is_verified: boolean;
  created_at: string;
}

export interface ReviewSummary {
  count: number;
  average_overall: number;
  sub_averages: {
    placements?: number;
    faculty?: number;
    infrastructure?: number;
    campus_life?: number;
  };
  distribution: Record<string, number>;
}

export interface ReviewsResponse {
  summary: ReviewSummary;
  results: CollegeReview[];
  pagination: Pagination;
}

export interface CollegeAnswer {
  id: number;
  author_name: string;
  body: string;
  is_official: boolean;
  created_at: string;
}

export interface CollegeQuestion {
  id: number;
  author_name: string;
  body: string;
  created_at: string;
  answers: CollegeAnswer[];
}

export interface QuestionsResponse {
  results: CollegeQuestion[];
  pagination: Pagination;
}

export interface ReviewPayload {
  author_name: string;
  author_context?: string;
  overall_rating: number;
  placements?: number;
  faculty?: number;
  infrastructure?: number;
  campus_life?: number;
  title: string;
  body: string;
  hp_field?: string;
}

export interface QuestionPayload {
  author_name: string;
  body: string;
  hp_field?: string;
}

export interface AnswerPayload {
  author_name: string;
  body: string;
  hp_field?: string;
}

export interface LeadPayload {
  name: string;
  mobile: string;
  email: string;
  city: string;
  course_interest: string;
  qualification: string;
  /** Integer year (e.g. 2026); omitted entirely when not chosen — the backend
   *  rejects "" and null, so the key must be absent rather than empty. */
  intake_year?: number;
  source_page: string;
  utm: Record<string, string>;
  consent: { checked: boolean; text_version: string };
  /** Optional: only sent when lead OTP is required (LEAD_OTP_REQUIRED on backend). */
  otp_token?: string;
  hp_field: string;
}

export interface LeadResponse {
  id: number;
  status: string;
}
