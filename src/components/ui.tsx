import { A } from "@solidjs/router";
import { splitProps, type JSX, type ParentProps } from "solid-js";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-md)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700",
  accent: "bg-accent-500 text-white hover:bg-accent-600",
  outline: "border border-primary-600 text-primary-700 hover:bg-primary-50",
  ghost: "text-primary-700 hover:bg-primary-50",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-6 py-3",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button(
  props: ParentProps<
    JSX.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
  >,
) {
  const [local, rest] = splitProps(props, ["variant", "size", "class", "children"]);
  return (
    <button
      {...rest}
      class={buttonClass(local.variant, local.size, local.class ?? "")}
    >
      {local.children}
    </button>
  );
}

export function LinkButton(
  props: ParentProps<{ href: string; variant?: Variant; size?: Size; class?: string }>,
) {
  return (
    <A href={props.href} class={buttonClass(props.variant, props.size, props.class ?? "")}>
      {props.children}
    </A>
  );
}

export function Card(props: ParentProps<{ class?: string }>) {
  return (
    <div
      class={`bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-lg)] ${props.class ?? ""}`}
    >
      {props.children}
    </div>
  );
}

export function Badge(props: ParentProps<{ tone?: "neutral" | "primary" | "success" }>) {
  const tone = props.tone ?? "neutral";
  const tones = {
    neutral: "bg-[var(--color-canvas)] text-[var(--color-muted)] border-[var(--color-line)]",
    primary: "bg-primary-50 text-primary-700 border-primary-100",
    success: "bg-[var(--color-canvas)] text-[var(--color-success)] border-[var(--color-line)]",
  };
  return (
    <span
      class={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${tones[tone]}`}
    >
      {props.children}
    </span>
  );
}

export function Rating(props: { value: number }) {
  return (
    <span class="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-warning)]">
      <span aria-hidden="true">★</span>
      <span class="text-[var(--color-ink)]">{props.value.toFixed(1)}</span>
    </span>
  );
}

export function Section(
  props: ParentProps<{ class?: string; bg?: "canvas" | "surface" | "primary" }>,
) {
  const bg =
    props.bg === "surface"
      ? "bg-[var(--color-surface)]"
      : props.bg === "primary"
        ? "bg-primary-900 text-white"
        : "bg-[var(--color-canvas)]";
  return (
    <section class={`${bg} ${props.class ?? ""}`}>
      <div class="container-x py-10 md:py-14">{props.children}</div>
    </section>
  );
}
