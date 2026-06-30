import { Meta, MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { ErrorBoundary, Show, Suspense, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import "./app.css";
import Header from "~/components/layout/Header";
import Footer from "~/components/layout/Footer";
import CompareTray from "~/components/CompareTray";
import LoginModal from "~/components/LoginModal";
import LeadPopup from "~/components/LeadPopup";
import FloatingCall from "~/components/FloatingCall";
import Analytics from "~/components/Analytics";
import { ErrorState, LoadingBlock, NotFound } from "~/components/states";
import { citiesQuery, coursesQuery } from "~/lib/queries";
import { USE_MOCK, NOINDEX } from "~/lib/config";

export default function App() {
  // Warm the lead-form data (course list + cities, used to map the typed city to
  // a known slug) in the background after first paint, so the lead/brochure
  // popups open instantly and submit cleanly.
  onMount(() => {
    if (isServer) return;
    const warm = () => {
      void coursesQuery();
      void citiesQuery();
    };
    if ("requestIdleCallback" in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, o?: object) => void })
        .requestIdleCallback(warm, { timeout: 3000 });
    } else {
      setTimeout(warm, 1500);
    }
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          {/* Keep the build out of search indexes site-wide while NOINDEX is on.
              Decoupled from USE_MOCK so the site can run on real data and stay
              unindexed until public launch sets VITE_NOINDEX=false. */}
          <Show when={NOINDEX}>
            <Meta name="robots" content="noindex,nofollow" />
          </Show>
          <a
            href="#main"
            class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-white focus:text-primary-700 focus:px-3 focus:py-2 focus:rounded"
          >
            Skip to content
          </a>
          {/* <Show when={USE_MOCK}>
            <div class="bg-[var(--color-warning)]/15 text-[var(--color-ink)] text-xs text-center px-3 py-1.5 border-b border-[var(--color-warning)]/30">
              Preview build with sample data, for review only. Not live and not indexed.
            </div>
          </Show> */}
          <Header />
          <main id="main" class="min-h-[60vh]">
            <ErrorBoundary
              fallback={(err, reset) =>
                err?.status === 404 ? (
                  // Same 404 page as the catch-all route (consistent everywhere).
                  <NotFound />
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
          <CompareTray />
          <LoginModal />
          <LeadPopup />
          <FloatingCall />
          <Analytics />
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
