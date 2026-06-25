import { A, revalidate, useSearchParams } from "@solidjs/router";
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

  const fieldShell =
    "flex items-center gap-3 rounded-[var(--radius-sm)] border-2 border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 transition-colors focus-within:border-primary-500";
  const fieldInput =
    "w-full min-w-0 bg-transparent text-[15px] text-[var(--color-ink)] outline-none focus-visible:outline-none placeholder:text-[var(--color-muted)]/70";
  const ctaClass =
    "w-full rounded-[var(--radius-sm)] bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-base font-bold uppercase tracking-wide text-white transition-all duration-150 hover:-translate-y-0.5 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 active:translate-y-0 active:scale-[0.99] active:from-accent-600 active:via-accent-500 active:to-accent-600 disabled:opacity-60";

  // WhatsApp glyph + a small spinner, as factories (fresh node per call).
  const waIcon = (cls: string) => (
    <svg viewBox="0 0 24 24" fill="currentColor" class={cls} aria-hidden="true">
      <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1a7.9 7.9 0 0 0 3.8.97h.004A7.94 7.94 0 0 0 17.6 6.32ZM12.05 18.5h-.003a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.49.65.66-2.43-.16-.25a6.59 6.59 0 1 1 5.6 3.09Zm3.62-4.94c-.2-.1-1.17-.58-1.35-.64-.18-.07-.31-.1-.44.1-.13.2-.5.64-.62.77-.11.13-.23.15-.43.05a5.4 5.4 0 0 1-1.59-.98 6 6 0 0 1-1.1-1.37c-.11-.2 0-.3.09-.4.09-.09.2-.23.3-.35.1-.12.13-.2.2-.34.06-.13.03-.25-.02-.35-.05-.1-.44-1.07-.6-1.46-.16-.38-.32-.33-.44-.34h-.38c-.13 0-.34.05-.52.25-.18.2-.68.67-.68 1.63s.7 1.9.8 2.03c.1.13 1.38 2.11 3.35 2.96.47.2.83.32 1.11.41.47.15.9.13 1.23.08.38-.06 1.17-.48 1.33-.94.17-.46.17-.86.12-.94-.05-.08-.18-.13-.38-.23Z" />
    </svg>
  );
  const spinner = () => (
    <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
    </svg>
  );

  return (
    <Modal open={loginOpen()} onClose={onClose} title="Log in or sign up" hideHeader>
      {/* Branded header */}
      <div class="bg-gradient-to-b from-primary-50 via-primary-50/40 to-[var(--color-surface)] px-5 pt-5 pb-4 sm:px-6">
        <img src="/acl-logo.png" alt="ACL Education" class="h-9 w-auto" />
        <h2 class="mt-3 pr-9 text-xl font-extrabold leading-tight tracking-tight text-[var(--color-ink)]">
          Log in or sign up
        </h2>
        <p class="mt-1 text-sm text-[var(--color-muted)]">
          Sign in with your mobile number, we will send a one time code on WhatsApp.
        </p>
      </div>

      <div class="px-5 pb-5 sm:px-6">
        {/* WhatsApp reassurance */}
        <div class="flex items-center gap-2.5 rounded-[var(--radius-md)] bg-[#25D366]/10 px-3 py-2.5 text-[13px] text-[var(--color-ink)]/80">
          {waIcon("h-5 w-5 shrink-0 text-[#25D366]")}
          <span>New numbers create an account automatically. No password needed.</span>
        </div>

        <div class="mt-4 space-y-3">
          {/* Mobile number */}
          <label class="block">
            <span class="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">
              Mobile number
            </span>
            <div class={`${fieldShell} ${sent() ? "opacity-60" : ""}`}>
              <span class="flex shrink-0 items-center gap-1.5">
                <span class="flex h-3.5 w-5 flex-col overflow-hidden rounded-[2px] ring-1 ring-black/10" aria-hidden="true">
                  <span class="h-1/3 bg-[#ff9933]" />
                  <span class="h-1/3 bg-white" />
                  <span class="h-1/3 bg-[#138808]" />
                </span>
                <span class="text-sm font-medium text-[var(--color-ink)]">+91</span>
              </span>
              <input
                class={fieldInput}
                type="tel"
                inputmode="numeric"
                autocomplete="tel"
                maxlength="10"
                placeholder="10 digit mobile"
                value={phone()}
                disabled={sent()}
                onInput={(e) => setPhone(e.currentTarget.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          </label>

          <Show when={sent()}>
            <label class="block">
              <span class="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">
                Enter WhatsApp code
              </span>
              <div class={fieldShell}>
                {waIcon("h-5 w-5 shrink-0 text-[#25D366]")}
                <input
                  class={`${fieldInput} font-semibold tracking-[0.3em]`}
                  type="text"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  placeholder="6 digit code"
                  value={otp()}
                  onInput={(e) => setOtp(e.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <div class="mt-1.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  class="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                >
                  Change number
                </button>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={busy()}
                  class="text-xs font-semibold text-primary-700 hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </label>
          </Show>

          <Show when={error()}>
            <p
              class="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-2.5 text-sm text-[var(--color-danger)]"
              role="alert"
            >
              <span aria-hidden="true" class="mt-0.5">⚠</span>
              <span>{error()}</span>
            </p>
          </Show>

          <Show
            when={sent()}
            fallback={
              <Button variant="primary" size="lg" class={ctaClass} onClick={sendOtp} disabled={busy()}>
                <Show
                  when={!busy()}
                  fallback={<span class="inline-flex items-center gap-2">{spinner()} Sending…</span>}
                >
                  Send OTP
                </Show>
              </Button>
            }
          >
            <Button variant="primary" size="lg" class={ctaClass} onClick={verify} disabled={busy()}>
              <Show
                when={!busy()}
                fallback={<span class="inline-flex items-center gap-2">{spinner()} Verifying…</span>}
              >
                Verify and continue
              </Show>
            </Button>
          </Show>
        </div>

        <p class="mt-4 text-center text-xs text-[var(--color-muted)]">
          By continuing you agree to our{" "}
          <A href="/terms" class="font-medium text-primary-700 hover:underline">Terms</A> and{" "}
          <A href="/privacy-policy" class="font-medium text-primary-700 hover:underline">
            Privacy Policy
          </A>
          . We use your number only to contact you about your enquiries.
        </p>
      </div>
    </Modal>
  );
}
