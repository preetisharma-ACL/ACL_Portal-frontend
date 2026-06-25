import { Show } from "solid-js";
import { createAsync } from "@solidjs/router";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import { LoadingBlock } from "~/components/states";
import { pageQuery } from "~/lib/queries";
import { breadcrumbLd } from "~/lib/jsonld";
import { formatDate } from "~/lib/format";

/**
 * Content/legal page rendered from the admin-editable content API
 * (GET /pages/{slug}/). The title, meta description, canonical and body are all
 * server-rendered (deferStream) so crawlers and Google Ads review see the full
 * legal text in the initial HTML.
 */
export default function LegalPage(props: { slug: string; path: string }) {
  const data = createAsync(() => pageQuery(props.slug), { deferStream: true });
  return (
    <Show when={data()} fallback={<LoadingBlock label="Loading" />}>
      {(p) => {
        const crumbs = [
          { name: "Home", path: "/" },
          { name: p().title, path: props.path },
        ];
        return (
          <>
            <Seo
              title={p().title}
              description={
                p().meta_description ||
                `${p().title} for ACL Education, operated by AAJneeti Connect Ltd.`
              }
              canonical={props.path}
              jsonLd={breadcrumbLd(crumbs)}
            />
            <div class="container-x py-8 md:py-12">
              <Breadcrumbs crumbs={crumbs} />
              <article class="mt-4 max-w-3xl legal-prose">
                <h1 class="text-3xl font-bold">{p().title}</h1>
                <Show when={p().last_updated}>
                  <p class="mt-1 text-sm text-[var(--color-muted)]">
                    Last updated: {formatDate(p().last_updated)}
                  </p>
                </Show>
                {/* Body is admin-authored HTML from the content API. */}
                <div
                  class="mt-6 space-y-5 text-[var(--color-ink)]/90"
                  innerHTML={p().body}
                />
              </article>
            </div>
          </>
        );
      }}
    </Show>
  );
}
