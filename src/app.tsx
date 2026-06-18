import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { ErrorBoundary, Suspense } from "solid-js";
import "./app.css";
import Header from "~/components/layout/Header";
import Footer from "~/components/layout/Footer";
import Analytics from "~/components/Analytics";
import { NotFound } from "~/components/states";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <a
            href="#main"
            class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-white focus:text-primary-700 focus:px-3 focus:py-2 focus:rounded"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" class="min-h-[60vh]">
            <ErrorBoundary
              fallback={(err) => (
                <NotFound
                  title="Something went wrong"
                  message={
                    err?.status === 404
                      ? "We could not find what you were looking for."
                      : "We hit a problem loading this page. Please try again."
                  }
                />
              )}
            >
              <Suspense>{props.children}</Suspense>
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
