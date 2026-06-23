import { createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import { articlesQuery } from "~/lib/queries";
import ArticleCard from "./ArticleCard";
import type { ArticleQuery } from "~/lib/types";

/**
 * "Related articles" widget for college/course/exam detail pages. Fetches
 * articles linked to the given entity and hides itself cleanly when there are
 * none. Pass exactly one of college/course/exam (a slug).
 */
export default function RelatedArticles(props: {
  college?: string;
  course?: string;
  exam?: string;
  heading?: string;
  limit?: number;
}) {
  const params = (): ArticleQuery => ({
    college: props.college,
    course: props.course,
    exam: props.exam,
  });
  const data = createAsync(() => articlesQuery(params()));
  const items = () => (data()?.results ?? []).slice(0, props.limit ?? 3);

  return (
    <Show when={items().length}>
      <section class="mt-10">
        <h2 class="mb-4 text-2xl font-bold">{props.heading ?? "Related articles"}</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <For each={items()}>{(a) => <ArticleCard article={a} />}</For>
        </div>
      </section>
    </Show>
  );
}
