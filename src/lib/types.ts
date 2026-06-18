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
}

export interface CourseDetail {
  course: {
    id: number;
    name: string;
    slug: string;
    level: string;
    duration: string;
    description: string;
    eligibility: string;
    career_scope: string;
    fee_range: string;
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
    conducting_body: string;
    overview: string;
    eligibility: string;
    pattern: string;
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
  popular_courses: string[];
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

export interface PlacementRow {
  year: string;
  highest_package: string;
  average_package: string;
  median_package: string;
  top_recruiters: string[];
  placement_rate: string;
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
  url: string;
  caption: string;
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
    established: number;
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
  placements: PlacementRow[];
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
    map_embed?: string;
    latitude?: number;
    longitude?: number;
  };
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

export interface LeadPayload {
  name: string;
  mobile: string;
  email: string;
  city: string;
  course_interest: string;
  qualification: string;
  intake_year: string;
  source_page: string;
  utm: Record<string, string>;
  consent: { checked: boolean; text_version: string };
  otp_token: string;
  hp_field: string;
}

export interface LeadResponse {
  id: number;
  status: string;
}
