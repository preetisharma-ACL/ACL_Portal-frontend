import { For, type JSX } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import LeadTrigger from "~/components/LeadTrigger";
import { Section } from "~/components/ui";
import { breadcrumbLd } from "~/lib/jsonld";
import { SITE_NAME } from "~/lib/config";

const crumbs = [
  { name: "Home", path: "/" },
  { name: "About Us", path: "/about" },
];

/** Small navy section eyebrow used throughout the page. */
function Label(props: { children: JSX.Element }) {
  return (
    <span class="text-sm font-bold uppercase tracking-[0.15em] text-accent-600">
      {props.children}
    </span>
  );
}

const STATS = [
  { value: "70+", label: "Institutions listed", icon: "cap" },
  { value: "35+", label: "Cities covered", icon: "pin" },
  { value: "6", label: "Streams", icon: "layers" },
  { value: "100%", label: "Free for students", icon: "heart" },
];

function StatIcon(props: { name: string }) {
  const cls = "h-7 w-7";
  switch (props.name) {
    case "cap":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true">
          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "layers":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true">
          <path d="m12 2 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
      );
  }
}

export default function AboutPage() {
  return (
    <>
      <Seo
        title={`About ${SITE_NAME}`}
        description={`${SITE_NAME} is an independent education discovery and counselling platform operated by AAJneeti Connect Ltd., helping students and parents choose colleges, courses and exams across India.`}
        canonical="/about"
        jsonLd={breadcrumbLd(crumbs)}
      />

      {/* Intro hero */}
      <section class="relative overflow-hidden bg-gradient-to-br from-accent-50 via-[var(--color-surface)] to-primary-50">
        <div aria-hidden="true" class="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-primary-100/60 blur-3xl" />
        <div aria-hidden="true" class="pointer-events-none absolute -bottom-28 -left-10 h-80 w-80 rounded-full bg-accent-100/50 blur-3xl" />
        <div class="container-x relative z-10 py-12 md:py-20">
          <Breadcrumbs crumbs={crumbs} />
          <div class="mt-6 grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <span class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">
                <span aria-hidden="true" class="h-px w-7 bg-primary-500" />
                About Us
              </span>
              <h1 class="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight text-accent-600 md:text-5xl">
                About{" "}
                <span class="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  {SITE_NAME}
                </span>
              </h1>
              <p class="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-ink)]/80 md:text-lg">
                An independent education discovery and counselling platform by{" "}
                <span class="font-semibold text-[var(--color-ink)]">AAJneeti Connect Ltd.</span> We
                help students and parents cut through the noise with clear, comparable data on
                colleges, universities, courses and entrance exams, and free guidance through the
                admissions journey.
              </p>
              <div class="mt-6 flex flex-wrap gap-2.5">
                <For
                  each={[
                    "Free for students",
                    "Independent and unbiased",
                    "DPDP-compliant",
                  ]}
                >
                  {(t) => (
                    <span class="inline-flex items-center gap-1.5 rounded-full border border-accent-100 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-accent-700 backdrop-blur-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-primary-600" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {t}
                    </span>
                  )}
                </For>
              </div>
            </div>
            <div class="hidden justify-self-center lg:block">
              <img
                src="/vector.png"
                alt=""
                loading="eager"
                class="h-64 w-auto object-contain xl:h-72"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <Section bg="canvas">
        <div class="grid gap-6 md:grid-cols-2">
          <div class="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-7 text-center shadow-sm">
            <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-50 text-primary-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-7 w-7" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" />
              </svg>
            </span>
            <h2 class="mt-4 text-base font-bold uppercase tracking-wider text-accent-600">
              Our Mission
            </h2>
            <p class="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              Choosing where to study is one of life's biggest decisions and it should not go wrong.
              With a clear interface and validated, comparable content, we aspire to help every
              student make that decision with confidence.
            </p>
          </div>
          <div class="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-7 text-center shadow-sm">
            <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-50 text-accent-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-7 w-7" aria-hidden="true">
                <path d="M4.5 16.5 3 21l4.5-1.5M9 15l6-6M14 4s4 0 6 2-2 6-2 6M9 15l-3-3M9 15s-3 1-5 3c2-4 3-5 3-5" />
                <circle cx="15" cy="9" r="1.5" />
              </svg>
            </span>
            <h2 class="mt-4 text-base font-bold uppercase tracking-wider text-accent-600">
              Our Vision
            </h2>
            <p class="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              To empower students and parents with the knowledge they need to make a wiser decision
              about their career and alma mater, on a platform that puts students first and stays
              independent of the institutions it lists.
            </p>
          </div>
        </div>
      </Section>

      {/* For Students */}
      <Section>
        <div class="text-center">
          <Label>{SITE_NAME} for students</Label>
          <img
            src="/Online%20Exam.svg"
            alt=""
            loading="lazy"
            class="mx-auto mt-6 h-44 w-auto object-contain md:h-52"
          />
          <p class="mx-auto mt-6 max-w-3xl text-[15px] leading-relaxed text-[var(--color-ink)]/80">
            Use {SITE_NAME} as one place to search for your dream college, explore courses and the
            admission process, and shortlist with clear, comparable data. Browse institutions across
            streams like Management, Engineering, Medical, Pharmacy, Law and University programmes,
            and filter by city, fees, approvals and accepted exams to find the right fit.
          </p>
        </div>
      </Section>

      {/* For Institutions / For Parents */}
      <Section bg="canvas">
        <div class="grid gap-6 md:grid-cols-2">
          <div class="flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-7 text-center shadow-sm">
            <img src="/3D%20Digital%20Marketing.svg" alt="" loading="lazy" class="h-28 w-auto" />
            <h2 class="mt-4 text-base font-bold uppercase tracking-wider text-accent-600">
              {SITE_NAME} for institutions
            </h2>
            <p class="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              We offer institutions a transparent platform to reach genuinely interested students.
              Our category-level guidance model connects motivated students with the right
              institutions, with clear, consent-based lead handling.
            </p>
          </div>
          <div class="flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-7 text-center shadow-sm">
            <img src="/Study%20Abroad.svg" alt="" loading="lazy" class="h-28 w-auto" />
            <h2 class="mt-4 text-base font-bold uppercase tracking-wider text-accent-600">
              {SITE_NAME} for parents
            </h2>
            <p class="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              We help parents cut through the noise with comparable information on fees, approvals,
              placements and admissions, plus free counselling, so families can make an informed
              decision together.
            </p>
          </div>
        </div>
      </Section>

      {/* Stats */}
      <Section>
        <div class="text-center">
          <Label>We are growing every day</Label>
          <div class="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            <For each={STATS}>
              {(s) => (
                <div class="flex flex-col items-center">
                  <span class="grid h-14 w-14 place-items-center rounded-2xl bg-accent-50 text-accent-600">
                    <StatIcon name={s.icon} />
                  </span>
                  <p class="mt-3 text-2xl font-extrabold text-[var(--color-ink)]">{s.value}</p>
                  <p class="mt-0.5 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                    {s.label}
                  </p>
                </div>
              )}
            </For>
          </div>
        </div>
      </Section>

      {/* Who's behind us — full banner */}
      <section class="relative overflow-hidden">
        <img
          src="/aajneeti-banner.webp"
          alt="The team at AAJneeti Connect Ltd."
          class="h-72 w-full object-cover object-center md:h-[26rem]"
        />
        <div
          aria-hidden="true"
          class="absolute inset-0 bg-gradient-to-r from-accent-800/90 via-accent-700/65 to-accent-700/25"
        />
        <div class="absolute inset-0 flex items-center">
          <div class="container-x">
            <h2 class="max-w-xl text-2xl font-extrabold leading-tight text-white md:text-3xl">
              So, who is behind {SITE_NAME}?
            </h2>
            <p class="mt-3 max-w-xl text-sm text-white/85 md:text-base">
              A team of educators, engineers and counsellors at AAJneeti Connect Ltd. building an
              honest, student-first education platform. We are not affiliated with the institutions
              we list, which keeps our guidance independent.
            </p>
          </div>
        </div>
      </section>

      {/* Partner / Advertise */}
      <Section bg="canvas">
        <div class="mx-auto max-w-2xl text-center">
          <Label>Partner with us</Label>
          <h2 class="mt-2 text-2xl font-extrabold text-accent-600 md:text-3xl">
            Advertise and partner with us
          </h2>
          <p class="mt-3 text-[15px] leading-relaxed text-[var(--color-ink)]/80">
            Reach a focused audience of students and parents actively researching colleges and
            courses. We offer institutions transparent, consent-based promotion and lead programmes.
          </p>
          <a
            href="mailto:contact@aajneeti.social"
            class="mt-6 inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-primary-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-primary-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            Mail us
          </a>
        </div>
      </Section>

      {/* Final CTA (secondary/navy) */}
      <section class="bg-accent-600 text-white">
        <div class="container-x py-12 text-center md:py-14">
          <h2 class="text-2xl font-extrabold text-white md:text-3xl">
            Get free admission guidance
          </h2>
          <p class="mx-auto mt-2 max-w-xl text-sm text-white/80 md:text-base">
            Independent guidance on courses, fees and admissions. Free for students, no spam.
          </p>
          <div class="mt-6 flex justify-center">
            <LeadTrigger
              sourcePage="/about"
              heading="Get free admission guidance"
              label="Get free guidance"
              variant="primary"
              size="lg"
            />
          </div>
        </div>
      </section>
    </>
  );
}
