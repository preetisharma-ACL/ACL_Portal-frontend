import { A, createAsync, useSearchParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import ArticleCard from "~/components/ArticleCard";
import SlotImage from "~/components/SlotImage";
import { EmptyState } from "~/components/states";
import { articleCategoriesQuery, articlesQuery } from "~/lib/queries";
import { breadcrumbLd } from "~/lib/jsonld";
import { humanize } from "~/lib/slug";
import type { ArticleQuery } from "~/lib/types";

export default function ArticlesListing(props: { category?: string; author?: string }) {
  const [sp, setSp] = useSearchParams();
  const page = () => Math.max(1, parseInt((sp.page as string) ?? "1", 10) || 1);
  const isMain = () => !props.category && !props.author;

  const query = (): ArticleQuery => ({
    page: String(page()),
    category: props.category,
    author: props.author,
  });
  // deferStream so the listing's title/canonical and cards are server-rendered
  // (crawlable) rather than applied after hydration.
  const data = createAsync(() => articlesQuery(query()), { deferStream: true });
  const categories = createAsync(() => articleCategoriesQuery());

  const results = () => data()?.results ?? [];
  const hero = () =>
    isMain() && page() === 1 ? results().find((a) => a.featured) ?? results()[0] : undefined;
  const gridItems = () => {
    const h = hero();
    return h ? results().filter((a) => a.id !== h.id) : results();
  };

  const categoryName = () =>
    (categories() ?? []).find((c) => c.slug === props.category)?.name ?? humanize(props.category);
  const authorName = () => results()[0]?.author.name ?? humanize(props.author);

  const heading = () =>
    props.category ? categoryName() : props.author ? `Articles by ${authorName()}` : "News & Guides";
  const path = () =>
    props.category
      ? `/articles/category/${props.category}`
      : props.author
        ? `/articles/author/${props.author}`
        : "/articles";

  const crumbs = () => {
    const base = [
      { name: "Home", path: "/" },
      { name: "Articles", path: "/articles" },
    ];
    if (props.category) base.push({ name: categoryName(), path: path() });
    if (props.author) base.push({ name: heading(), path: path() });
    return base;
  };

  function goPage(n: number) {
    setSp({ page: n > 1 ? String(n) : undefined });
  }

  return (
    <>
      <Seo
        title={isMain() ? "News and Guides on Colleges, Courses and Exams" : `${heading()} | Articles`}
        description="Editorial guides, news and explainers on colleges, courses, exams and careers, from the ACL editorial team."
        canonical={path()}
        jsonLd={[breadcrumbLd(crumbs())]}
      />

      <section class="relative overflow-hidden bg-gradient-to-br from-primary-900 to-primary-700 text-white">
        <SlotImage slot="articles_header" overlay />
        <div class="container-x py-8 md:py-10 relative z-10">
          <Breadcrumbs crumbs={crumbs()} light />
          <h1 class="mt-3 text-2xl md:text-3xl font-extrabold">{heading()}</h1>
          <p class="mt-2 max-w-2xl text-white/80">
            Practical, neutral guidance on choosing colleges, preparing for exams and planning a
            career.
          </p>
        </div>
      </section>

      {/* Category filter tabs */}
      <nav
        aria-label="Article categories"
        class="sticky top-16 z-20 border-b border-[var(--color-line)] bg-[var(--color-surface)]/90 backdrop-blur"
      >
        <div class="container-x flex gap-2 overflow-x-auto py-3">
          <A
            href="/articles"
            class="whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
            classList={{
              "border-primary-600 bg-primary-600 text-white": isMain(),
              "border-[var(--color-line)] hover:border-primary-300 hover:text-primary-700": !isMain(),
            }}
          >
            All
          </A>
          <For each={categories() ?? []}>
            {(c) => (
              <A
                href={`/articles/category/${c.slug}`}
                class="whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
                classList={{
                  "border-primary-600 bg-primary-600 text-white": props.category === c.slug,
                  "border-[var(--color-line)] hover:border-primary-300 hover:text-primary-700":
                    props.category !== c.slug,
                }}
              >
                {c.name}
              </A>
            )}
          </For>
        </div>
      </nav>

      <div class="container-x py-8">
        <Show
          when={results().length}
          fallback={
            <EmptyState title="No articles yet">
              <p>There are no articles in this section yet. Check back soon.</p>
              <div class="mt-4">
                <A href="/articles" class="font-semibold text-primary-700 hover:underline">
                  Browse all articles
                </A>
              </div>
            </EmptyState>
          }
        >
          {/* Featured hero (main index, first page) */}
          <Show when={hero()}>
            {(h) => (
              <div class="mb-8">
                <ArticleCard article={h()} featured />
              </div>
            )}
          </Show>

          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <For each={gridItems()}>{(a) => <ArticleCard article={a} />}</For>
          </div>

          {/* Pagination (DRF next/previous) */}
          <Show when={data()?.has_next || data()?.has_prev}>
            <div class="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={!data()?.has_prev}
                onClick={() => goPage(page() - 1)}
                class="rounded-[var(--radius-md)] border border-[var(--color-line)] px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span class="text-sm text-[var(--color-muted)]">Page {page()}</span>
              <button
                type="button"
                disabled={!data()?.has_next}
                onClick={() => goPage(page() + 1)}
                class="rounded-[var(--radius-md)] border border-[var(--color-line)] px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </Show>
        </Show>
      </div>
    </>
  );
}
