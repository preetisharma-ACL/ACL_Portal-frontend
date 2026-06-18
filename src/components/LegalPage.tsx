import { type JSX } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import { breadcrumbLd } from "~/lib/jsonld";

/**
 * Shared layout for content/legal pages. Provides a readable prose column,
 * breadcrumbs, canonical and a last-updated line. Sections that still need
 * legal sign-off are marked inline with <LegalTodo>.
 */
export default function LegalPage(props: {
  title: string;
  description: string;
  path: string;
  updated: string;
  children: JSX.Element;
}) {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: props.title, path: props.path },
  ];
  return (
    <>
      <Seo
        title={props.title}
        description={props.description}
        canonical={props.path}
        jsonLd={breadcrumbLd(crumbs)}
      />
      <div class="container-x py-8 md:py-12">
        <Breadcrumbs crumbs={crumbs} />
        <article class="mt-4 max-w-3xl legal-prose">
          <h1 class="text-3xl font-bold">{props.title}</h1>
          <p class="mt-1 text-sm text-[var(--color-muted)]">Last updated {props.updated}</p>
          <div class="mt-6 space-y-5 text-[var(--color-ink)]/90">{props.children}</div>
        </article>
      </div>
    </>
  );
}

/** Marks content that needs legal review before launch. Visible and obvious. */
export function LegalTodo(props: { children: JSX.Element }) {
  return (
    <p class="rounded-[var(--radius-md)] border border-dashed border-[var(--color-warning)] bg-[var(--color-warning)]/5 px-4 py-3 text-sm">
      <span class="font-semibold text-[var(--color-warning)]">Needs legal sign-off: </span>
      {props.children}
    </p>
  );
}
