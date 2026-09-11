import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { formatDate } from "~/lib/format";
import Img from "./Img";
import type { ArticleCard as ArticleCardT } from "~/lib/types";

/** Deterministic (SSR-safe) date format; re-exported for the article pages. */
export const fmtArticleDate = formatDate;

/** Cover photos shipped in /public, used when an article has no featured image. */
const COVERS = [
  "@card-fallback",
  "/delhi.jpg",
  "/bg-image3.jpg",
  "/varanasi.jpg",
  "/bg-image2.jpg",
  "/lucknow.jpg",
  "/banglore.jpg",
];

/** Card art is a full-width column on mobile, half of it from sm up. */
const CARD_SIZES = "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw";

/**
 * Pick a cover. Lists pass their position so neighbouring cards never repeat a
 * photo; standalone cards fall back to a slug hash for a stable choice.
 */
const coverFor = (slug: string, index?: number) => {
  if (index !== undefined) return COVERS[index % COVERS.length];
  let h = 5381;
  for (let i = 0; i < slug.length; i++) h = (h * 33 + slug.charCodeAt(i)) >>> 0;
  return COVERS[h % COVERS.length];
};

/** Article card. Featured variant is wider/taller for the index hero slot. */
export default function ArticleCard(props: {
  article: ArticleCardT;
  featured?: boolean;
  /** Position in a list, so cards rendered together get different covers. */
  index?: number;
}) {
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
            <div class="relative grid h-full min-h-[10rem] w-full place-items-center p-4 text-center">
              <Img
                src={coverFor(a.slug, props.index)}
                alt=""
                sizes={CARD_SIZES}
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30"
              />
              <span class="relative text-sm font-semibold uppercase tracking-wide text-white drop-shadow">
                {a.category.name}
              </span>
            </div>
          }
        >
          <Img
            src={a.featured_image!}
            alt={a.title}
            sizes={CARD_SIZES}
            maxWidth={828}
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
          classList={{
            "text-lg": !props.featured,
            "text-xl sm:text-2xl": props.featured,
          }}
        >
          <A href={href}>{a.title}</A>
        </h3>
        <p
          class="mt-2 text-sm text-[var(--color-muted)]"
          classList={{
            "line-clamp-2": !props.featured,
            "line-clamp-3": props.featured,
          }}
        >
          {a.excerpt}
        </p>
        <div class="mt-auto pt-3 text-xs text-[var(--color-muted)]">
          <span class="font-medium text-[var(--color-ink)]/80">
            {a.author.name}
          </span>
          <span> · {fmtArticleDate(a.published_at)}</span>
          <Show when={a.reading_time}>
            <span> · {a.reading_time} min read</span>
          </Show>
        </div>
      </div>
    </article>
  );
}
