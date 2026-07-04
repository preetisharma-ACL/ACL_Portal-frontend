import { A } from "@solidjs/router";

/**
 * Animated hero promo for the Bihar Student Credit Card landing page
 * (/credit-card-scheme).
 * A moving light "shine" sweeps across the banner and small stars twinkle, to
 * draw the eye just under the hero search bar. Motion is disabled for users who
 * prefer reduced motion. Scoped under `.ccp` so the keyframes never leak.
 */
const CSS = `
@keyframes ccpShine{
  0%{transform:translateX(-180%) skewX(-18deg)}
  55%,100%{transform:translateX(340%) skewX(-18deg)}
}
@keyframes ccpTwinkle{
  0%,100%{opacity:0;transform:scale(.3)}
  50%{opacity:1;transform:scale(1)}
}
.ccp .ccp-shine{
  position:absolute;top:0;bottom:0;left:0;width:32%;pointer-events:none;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);
  animation:ccpShine 3.8s ease-in-out infinite;
}
.ccp .ccp-spark{position:absolute;pointer-events:none;color:#FFD34A;animation:ccpTwinkle 2.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
  .ccp .ccp-shine{animation:none;opacity:0}
  .ccp .ccp-spark{animation:none;opacity:.75}
}
`;

const SPARKS = [
  { top: "16%", left: "20%", size: "11px", delay: "0s" },
  { top: "62%", left: "31%", size: "8px", delay: ".7s" },
  { top: "26%", left: "54%", size: "9px", delay: "1.3s" },
  { top: "70%", left: "68%", size: "7px", delay: ".4s" },
  { top: "20%", left: "84%", size: "10px", delay: "1s" },
];

export default function CreditCardPromo() {
  return (
    <>
      {/* eslint-disable-next-line solid/no-innerhtml */}
      <style innerHTML={CSS} />
      <A
        href="/credit-card-scheme"
        aria-label="Bihar Student Credit Card: study an MBA at 0% interest, up to ₹4 lakh"
        class="ccp group relative mt-4 flex items-center gap-3 overflow-hidden rounded-2xl border border-yellow-300/40 bg-gradient-to-r from-[#0E5A43] via-[#0A4534] to-[#0E5A43] px-4 py-3 shadow-lg ring-1 ring-black/25 transition-transform duration-150 hover:-translate-y-0.5 sm:gap-4 sm:px-5"
      >
        <span class="ccp-shine" aria-hidden="true" />
        {SPARKS.map((s) => (
          <span
            class="ccp-spark"
            aria-hidden="true"
            style={`top:${s.top};left:${s.left};font-size:${s.size};animation-delay:${s.delay}`}
          >
            ✦
          </span>
        ))}

        {/* Card icon */}
        <span class="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-yellow-400 text-[#0A4534] shadow ring-1 ring-black/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20M6 15h4" />
          </svg>
        </span>

        {/* Copy */}
        <span class="relative min-w-0 flex-1">
          <span class="flex items-center gap-2">
            <span class="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0A4534]">
              New
            </span>
            <span class="text-[12px] font-semibold uppercase tracking-[0.12em] text-yellow-200">
              Bihar Student Credit Card
            </span>
          </span>
          <span class="mt-0.5 block truncate text-sm font-bold text-white sm:text-[15px]">
            Study an MBA at 0% interest — up to ₹4 lakh, no collateral
          </span>
        </span>

        {/* CTA */}
        <span class="relative hidden shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-colors group-hover:bg-white/25 sm:inline-flex">
          Explore scheme
          <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
        <span aria-hidden="true" class="relative shrink-0 text-xl font-bold text-yellow-200 sm:hidden">
          →
        </span>
      </A>
    </>
  );
}
