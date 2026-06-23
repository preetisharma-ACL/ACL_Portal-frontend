import { A, createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollegeLogo from "~/components/CollegeLogo";
import ArticleCard, { fmtArticleDate } from "~/components/ArticleCard";
import { LoadingBlock } from "~/components/states";
import { articleQuery } from "~/lib/queries";
import { articleLd, breadcrumbLd } from "~/lib/jsonld";

export default function ArticleDetailPage(props: { slug: string }) {
  // deferStream so SSR waits for the article before flushing the document head:
  // the title, canonical, OG/Twitter and Article JSON-LD must be in the
  // server-rendered HTML (the whole point of editorial), not applied on hydrate.
  const data = createAsync(() => articleQuery(props.slug), { deferStream: true });

  return (
    <Show when={data()} fallback={<LoadingBlock label="Loading article" />}>
      {(a) => {
        const path = () => `/articles/${a().slug}`;
        const crumbs = () => [
          { name: "Home", path: "/" },
          { name: "Articles", path: "/articles" },
          { name: a().category.name, path: `/articles/category/${a().category.slug}` },
          { name: a().title, path: path() },
        ];

        return (
          <>
            <Seo
              title={a().meta_title || a().title}
              description={a().meta_description || a().excerpt}
              canonical={a().canonical_url || path()}
              og={a().featured_image || undefined}
              jsonLd={[breadcrumbLd(crumbs()), articleLd(a(), path())]}
            />

            <article class="container-x max-w-3xl py-8">
              <Breadcrumbs crumbs={crumbs()} />

              <A
                href={`/articles/category/${a().category.slug}`}
                class="mt-4 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100"
              >
                {a().category.name}
              </A>
              <h1 class="mt-3 text-3xl md:text-4xl font-extrabold leading-tight">{a().title}</h1>
              <p class="mt-3 text-lg text-[var(--color-muted)]">{a().excerpt}</p>

              {/* Byline */}
              <div class="mt-5 flex items-center gap-3 border-y border-[var(--color-line)] py-4">
                <A href={`/articles/author/${a().author.slug}`} class="shrink-0">
                  <Show
                    when={a().author.photo}
                    fallback={
                      <span class="grid h-11 w-11 place-items-center rounded-full bg-primary-600 font-bold text-white">
                        {a().author.name.slice(0, 1)}
                      </span>
                    }
                  >
                    <img
                      src={a().author.photo!}
                      alt={a().author.name}
                      class="h-11 w-11 rounded-full object-cover"
                    />
                  </Show>
                </A>
                <div class="min-w-0 text-sm">
                  <A href={`/articles/author/${a().author.slug}`} class="font-semibold hover:text-primary-700">
                    {a().author.name}
                  </A>
                  <Show when={a().author.role}>
                    <span class="text-[var(--color-muted)]"> · {a().author.role}</span>
                  </Show>
                  <p class="text-xs text-[var(--color-muted)]">
                    {fmtArticleDate(a().published_at)}
                    <Show when={a().reading_time}> · {a().reading_time} min read</Show>
                  </p>
                </div>
              </div>

              {/* Featured image */}
              <Show when={a().featured_image}>
                <img
                  src={a().featured_image!}
                  alt={a().title}
                  class="mt-6 w-full rounded-[var(--radius-lg)] object-cover"
                />
              </Show>

              {/* Body (admin-authored, trusted HTML) */}
              <div
                class="mt-6 leading-relaxed text-[var(--color-ink)]/90 [&_a]:text-primary-700 [&_a]:underline [&>p]:my-4 [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:mt-6 [&>h3]:mb-2 [&>h3]:text-xl [&>h3]:font-semibold [&>ul]:my-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:my-4 [&>ol]:list-decimal [&>ol]:pl-6 [&_li]:my-1 [&>blockquote]:my-4 [&>blockquote]:border-l-4 [&>blockquote]:border-primary-200 [&>blockquote]:pl-4 [&>blockquote]:italic [&>img]:my-6 [&>img]:rounded-[var(--radius-lg)]"
                // eslint-disable-next-line solid/no-innerhtml
                innerHTML={a().body}
              />
            </article>

            {/* Related entities (internal linking) */}
            <Show
              when={
                a().related_colleges.length || a().related_courses.length || a().related_exams.length
              }
            >
              <section class="border-t border-[var(--color-line)] bg-[var(--color-canvas)]">
                <div class="container-x max-w-3xl py-8">
                  <h2 class="text-xl font-bold">Related on ACL</h2>

                  <Show when={a().related_colleges.length}>
                    <h3 class="mt-5 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Colleges
                    </h3>
                    <div class="mt-2 grid gap-2 sm:grid-cols-2">
                      <For each={a().related_colleges}>
                        {(c) => (
                          <A
                            href={`/college/${c.slug}-${c.id}`}
                            class="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 hover:border-primary-300"
                          >
                            <CollegeLogo name={c.name} logo={c.logo} id={c.id} class="h-9 w-9 rounded-[var(--radius-md)] text-xs" />
                            <span class="min-w-0">
                              <span class="block truncate text-sm font-semibold">{c.name}</span>
                              <span class="block text-xs text-[var(--color-muted)]">{c.city}</span>
                            </span>
                          </A>
                        )}
                      </For>
                    </div>
                  </Show>

                  <Show when={a().related_courses.length}>
                    <h3 class="mt-5 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Courses
                    </h3>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <For each={a().related_courses}>
                        {(c) => (
                          <A
                            href={`/${c.slug}-course`}
                            class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium hover:border-primary-300 hover:text-primary-700"
                          >
                            {c.name}
                          </A>
                        )}
                      </For>
                    </div>
                  </Show>

                  <Show when={a().related_exams.length}>
                    <h3 class="mt-5 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Exams
                    </h3>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <For each={a().related_exams}>
                        {(e) => (
                          <A
                            href={`/mba/${e.slug}-exam`}
                            class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium hover:border-primary-300 hover:text-primary-700"
                          >
                            {e.name}
                          </A>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </section>
            </Show>

            {/* Related articles */}
            <Show when={a().related_articles.length}>
              <section class="container-x max-w-5xl py-10">
                <h2 class="mb-4 text-2xl font-bold">Related articles</h2>
                <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <For each={a().related_articles}>{(r) => <ArticleCard article={r} />}</For>
                </div>
              </section>
            </Show>
          </>
        );
      }}
    </Show>
  );
}
