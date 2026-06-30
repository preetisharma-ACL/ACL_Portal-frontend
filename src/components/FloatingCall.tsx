import { Show } from "solid-js";
import { useLocation } from "@solidjs/router";
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from "~/lib/config";

/**
 * Click-to-call button for the School of Management Sciences, Varanasi college
 * page only — the number it dials belongs to that institute, so it must not
 * appear elsewhere. Fixed to the bottom-right on every device; uses the
 * customer-support illustration as its icon. Sits below modals (z-40).
 */
const SMS_COLLEGE_PATH = "/college/school-of-management-sciences-varanasi-varanasi-168";

export default function FloatingCall() {
  const location = useLocation();
  // Show on the college page and any of its sub-tabs (…/placements, etc.).
  const onSmsPage = () =>
    location.pathname === SMS_COLLEGE_PATH ||
    location.pathname.startsWith(`${SMS_COLLEGE_PATH}/`);

  return (
    <Show when={onSmsPage()}>
    <a
      href={`tel:${CONTACT_PHONE_TEL}`}
      aria-label={`Call us at ${CONTACT_PHONE}`}
      title={`Call us: ${CONTACT_PHONE}`}
      class="group fixed bottom-4 right-4 z-40 flex items-center sm:bottom-6 sm:right-6"
    >
      {/* Label pill (expands on hover for pointer devices) */}
      <span class="pointer-events-none mr-2 hidden rounded-full bg-[#0f6fa3] px-3 py-1.5 text-sm font-bold text-white shadow-lg sm:inline-block sm:max-w-0 sm:overflow-hidden sm:opacity-0 sm:transition-all sm:duration-200 sm:group-hover:max-w-[12rem] sm:group-hover:opacity-100">
        Call now
      </span>

      {/* Circular icon with the customer-support illustration */}
      <span class="relative grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-[#d7eef5] shadow-xl ring-2 ring-white transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
        <img
          src="/customer-support.png"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          class="h-full w-full scale-110 object-cover object-top"
        />
        {/* Pulsing ring to draw the eye */}
        <span
          aria-hidden="true"
          class="absolute inset-0 animate-ping rounded-full ring-2 ring-[#1192c4]/50"
          style={{ "animation-duration": "2.5s" }}
        />
        {/* Small green call badge */}
        <span
          aria-hidden="true"
          class="absolute -right-0.5 -top-0.5 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)] text-white ring-2 ring-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
          </svg>
        </span>
      </span>
    </a>
    </Show>
  );
}
