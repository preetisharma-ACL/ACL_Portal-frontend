import { Title, Meta, Link } from "@solidjs/meta";
import { For, Show } from "solid-js";
import { SITE_NAME, SITE_ORIGIN } from "~/lib/config";

export interface SeoProps {
  title: string;
  description: string;
  /** Path or absolute URL for the canonical tag. */
  canonical?: string;
  /** Open Graph image URL. */
  og?: string;
  /** One or more JSON-LD objects injected as ld+json scripts. */
  jsonLd?: object | object[];
  noindex?: boolean;
}

function toAbsolute(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return SITE_ORIGIN + (path.startsWith("/") ? path : "/" + path);
}

/**
 * Per-page head management. Titles are templated for uniqueness, a single
 * canonical is emitted, OG/Twitter cards are filled, and any JSON-LD is
 * serialised so crawlers get structured data on the server-rendered HTML.
 */
export default function Seo(props: SeoProps) {
  const fullTitle = () =>
    props.title.includes(SITE_NAME) ? props.title : `${props.title} | ${SITE_NAME}`;
  const canonical = () => toAbsolute(props.canonical);
  const ogImage = () => toAbsolute(props.og) ?? toAbsolute("/placeholders/og-default.svg");
  const blocks = () =>
    props.jsonLd ? (Array.isArray(props.jsonLd) ? props.jsonLd : [props.jsonLd]) : [];

  return (
    <>
      <Title>{fullTitle()}</Title>
      <Meta name="description" content={props.description} />
      <Show when={props.noindex}>
        <Meta name="robots" content="noindex,nofollow" />
      </Show>
      <Show when={canonical()}>
        <Link rel="canonical" href={canonical()!} />
      </Show>

      {/* Open Graph */}
      <Meta property="og:type" content="website" />
      <Meta property="og:site_name" content={SITE_NAME} />
      <Meta property="og:title" content={fullTitle()} />
      <Meta property="og:description" content={props.description} />
      <Show when={canonical()}>
        <Meta property="og:url" content={canonical()!} />
      </Show>
      <Show when={ogImage()}>
        <Meta property="og:image" content={ogImage()!} />
      </Show>

      {/* Twitter */}
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content={fullTitle()} />
      <Meta name="twitter:description" content={props.description} />
      <Show when={ogImage()}>
        <Meta name="twitter:image" content={ogImage()!} />
      </Show>

      {/* JSON-LD */}
      <For each={blocks()}>
        {(block) => (
          // eslint-disable-next-line solid/no-innerhtml
          <script type="application/ld+json" innerHTML={JSON.stringify(block)} />
        )}
      </For>
    </>
  );
}
