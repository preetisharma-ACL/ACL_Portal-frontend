/** Builders for schema.org JSON-LD blocks. Kept pure so any page can compose them. */
import { SITE_NAME, SITE_ORIGIN } from "./config";
import type { ArticleDetail, CollegeDetail, CourseDetail, Faq } from "./types";

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

export function articleLd(article: ArticleDetail, path: string) {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description || article.excerpt,
    datePublished: article.published_at,
    dateModified: article.published_at,
    author: {
      "@type": "Person",
      name: article.author.name,
      ...(article.author.slug ? { url: abs(`/articles/author/${article.author.slug}`) } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(path) },
  };
  if (article.featured_image) ld.image = abs(article.featured_image);
  return ld;
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

/**
 * Entrance-exam landing page. schema.org has no dedicated "Exam" type, so we use
 * EducationEvent (an event held for educational purposes), with the conducting
 * body as organizer. Pairs with BreadcrumbList on the page.
 */
export function examLd(
  exam: { name: string; conducting_body?: string; overview?: string; mode?: string },
  path: string,
) {
  const online = (exam.mode ?? "").toLowerCase().includes("online");
  return {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    name: `${exam.name} Exam`,
    url: abs(path),
    description:
      exam.overview ||
      `${exam.name} entrance exam${
        exam.conducting_body ? ` conducted by ${exam.conducting_body}` : ""
      }.`,
    eventAttendanceMode: online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    ...(exam.conducting_body
      ? { organizer: { "@type": "Organization", name: exam.conducting_body } }
      : {}),
    provider: { "@type": "Organization", name: SITE_NAME },
  };
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
