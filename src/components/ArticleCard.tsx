import { A } from "@solidjs/router";
import { Show } from "solid-js";
import type { ArticleCard as ArticleCardT } from "~/lib/types";

export function fmtArticleDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** Article card. Featured variant is wider/taller for the index hero slot. */
export default function ArticleCard(props: { article: ArticleCardT; featured?: boolean }) {
  const a = props.article;
  const href = `/articles/${a.slug}`;

  return (
    <article
      class="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] transition-all hover:border-primary-300 hover:shadow-md"
      classList={{ "sm:flex-row": props.featured }}
    >
      <A
        href={href}
        class="relative block shrink-0 overflow-hidden"
        classList={{
          "h-40": !props.featured,
          "h-48 sm:h-auto sm:w-1/2": props.featured,
        }}
      >
        <Show
          when={a.featured_image}
          fallback={
            <div class="grid h-full min-h-[10rem] w-full place-items-center bg-gradient-to-br from-primary-700 to-primary-900 p-4 text-center">
              <span class="text-sm font-semibold uppercase tracking-wide text-white/85">
                {a.category.name}
              </span>
            </div>
          }
        >
          <img
            src={a.featured_image!}
            alt={a.title}
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Show>
      </A>

      <div class="flex flex-1 flex-col p-4 sm:p-5">
        <A
          href={`/articles/category/${a.category.slug}`}
          class="self-start rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
        >
          {a.category.name}
        </A>
        <h3
          class="mt-2 font-bold leading-snug text-[var(--color-ink)] group-hover:text-primary-700"
          classList={{ "text-lg": !props.featured, "text-xl sm:text-2xl": props.featured }}
        >
          <A href={href}>{a.title}</A>
        </h3>
        <p
          class="mt-2 text-sm text-[var(--color-muted)]"
          classList={{ "line-clamp-2": !props.featured, "line-clamp-3": props.featured }}
        >
          {a.excerpt}
        </p>
        <div class="mt-auto pt-3 text-xs text-[var(--color-muted)]">
          <span class="font-medium text-[var(--color-ink)]/80">{a.author.name}</span>
          <span> · {fmtArticleDate(a.published_at)}</span>
          <Show when={a.reading_time}>
            <span> · {a.reading_time} min read</span>
          </Show>
        </div>
      </div>
    </article>
  );
}
