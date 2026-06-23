import { A, createAsync, revalidate } from "@solidjs/router";
import { Show, createSignal } from "solid-js";
import { meQuery } from "~/lib/queries";
import { logout } from "~/lib/account";
import { openLogin } from "~/lib/authUi";

/** Header auth control: "Login" when logged out, an account menu when logged in. */
export default function AccountMenu() {
  const user = createAsync(() => meQuery());
  const [open, setOpen] = createSignal(false);

  async function doLogout() {
    setOpen(false);
    await logout();
    await Promise.all([
      revalidate("me"),
      revalidate("saved"),
      revalidate("tracking"),
      revalidate("my-leads"),
    ]);
  }

  return (
    <Show
      when={user()}
      fallback={
        <button
          type="button"
          onClick={() => openLogin()}
          class="rounded-[var(--radius-md)] bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Login
        </button>
      }
    >
      {(u) => (
        <div class="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open()}
            onClick={() => setOpen(!open())}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            class="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] px-3 py-1.5 text-sm font-medium hover:border-primary-300"
          >
            <span class="grid h-6 w-6 place-items-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {(u().name || u().phone || "?").slice(0, 1).toUpperCase()}
            </span>
            <span class="hidden max-w-[8rem] truncate sm:block">{u().name || "My account"}</span>
            <span aria-hidden="true" class="text-[var(--color-muted)]">
              ▾
            </span>
          </button>

          <Show when={open()}>
            <div
              role="menu"
              class="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-lg"
            >
              <A
                href="/account"
                onClick={() => setOpen(false)}
                class="block px-4 py-2.5 text-sm font-medium hover:bg-primary-50"
              >
                Dashboard
              </A>
              <A
                href="/account#saved"
                onClick={() => setOpen(false)}
                class="block px-4 py-2.5 text-sm hover:bg-primary-50"
              >
                Saved colleges
              </A>
              <A
                href="/account#tracker"
                onClick={() => setOpen(false)}
                class="block px-4 py-2.5 text-sm hover:bg-primary-50"
              >
                Application tracker
              </A>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  void doLogout();
                }}
                class="block w-full border-t border-[var(--color-line)] px-4 py-2.5 text-left text-sm font-medium text-[var(--color-danger)] hover:bg-primary-50"
              >
                Log out
              </button>
            </div>
          </Show>
        </div>
      )}
    </Show>
  );
}
