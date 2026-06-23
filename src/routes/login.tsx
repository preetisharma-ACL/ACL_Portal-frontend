import { onMount } from "solid-js";
import Seo from "~/components/Seo";
import { Button } from "~/components/ui";
import { openLogin } from "~/lib/authUi";

/** Standalone login entry. Opens the shared login modal; also works as a landing
 *  target for the "login required" redirect. */
export default function LoginRoute() {
  onMount(() => openLogin());
  return (
    <>
      <Seo title="Log in" description="Log in to ACL with your mobile number." noindex />
      <div class="container-x py-16">
        <div class="mx-auto max-w-md rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center">
          <h1 class="text-xl font-bold">Log in to ACL</h1>
          <p class="mt-2 text-sm text-[var(--color-muted)]">
            Log in with your mobile number and a WhatsApp code to save colleges, track applications
            and view your enquiries.
          </p>
          <Button variant="accent" size="lg" class="mt-5" onClick={() => openLogin()}>
            Continue with mobile
          </Button>
        </div>
      </div>
    </>
  );
}
