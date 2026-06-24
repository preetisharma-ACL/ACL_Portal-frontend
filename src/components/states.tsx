import { HttpStatusCode } from "@solidjs/start";
import { type ParentProps } from "solid-js";
import { Button, LinkButton } from "./ui";

/** Server-rendered 404. Sets the HTTP status so crawlers see a real 404. */
export function NotFound(props: { title?: string; message?: string }) {
  return (
    <>
      <HttpStatusCode code={404} />
      <div class="container-x py-20 text-center">
        <p class="text-sm font-semibold text-[var(--color-danger)]">404</p>
        <h1 class="mt-2 text-3xl font-bold">{props.title ?? "Page not found"}</h1>
        <p class="mt-3 text-[var(--color-muted)] max-w-md mx-auto">
          {props.message ??
            "The page you are looking for does not exist or may have moved."}
        </p>
        <div class="mt-8">
          <LinkButton href="/" variant="primary">
            Back to home
          </LinkButton>
        </div>
      </div>
    </>
  );
}

/**
 * Branded typewriter loader shown inside Suspense fallbacks (incl. the
 * first-visit page loader), instead of a grey skeleton. The carriage/keyboard
 * use the brand primary gradient (styles live in app.css under `.typewriter`).
 */
export function LoadingBlock(props: { label?: string }) {
  return (
    <div
      class="container-x flex min-h-[55vh] flex-col items-center justify-center gap-10 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      {/* Scaled via a wrapper because `.typewriter` itself runs a transform
          (bounce) animation that a scale on the same element would override. */}
      <div class="scale-[1.35]" aria-hidden="true">
        <div class="typewriter">
          <div class="slide">
            <i />
          </div>
          <div class="paper" />
          <div class="keyboard" />
        </div>
      </div>
      <p class="text-sm font-medium text-[var(--color-muted)]">{props.label ?? "Loading"}</p>
    </div>
  );
}

/**
 * Friendly error state with a retry. Used by the root ErrorBoundary; a thrown
 * 404 from the API still degrades to NotFound, anything else offers a retry.
 */
export function ErrorState(props: { reset?: () => void; message?: string }) {
  return (
    <div class="container-x py-20 text-center">
      <p class="text-sm font-semibold text-[var(--color-danger)]">Something went wrong</p>
      <h1 class="mt-2 text-3xl font-bold">We could not load this page</h1>
      <p class="mt-3 text-[var(--color-muted)] max-w-md mx-auto">
        {props.message ?? "There was a problem reaching our data. Please try again in a moment."}
      </p>
      <div class="mt-8 flex items-center justify-center gap-3">
        {props.reset && (
          <Button variant="primary" onClick={() => props.reset!()}>
            Try again
          </Button>
        )}
        <LinkButton href="/" variant="outline">
          Back to home
        </LinkButton>
      </div>
    </div>
  );
}

export function EmptyState(props: ParentProps<{ title: string }>) {
  return (
    <div class="text-center py-12 border border-dashed border-[var(--color-line)] rounded-[var(--radius-lg)]">
      <h3 class="font-semibold">{props.title}</h3>
      <div class="mt-2 text-sm text-[var(--color-muted)]">{props.children}</div>
    </div>
  );
}
