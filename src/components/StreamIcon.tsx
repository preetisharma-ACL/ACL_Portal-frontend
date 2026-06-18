/** Maps a stream to a simple glyph. Decorative, so hidden from assistive tech. */
const ICONS: Record<string, string> = {
  mba: "💼",
  engineering: "⚙️",
  medical: "🩺",
  law: "⚖️",
  arts: "🎨",
  commerce: "📊",
  science: "🔬",
  design: "✏️",
};

export default function StreamIcon(props: { slug: string; class?: string }) {
  return (
    <span aria-hidden="true" class={props.class ?? "text-2xl"}>
      {ICONS[props.slug] ?? "📚"}
    </span>
  );
}
