import { Meta, MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { ErrorBoundary, Show, Suspense } from "solid-js";
import "./app.css";
import Header from "~/components/layout/Header";
import Footer from "~/components/layout/Footer";
import Analytics from "~/components/Analytics";
import { ErrorState, LoadingBlock, NotFound } from "~/components/states";
import { USE_MOCK } from "~/lib/config";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          {/* Demo safety: in mock/preview mode keep the build out of search
              indexes site-wide. Production runs with mock off, so this never
              carries forward. */}
          <Show when={USE_MOCK}>
            <Meta name="robots" content="noindex,nofollow" />
          </Show>
          <a
            href="#main"
            class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-white focus:text-primary-700 focus:px-3 focus:py-2 focus:rounded"
          >
            Skip to content
          </a>
          <Show when={USE_MOCK}>
            <div class="bg-[var(--color-warning)]/15 text-[var(--color-ink)] text-xs text-center px-3 py-1.5 border-b border-[var(--color-warning)]/30">
              Preview build with sample data, for review only. Not live and not indexed.
            </div>
          </Show>
          <Header />
          <main id="main" class="min-h-[60vh]">
            <ErrorBoundary
              fallback={(err, reset) =>
                err?.status === 404 ? (
                  <NotFound message="We could not find what you were looking for." />
                ) : (
                  <ErrorState reset={reset} />
                )
              }
            >
              <Suspense fallback={<LoadingBlock label="Loading page" />}>
                {props.children}
              </Suspense>
            </ErrorBoundary>
          </main>
          <Footer />
          <Analytics />
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
