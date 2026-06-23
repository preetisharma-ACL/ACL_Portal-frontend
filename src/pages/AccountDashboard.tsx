import { A, createAsync, revalidate } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import Seo from "~/components/Seo";
import CollegeLogo from "~/components/CollegeLogo";
import { Card, Button } from "~/components/ui";
import { LoadingBlock } from "~/components/states";
import { requireMeQuery, savedQuery, trackingQuery, myLeadsQuery } from "~/lib/queries";
import { updateProfile, unsaveCollege, setTracking } from "~/lib/account";
import { openLogin, TRACKING_LABELS, TRACKING_STATUSES } from "~/lib/authUi";
import { formatFeeRange } from "~/lib/format";
import type { AuthUser, CollegeInterest, MyLead, TrackingStatus } from "~/lib/types";

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-primary-500";

function fmtDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function AccountDashboard() {
  // deferStream so the auth check resolves server-side; requireMeQuery issues a
  // redirect to the login prompt when there is no session (protected page).
  const user = createAsync(() => requireMeQuery(), { deferStream: true });

  return (
    <>
      <Seo title="My Account" description="Your saved colleges, application tracker and enquiries." noindex />
      <Show
        when={user()}
        fallback={
          <Show when={user() === null} fallback={<LoadingBlock label="Loading your account" />}>
            <div class="container-x py-16">
              <div class="mx-auto max-w-md rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center">
                <h1 class="text-xl font-bold">Please log in</h1>
                <p class="mt-2 text-sm text-[var(--color-muted)]">
                  Log in to see your saved colleges, application tracker and enquiries.
                </p>
                <Button variant="accent" size="lg" class="mt-5" onClick={() => openLogin()}>
                  Log in
                </Button>
              </div>
            </div>
          </Show>
        }
      >
        {(u) => <Dashboard user={u()} />}
      </Show>
    </>
  );
}

function Dashboard(props: { user: AuthUser }) {
  return (
    <>
      <section class="bg-gradient-to-br from-primary-900 to-primary-700 text-white">
        <div class="container-x py-8">
          <h1 class="text-2xl md:text-3xl font-extrabold">
            {props.user.name ? `Hello, ${props.user.name}` : "My account"}
          </h1>
          <p class="mt-1 text-white/80">Manage your profile, saved colleges and application tracker.</p>
        </div>
      </section>

      <div class="container-x grid gap-8 py-8 lg:grid-cols-[1fr_1.4fr]">
        <ProfileCard user={props.user} />
        <div class="space-y-8">
          <SavedSection />
          <TrackerSection />
          <LeadHistorySection />
        </div>
      </div>
    </>
  );
}

function ProfileCard(props: { user: AuthUser }) {
  const prefs = (props.user.preferences ?? {}) as { streams?: string[]; cities?: string[] };
  const [name, setName] = createSignal(props.user.name ?? "");
  const [email, setEmail] = createSignal(props.user.email ?? "");
  const [edu, setEdu] = createSignal(props.user.education_background ?? "");
  const [streams, setStreams] = createSignal((prefs.streams ?? []).join(", "));
  const [cities, setCities] = createSignal((prefs.cities ?? []).join(", "));
  const [busy, setBusy] = createSignal(false);
  const [saved, setSaved] = createSignal(false);

  const toList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  async function save(e: SubmitEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await updateProfile({
        name: name().trim(),
        email: email().trim(),
        education_background: edu().trim(),
        preferences: { streams: toList(streams()), cities: toList(cities()) },
      });
      await revalidate("me");
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card class="h-fit p-5 lg:sticky lg:top-20">
      <h2 class="text-lg font-bold">Profile</h2>
      <p class="mt-0.5 text-xs text-[var(--color-muted)]">Mobile: {props.user.phone}</p>
      <form onSubmit={save} class="mt-4 space-y-3">
        <label class="block">
          <span class="mb-1 block text-sm font-medium">Name</span>
          <input class={inputClass} value={name()} onInput={(e) => setName(e.currentTarget.value)} />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium">Email</span>
          <input class={inputClass} type="email" value={email()} onInput={(e) => setEmail(e.currentTarget.value)} />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium">Education background</span>
          <input
            class={inputClass}
            placeholder="e.g. Class 12 (Science), 2025"
            value={edu()}
            onInput={(e) => setEdu(e.currentTarget.value)}
          />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Interested streams</span>
            <input class={inputClass} placeholder="mba, engineering" value={streams()} onInput={(e) => setStreams(e.currentTarget.value)} />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Preferred cities</span>
            <input class={inputClass} placeholder="varanasi, noida" value={cities()} onInput={(e) => setCities(e.currentTarget.value)} />
          </label>
        </div>
        <div class="flex items-center gap-3">
          <Button type="submit" variant="primary" size="md" disabled={busy()}>
            {busy() ? "Saving..." : "Save profile"}
          </Button>
          <Show when={saved()}>
            <span class="text-sm font-medium text-[var(--color-success)]">Saved</span>
          </Show>
        </div>
      </form>
    </Card>
  );
}

function SavedSection() {
  const saved = createAsync(() => savedQuery());
  async function remove(id: number) {
    await unsaveCollege(id);
    await revalidate("saved");
  }
  return (
    <section id="saved" class="scroll-mt-20">
      <h2 class="mb-3 text-xl font-bold">Saved colleges</h2>
      <Show
        when={(saved() ?? []).length}
        fallback={<Empty>You haven't saved any colleges yet.</Empty>}
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <For each={saved()}>
            {(c) => (
              <div class="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                <CollegeLogo name={c.name} logo={c.logo} id={c.id} class="h-10 w-10 rounded-[var(--radius-md)] text-xs" />
                <div class="min-w-0 flex-1">
                  <A href={`/college/${c.slug}-${c.id}`} class="block truncate font-semibold hover:text-primary-700">
                    {c.name}
                  </A>
                  <p class="text-xs text-[var(--color-muted)]">
                    {c.city} · {formatFeeRange(c.fee_range as never) || "Fees on request"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  class="shrink-0 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                >
                  Remove
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>
    </section>
  );
}

function TrackerSection() {
  const tracking = createAsync(() => trackingQuery());
  return (
    <section id="tracker" class="scroll-mt-20">
      <h2 class="mb-1 text-xl font-bold">Application tracker</h2>
      <p class="mb-3 text-xs text-[var(--color-muted)]">
        A personal tracker to organise your shortlist. This is not a real application portal.
      </p>
      <Show
        when={(tracking() ?? []).length}
        fallback={<Empty>You aren't tracking any colleges yet. Set a status on a college page.</Empty>}
      >
        <div class="space-y-3">
          <For each={tracking()}>{(t) => <TrackerRow item={t} />}</For>
        </div>
      </Show>
    </section>
  );
}

function TrackerRow(props: { item: CollegeInterest }) {
  const [status, setStatus] = createSignal<TrackingStatus>(props.item.status);
  const [notes, setNotes] = createSignal(props.item.notes ?? "");
  const [busy, setBusy] = createSignal(false);
  const [saved, setSaved] = createSignal(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      await setTracking({ college_id: props.item.college_id, status: status(), notes: notes() });
      await revalidate("tracking");
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <A
        href={`/college/${props.item.college_slug}-${props.item.college_id}`}
        class="font-semibold hover:text-primary-700"
      >
        {props.item.college_name}
      </A>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <select
          class="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-sm"
          value={status()}
          onChange={(e) => setStatus(e.currentTarget.value as TrackingStatus)}
        >
          <For each={TRACKING_STATUSES}>{(s) => <option value={s}>{TRACKING_LABELS[s]}</option>}</For>
        </select>
        <Button type="button" variant="outline" size="sm" onClick={save} disabled={busy()}>
          {busy() ? "Saving..." : "Update"}
        </Button>
        <Show when={saved()}>
          <span class="text-xs font-medium text-[var(--color-success)]">Saved</span>
        </Show>
      </div>
      <textarea
        class={`${inputClass} mt-2 min-h-[60px]`}
        placeholder="Notes (visa, deadlines, documents...)"
        value={notes()}
        onInput={(e) => setNotes(e.currentTarget.value)}
      />
    </div>
  );
}

function LeadHistorySection() {
  const leads = createAsync(() => myLeadsQuery());
  return (
    <section id="enquiries" class="scroll-mt-20">
      <h2 class="mb-3 text-xl font-bold">Your enquiries</h2>
      <Show
        when={(leads() ?? []).length}
        fallback={<Empty>You haven't made any enquiries yet.</Empty>}
      >
        <ul class="divide-y divide-[var(--color-line)] rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)]">
          <For each={leads()}>
            {(l: MyLead) => (
              <li class="flex items-center justify-between gap-3 p-4">
                <div class="min-w-0">
                  <p class="truncate font-medium">
                    {l.college_name || l.college || l.course_interest || "Guidance enquiry"}
                  </p>
                  <p class="text-xs text-[var(--color-muted)]">
                    {[l.course_interest, l.city].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div class="shrink-0 text-right text-xs text-[var(--color-muted)]">
                  <Show when={l.status}>
                    <span class="block font-semibold text-[var(--color-ink)]/80">{l.status}</span>
                  </Show>
                  {fmtDate(l.created_at)}
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
}

function Empty(props: { children: string }) {
  return (
    <div class="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line)] bg-[var(--color-canvas)] p-6 text-center text-sm text-[var(--color-muted)]">
      {props.children}
    </div>
  );
}
