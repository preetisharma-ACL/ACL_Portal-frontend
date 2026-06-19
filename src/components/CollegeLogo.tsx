import { Show } from "solid-js";

/**
 * College logo with a graceful fallback. When the API provides a real logo it is
 * shown; otherwise a brand-coloured monogram (the college initials) is rendered,
 * so a wall of colleges looks varied and intentional even without real logos.
 * Pass sizing/radius via `class` (applies to both the image and the monogram).
 */
const PALETTE = [
  "bg-primary-600",
  "bg-primary-700",
  "bg-primary-500",
  "bg-accent-500",
  "bg-accent-600",
  "bg-primary-900",
];

function initials(name: string): string {
  const words = name
    .replace(/,.*$/, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  const ls = words.slice(0, 2).map((w) => w[0]).join("");
  return (ls || name.slice(0, 2)).toUpperCase();
}

export default function CollegeLogo(props: {
  name: string;
  logo?: string;
  id: number;
  class?: string;
}) {
  const real = () => !!props.logo && !props.logo.includes("placeholders/");
  const bg = () => PALETTE[Math.abs(props.id) % PALETTE.length];
  const size = () => props.class ?? "w-12 h-12 text-base rounded-[var(--radius-md)]";
  return (
    <Show
      when={real()}
      fallback={
        <span
          class={`grid place-items-center font-extrabold tracking-tight text-white ${bg()} ${size()}`}
          aria-hidden="true"
        >
          {initials(props.name)}
        </span>
      }
    >
      <img
        src={props.logo}
        alt={`${props.name} logo`}
        loading="lazy"
        decoding="async"
        onError={(e) => (e.currentTarget.src = "/placeholders/college-logo.svg")}
        class={`object-contain bg-white border border-[var(--color-line)] ${size()}`}
      />
    </Show>
  );
}
