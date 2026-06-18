/** Builders for schema.org JSON-LD blocks. Kept pure so any page can compose them. */
import { SITE_NAME, SITE_ORIGIN } from "./config";
import type { CollegeDetail, CourseDetail, Faq } from "./types";

export interface Crumb {
  name: string;
  path: string;
}

function abs(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return SITE_ORIGIN + (path.startsWith("/") ? path : "/" + path);
}

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

export function faqLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description:
      "Independent education discovery platform for colleges, courses and exams, operated by AAJneeti Connect Ltd.",
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_ORIGIN}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function collegeLd(d: CollegeDetail, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: d.header.name,
    url: abs(path),
    foundingDate: String(d.header.established),
    aggregateRating:
      d.header.rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: d.header.rating,
            reviewCount: d.header.review_count,
            bestRating: 5,
          }
        : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: d.contact.address,
      addressLocality: d.contact.city,
      addressRegion: d.contact.state,
      postalCode: d.contact.pincode,
      addressCountry: "IN",
    },
  };
}

/** Course schema for each programme a college offers, with the college as provider. */
export function collegeCoursesLd(d: CollegeDetail, path: string) {
  return d.courses_fees.map((c) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${c.course} at ${d.header.name}`,
    description: `${c.course} programme (${c.duration}) at ${d.header.name}, ${d.header.city}.`,
    url: abs(path),
    provider: {
      "@type": "CollegeOrUniversity",
      name: d.header.name,
    },
  }));
}

export function courseLd(d: CourseDetail, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: d.course.name,
    description: d.course.description,
    url: abs(path),
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}
