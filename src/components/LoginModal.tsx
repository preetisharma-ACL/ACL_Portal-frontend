import { revalidate, useSearchParams } from "@solidjs/router";
import { Show, createSignal, onMount } from "solid-js";
import Modal from "./Modal";
import { Button } from "./ui";
import { loginOpen, openLogin, closeLogin, runPendingAfterLogin } from "~/lib/authUi";
import { loginRequestOtp, loginVerify } from "~/lib/account";

/**
 * Phone + WhatsApp OTP login (same flow for login and first-time signup). On
 * success the session cookies are set server-side; we revalidate the user/account
 * queries so the whole app reflects the logged-in state, then run any queued
 * action (e.g. completing a save the user attempted while logged out).
 */
export default function LoginModal() {
  const [phone, setPhone] = createSignal("");
  const [otp, setOtp] = createSignal("");
  const [sent, setSent] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");

  // Open automatically when redirected here with ?login=1 (e.g. from /account).
  const [sp, setSp] = useSearchParams();
  onMount(() => {
    if (sp.login) {
      openLogin();
      setSp({ login: undefined });
    }
  });

  const phoneValid = () => /^[6-9]\d{9}$/.test(phone());

  function reset() {
    setPhone("");
    setOtp("");
    setSent(false);
    setError("");
  }

  function onClose() {
    reset();
    closeLogin();
  }

  async function sendOtp() {
    setError("");
    if (!phoneValid()) {
      setError("Enter a valid 10 digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const r = await loginRequestOtp(phone());
      if (r.ok) setSent(true);
      else setError(r.detail || "Could not send the OTP. Please try again.");
    } catch {
      setError("Could not send the OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError("");
    if (otp().trim().length < 4) {
      setError("Enter the code sent to your WhatsApp.");
      return;
    }
    setBusy(true);
    try {
      const r = await loginVerify(phone(), otp());
      if (r.ok) {
        await Promise.all([
          revalidate("me"),
          revalidate("saved"),
          revalidate("tracking"),
          revalidate("my-leads"),
        ]);
        reset();
        closeLogin();
        runPendingAfterLogin();
      } else {
        setError(r.detail || "That code did not match. Please try again.");
      }
    } catch {
      setError("Could not verify the code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none focus-visible:outline-none focus:border-primary-500";

  return (
    <Modal open={loginOpen()} onClose={onClose} title="Log in or sign up">
      <div class="p-5">
        <p class="text-sm text-[var(--color-muted)]">
          Log in with your mobile number. We will send a one time code on WhatsApp. New numbers
          create an account automatically.
        </p>

        <div class="mt-4 space-y-3">
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Mobile number</span>
            <input
              class={inputClass}
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              placeholder="10 digit mobile"
              value={phone()}
              disabled={sent()}
              onInput={(e) => setPhone(e.currentTarget.value.replace(/\D/g, "").slice(0, 10))}
            />
          </label>

          <Show when={sent()}>
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Enter WhatsApp code</span>
              <input
                class={inputClass}
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                placeholder="6 digit code"
                value={otp()}
                onInput={(e) => setOtp(e.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
              />
              <button
                type="button"
                onClick={sendOtp}
                disabled={busy()}
                class="mt-1 text-xs font-medium text-primary-700 hover:underline"
              >
                Resend code
              </button>
            </label>
          </Show>

          <Show when={error()}>
            <p class="text-sm text-[var(--color-danger)]" role="alert">
              {error()}
            </p>
          </Show>

          <Show
            when={sent()}
            fallback={
              <Button
                variant="accent"
                size="lg"
                class="w-full"
                onClick={sendOtp}
                disabled={!phoneValid() || busy()}
              >
                {busy() ? "Sending..." : "Send OTP"}
              </Button>
            }
          >
            <Button
              variant="accent"
              size="lg"
              class="w-full"
              onClick={verify}
              disabled={otp().trim().length < 4 || busy()}
            >
              {busy() ? "Verifying..." : "Verify and continue"}
            </Button>
          </Show>
        </div>

        <p class="mt-4 text-xs text-[var(--color-muted)]">
          By continuing you agree to our Terms and Privacy Policy. We use your number only to
          contact you about your enquiries.
        </p>
      </div>
    </Modal>
  );
}
