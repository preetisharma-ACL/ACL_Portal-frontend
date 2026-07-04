import { createSignal, onMount, For, Show } from "solid-js";
import { isServer } from "solid-js/web";
import { Link } from "@solidjs/meta";
import Seo from "~/components/Seo";
import { submitLeadAction } from "~/lib/actions";
import { citiesQuery } from "~/lib/queries";
import { CONSENT_TEXT_VERSION } from "~/lib/config";
import { slugify } from "~/lib/slug";
import { track } from "~/lib/analytics";
import type { LeadPayload } from "~/lib/types";

/**
 * Standalone "Bihar Student Credit Card MBA colleges" landing page.
 *
 * Ported 1:1 from a self-contained HTML/CSS design (railway-ticket theme). The
 * page ships its own masthead, marquee and footer, so app.tsx suppresses the
 * global site Header/Footer for the /bihar-students-BSCC-scheme route. CSS is scoped under the
 * `.bihar` wrapper so the design's global-ish selectors (body, h1, .btn, .tag …)
 * never leak into the rest of the Tailwind-based site.
 */

const PAGE_CSS = `
html{scroll-behavior:smooth}

.bihar{
  /* Remapped to the project brand tokens (crimson primary, navy accent, yellow
     kept as an accent per request). Swaps here re-skin the whole page. */
  --paper:var(--color-canvas); --paper-2:var(--color-accent-50); --white:var(--color-surface);
  --ink:var(--color-ink); --ink-soft:var(--color-muted);
  --rail:var(--color-accent-500); --rail-dk:var(--color-accent-700);
  --signal:#f6b301; --signal-dk:#c98a00; --stamp:var(--color-primary-700);
  --line:var(--color-line); --board:var(--color-accent-600); --led:#f7c948;
  --ok:var(--color-success); --radius:var(--radius-lg);
  font-family:var(--font-sans); color:var(--ink);
  background:
    repeating-linear-gradient(0deg, rgba(10,23,48,.02) 0 1px, transparent 1px 5px),
    var(--paper);
  line-height:1.55; -webkit-font-smoothing:antialiased;
}
.bihar *{box-sizing:border-box;margin:0;padding:0}
.bihar .wrap{max-width:1140px;margin:0 auto;padding:0 22px}
.bihar a{color:inherit;text-decoration:none}
.bihar .disp{font-family:var(--font-display)}
.bihar .mono{font-family:var(--font-sans)}
.bihar .deva{font-family:'Noto Sans Devanagari',var(--font-sans)}
.bihar h1,.bihar h2,.bihar h3{font-family:var(--font-display);color:var(--ink);letter-spacing:-.01em}
.bihar :focus-visible{outline:3px solid var(--stamp);outline-offset:2px;border-radius:4px}

/* ============ Departure-board marquee ============ */
.bihar .board{background:var(--board);border-bottom:3px solid var(--ink);overflow:hidden}
.bihar .board .track{display:flex;width:max-content;animation:biharRoll 30s linear infinite}
.bihar .board .set{display:flex;align-items:center;gap:34px;padding:11px 17px;white-space:nowrap;
  font-family:var(--font-sans);font-size:.8rem;font-weight:600;letter-spacing:.12em;color:var(--led)}
.bihar .board .set .st{color:#5E6A5F}
@keyframes biharRoll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.bihar .board .track{animation:none}}

/* ============ Masthead ============ */
.bihar .masthead{border-bottom:1.5px solid var(--ink);background:var(--paper)}
.bihar .masthead .wrap{display:flex;align-items:center;justify-content:space-between;height:58px}
.bihar .logo{display:flex;align-items:center;gap:10px;font-family:var(--font-display);font-weight:700;font-size:1.05rem}
.bihar .logo .sig{width:14px;height:14px;border-radius:50%;background:var(--signal);border:2px solid var(--ink)}
.bihar .masthead .route{font-family:var(--font-sans);font-size:.72rem;letter-spacing:.1em;color:var(--ink-soft)}
.bihar .masthead .route b{color:var(--rail);font-weight:600}

/* ============ Hero ============ */
.bihar .hero{padding:58px 0 54px;border-bottom:1.5px solid var(--ink);position:relative;overflow:hidden}
.bihar .hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:52px;align-items:start}
.bihar .kicker{display:inline-flex;align-items:center;gap:10px;background:var(--ink);color:var(--signal);
  font-family:var(--font-sans);font-size:.72rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
  padding:7px 13px;border-radius:4px;margin-bottom:20px}
.bihar .kicker .hi{color:#fff}
.bihar .hero h1{font-size:clamp(2.5rem,5.4vw,4.3rem);font-weight:800;line-height:.98;margin-bottom:18px}
.bihar .hero h1 .mark{background:linear-gradient(180deg,transparent 58%,var(--signal) 58%);padding:0 2px}
.bihar .hero h1 .green{color:var(--stamp)}
.bihar .hero .lede{font-size:1.08rem;color:var(--ink-soft);max-width:44ch;margin-bottom:10px}
.bihar .hero .lede b{color:var(--ink);font-weight:700}
.bihar .hinglish{font-family:'Noto Sans Devanagari';font-size:1rem;font-weight:600;color:var(--rail);margin-bottom:22px}
.bihar .fare-tags{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:26px}
.bihar .tag{font-family:var(--font-sans);font-size:.74rem;font-weight:600;letter-spacing:.04em;
  border:1.5px solid var(--ink);background:var(--white);padding:7px 12px;border-radius:6px}
.bihar .tag b{color:var(--stamp)}

/* route strip */
.bihar .route-strip{border:1.5px solid var(--ink);background:var(--white);border-radius:10px;padding:16px 18px 14px;max-width:520px}
.bihar .route-strip .rl{font-family:var(--font-sans);font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:12px}
.bihar .stops{display:flex;align-items:flex-start}
.bihar .stop{flex:1;position:relative;padding-right:10px}
.bihar .stop:not(:last-child):after{content:"";position:absolute;top:7px;right:2px;left:calc(100% - 34px);height:0;
  border-top:2px dashed var(--ink);opacity:.4;width:30px}
.bihar .stop .sd{width:14px;height:14px;border-radius:50%;background:var(--white);border:3px solid var(--rail);margin-bottom:7px}
.bihar .stop.home .sd{background:var(--signal);border-color:var(--ink)}
.bihar .stop .sc{font-weight:700;font-size:.86rem;line-height:1.2}
.bihar .stop .sk{font-family:var(--font-sans);font-size:.66rem;color:var(--ink-soft)}

/* Education pass */
.bihar .hero-side{display:flex;flex-direction:column;gap:18px}
.bihar .pass{position:relative;border:2px solid var(--ink);border-radius:14px;overflow:hidden;
  background:linear-gradient(160deg,var(--rail) 0%,var(--rail-dk) 100%);color:#F3EFDF;
  }
.bihar .pass .band{background:var(--signal);color:var(--ink);display:flex;justify-content:space-between;align-items:center;
  padding:9px 16px;border-bottom:2px solid var(--ink)}
.bihar .pass .band .bt{font-family:var(--font-display);font-weight:800;font-size:.95rem;letter-spacing:.02em}
.bihar .pass .band .bn{font-family:var(--font-sans);font-size:.68rem;font-weight:600;letter-spacing:.12em}
.bihar .pass .body{padding:18px 18px 16px;position:relative}
.bihar .pass .holes{position:absolute;left:0;top:0;bottom:0;width:16px;display:flex;flex-direction:column;justify-content:space-evenly;align-items:center}
.bihar .pass .holes i{width:7px;height:7px;border-radius:50%;background:var(--paper);border:1.5px solid var(--ink);display:block}
.bihar .pass .rows{margin-left:16px;display:grid;grid-template-columns:1fr 1fr;gap:13px 18px}
.bihar .pass .pr .k{font-family:var(--font-sans);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;color:#BBD2C4}
.bihar .pass .pr .v{font-family:var(--font-display);font-weight:700;font-size:1.05rem;color:#fff}
.bihar .pass .pr .v.big{font-size:1.9rem;line-height:1.05}
.bihar .pass .pr .v .zero{color:var(--signal)}
.bihar .pass .foot{margin-left:16px;margin-top:15px;padding-top:11px;border-top:1.5px dashed rgba(243,239,223,.35);
  display:flex;justify-content:space-between;align-items:center}
.bihar .pass .foot .yj{font-family:var(--font-sans);font-size:.64rem;letter-spacing:.1em;color:#BBD2C4}
.bihar .pass .foot .stamp-mini{font-family:var(--font-sans);font-size:.62rem;font-weight:600;letter-spacing:.08em;
  border:1.5px solid var(--signal);color:var(--signal);padding:3px 8px;border-radius:4px;transform:rotate(-3deg)}
.bihar .passcap{font-family:var(--font-sans);font-size:.66rem;color:var(--ink-soft);text-align:center}

/* Reservation (lead) form */
.bihar .resform{border:2px solid var(--ink);border-radius:14px;background:var(--white);overflow:hidden}
.bihar .resform .fhead{background:var(--ink);color:var(--paper);display:flex;justify-content:space-between;align-items:center;padding:11px 16px}
.bihar .resform .fhead .ft{font-family:var(--font-display);font-weight:700;font-size:1.02rem}
.bihar .resform .fhead .free{font-family:var(--font-sans);font-size:.64rem;font-weight:600;letter-spacing:.14em;color:var(--signal);border:1px solid var(--signal);padding:3px 8px;border-radius:4px}
.bihar .resform .fbody{padding:16px}
.bihar .resform p.sub{font-size:.84rem;color:var(--ink-soft);margin-bottom:13px}
.bihar .frow{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.bihar .field{margin-bottom:10px}
.bihar .field label{display:block;font-family:var(--font-sans);font-size:.62rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:5px}
.bihar .field input,.bihar .field select{width:100%;font-family:var(--font-sans);font-size:.9rem;color:var(--ink);background:var(--paper);
  border:1.5px solid var(--ink);border-radius:7px;padding:10px 11px;transition:box-shadow .15s}
.bihar .field input:focus,.bihar .field select:focus{outline:none;box-shadow:3px 3px 0 var(--signal)}
.bihar .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--font-display);
  font-size:1rem;font-weight:700;border:2px solid var(--ink);cursor:pointer;border-radius:9px;padding:12px 20px;width:100%;
  background:var(--stamp);color:#fff;transition:transform .08s}
.bihar .btn:hover{transform:translate(-1px,-1px)}
.bihar .btn:active{transform:translate(1px,1px)}
.bihar .btn.alt{background:var(--signal);color:var(--ink)}
.bihar .callbtn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--font-display);
  font-size:.95rem;font-weight:700;border:2px solid var(--stamp);background:var(--stamp);color:#fff;
  border-radius:9px;padding:11px 18px;cursor:pointer;transition:transform .08s,background .15s}
.bihar .callbtn:hover{background:var(--color-primary-600);border-color:var(--color-primary-600);transform:translateY(-1px)}
.bihar .callbtn svg{flex-shrink:0}
.bihar .fbody .callbtn{width:100%}
.bihar .cta-actions .callbtn{width:100%}
.bihar .callbtn.ghost{background:transparent;border-color:#fff;color:#fff}
.bihar .callbtn.ghost:hover{background:rgba(255,255,255,.12);border-color:#fff}
.bihar .callrow{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:26px}
.bihar .callnote{font-family:var(--font-sans);font-size:.82rem;color:var(--ink-soft)}
.bihar .callsplit{display:flex;align-items:center;gap:10px;margin-top:12px;font-family:var(--font-sans);font-size:.72rem;color:var(--ink-soft)}
.bihar .callsplit:before,.bihar .callsplit:after{content:"";flex:1;height:1px;background:var(--line)}
.bihar .fineprint{font-family:var(--font-sans);font-size:.64rem;color:var(--ink-soft);text-align:center;margin-top:10px}
.bihar .consent{display:flex;gap:9px;align-items:flex-start;font-family:var(--font-sans);font-size:.72rem;line-height:1.45;color:var(--ink-soft);margin:2px 0 12px;cursor:pointer}
.bihar .consent input{margin-top:2px;width:15px;height:15px;flex-shrink:0;accent-color:var(--rail)}
.bihar .consent a{color:var(--stamp);border-bottom:1px solid var(--stamp)}
.bihar .formerr{font-family:var(--font-sans);font-size:.68rem;line-height:1.4;color:var(--stamp);background:rgba(198,59,43,.08);border:1.5px solid var(--stamp);border-radius:7px;padding:8px 10px;margin-bottom:11px}
.bihar .btn[disabled]{opacity:.6;cursor:not-allowed}
.bihar .btn[disabled]:hover{transform:none}
.bihar .thanks{text-align:center;padding:26px 12px}
.bihar .thanks .tick{width:54px;height:54px;border-radius:50%;background:var(--rail);color:var(--signal);border:2px solid var(--ink);
  display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 12px}
.bihar .thanks h3{font-size:1.5rem;margin-bottom:6px}
.bihar .thanks p{font-size:.88rem;color:var(--ink-soft)}

/* ============ Scheme section ============ */
.bihar .scheme{padding:58px 0;border-bottom:1.5px solid var(--ink);background:var(--paper-2)}
.bihar .shead{max-width:700px;margin:0 auto 32px;text-align:center}
.bihar .shead .eyeline{font-family:var(--font-sans);font-size:.68rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--stamp);margin-bottom:10px}
.bihar .shead h2{font-size:clamp(1.9rem,3.8vw,2.8rem);font-weight:800;line-height:1.04}
.bihar .shead p{font-size:1rem;color:var(--ink-soft);margin-top:12px}

.bihar .farechart{display:grid;grid-template-columns:repeat(4,1fr);border:2px solid var(--ink);border-radius:12px;overflow:hidden;background:var(--white);margin-bottom:34px}
.bihar .fc{padding:22px 18px;text-align:center;border-right:1.5px dashed var(--line)}
.bihar .fc:last-child{border-right:none}
.bihar .fc .v{font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--rail);line-height:1}
.bihar .fc .v small{font-size:.95rem;font-weight:700;color:var(--ink-soft)}
.bihar .fc .k{font-family:var(--font-sans);font-size:.68rem;letter-spacing:.04em;color:var(--ink-soft);margin-top:7px}

.bihar .how{display:grid;grid-template-columns:1.08fr .92fr;gap:36px;align-items:start}
.bihar .how h3{font-size:1.65rem;font-weight:700;margin-bottom:6px}
.bihar .how .lead{font-size:.94rem;color:var(--ink-soft);margin-bottom:18px}
.bihar .halts{counter-reset:halt;list-style:none}
.bihar .halts li{position:relative;padding:0 0 18px 48px;counter-increment:halt}
.bihar .halts li:before{content:counter(halt,decimal-leading-zero);position:absolute;left:0;top:1px;width:34px;height:34px;border-radius:8px;
  background:var(--signal);border:2px solid var(--ink);color:var(--ink);font-family:var(--font-sans);font-size:.8rem;font-weight:600;
  display:flex;align-items:center;justify-content:center}
.bihar .halts li:not(:last-child):after{content:"";position:absolute;left:16px;top:40px;bottom:2px;border-left:2px dashed var(--ink);opacity:.35}
.bihar .halts li b{display:block;font-family:var(--font-display);font-weight:700;font-size:1rem}
.bihar .halts li span{font-size:.88rem;color:var(--ink-soft)}
.bihar .halts li a{color:var(--stamp);font-weight:700;border-bottom:1.5px solid var(--stamp)}
.bihar .helpline{margin-top:8px;font-family:var(--font-sans);font-size:.78rem;color:var(--ink-soft)}
.bihar .helpline b{color:var(--ink)}

.bihar .elig{border:2px solid var(--ink);border-radius:12px;background:var(--rail);color:#EAF1E7;padding:24px;}
.bihar .elig .et{font-family:var(--font-display);font-size:1.35rem;font-weight:700;color:#fff;margin-bottom:14px}
.bihar .elig ul{list-style:none;display:flex;flex-direction:column;gap:11px}
.bihar .elig li{font-size:.9rem;display:flex;gap:11px;align-items:flex-start;color:#DCE8DB}
.bihar .elig li .ok{color:var(--signal);font-weight:700;flex-shrink:0}
.bihar .elig .verify{margin-top:16px;padding-top:13px;border-top:1.5px dashed rgba(255,255,255,.3);font-size:.8rem;color:#BBD2C4}
.bihar .elig .verify b{color:var(--signal)}

/* ============ Listing ============ */
.bihar .listing{padding:60px 0 44px}
.bihar .listing .shead .eyeline{color:var(--rail)}

/* Station signboard region divider */
.bihar .signboard{max-width:640px;margin:46px auto 26px;background:var(--stamp);color:#fff;border:2.5px solid var(--ink);border-radius:8px;
  padding:13px 20px 12px;text-align:center;position:relative}
.bihar .signboard:before,.bihar .signboard:after{content:"";position:absolute;top:-14px;width:3px;height:14px;background:var(--ink)}
.bihar .signboard:before{left:26%}
.bihar .signboard:after{right:26%}
.bihar .signboard .en{font-family:var(--font-display);font-weight:800;font-size:1.45rem;letter-spacing:.06em;text-transform:uppercase;line-height:1.05}
.bihar .signboard .hi{font-family:'Noto Sans Devanagari';font-weight:700;font-size:.98rem}
.bihar .signboard .dist{font-family:var(--font-sans);font-size:.68rem;font-weight:600;letter-spacing:.1em;margin-top:3px;color:rgba(255,255,255,.82)}

/* Boarding-pass college cards */
.bihar .ticket{position:relative;display:grid;grid-template-columns:76px 1fr 250px;background:var(--white);
  border:2px solid var(--ink);border-radius:var(--radius);margin-bottom:20px;overflow:hidden;
  transition:transform .18s}
.bihar .ticket:hover{transform:translateY(-3px)}
.bihar .stub{background:var(--rail);color:#EAF1E7;display:flex;flex-direction:column;align-items:center;justify-content:space-between;
  padding:14px 6px;border-right:2px dashed var(--paper)}
.bihar .stub .sk{font-family:var(--font-sans);font-size:.56rem;letter-spacing:.2em;writing-mode:vertical-rl;transform:rotate(180deg);color:#BBD2C4}
.bihar .stub .num{font-family:var(--font-display);font-size:1.8rem;font-weight:800;color:#fff;line-height:1}
.bihar .stub .punch{width:10px;height:10px;border-radius:50%;background:var(--paper);border:1.5px solid var(--ink)}

.bihar .tbody{padding:20px 24px 18px;min-width:0}
.bihar .toprow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.bihar .naac{font-family:var(--font-sans);font-size:.62rem;font-weight:600;letter-spacing:.1em;background:var(--ink);color:var(--paper);padding:4px 9px;border-radius:5px}
.bihar .naac.aplus{background:var(--rail)}
.bihar .naac.appp{background:var(--stamp)}
.bihar .badge{font-family:var(--font-sans);font-size:.64rem;font-weight:600;letter-spacing:.04em;color:var(--ink-soft);border:1.5px solid var(--line);background:var(--paper);padding:4px 9px;border-radius:100px}
.bihar .tbody h3{font-size:1.5rem;font-weight:700;line-height:1.1;margin:2px 0 3px}
.bihar .loc{font-family:var(--font-sans);font-size:.72rem;color:var(--ink-soft);margin-bottom:12px}
.bihar .loc b{color:var(--stamp)}
.bihar .why{font-size:.92rem;color:var(--ink);margin-bottom:14px;max-width:58ch}
.bihar .datastrip{display:flex;flex-wrap:wrap;gap:0;border:1.5px solid var(--line);border-radius:8px;overflow:hidden;background:var(--paper)}
.bihar .ds{flex:1;min-width:130px;padding:10px 13px;border-right:1.5px dashed var(--line)}
.bihar .ds:last-child{border-right:none}
.bihar .ds .k{font-family:var(--font-sans);font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft)}
.bihar .ds .v{font-family:var(--font-sans);font-size:.84rem;font-weight:600;color:var(--ink);margin-top:1px}
.bihar .recruit{font-size:.74rem;color:var(--ink-soft);margin-top:11px}
.bihar .recruit b{font-family:var(--font-sans);font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);margin-right:6px}

.bihar .fare{border-left:2px dashed var(--ink);position:relative;background:var(--paper);padding:20px 20px 18px;
  display:flex;flex-direction:column;justify-content:space-between;gap:14px}
.bihar .fare:before,.bihar .fare:after{content:"";position:absolute;left:-9px;width:16px;height:16px;border-radius:50%;background:var(--white);border:2px solid var(--ink)}
.bihar .fare:before{top:-9px;background:var(--paper)}
.bihar .fare:after{bottom:-9px;background:var(--paper)}
.bihar .fare .fk{font-family:var(--font-sans);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft)}
.bihar .fare .fv{font-family:var(--font-display);font-size:1.85rem;font-weight:800;color:var(--ink);line-height:1.05}
.bihar .fare .fv small{font-size:.85rem;font-weight:700;color:var(--ink-soft)}
.bihar .fare .fh{font-family:var(--font-sans);font-size:.68rem;color:var(--ink-soft)}
.bihar .fare .fh b{color:var(--stamp)}
.bihar .stampmark{align-self:flex-start;font-family:var(--font-sans);font-size:.62rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  padding:6px 10px;border:2px solid currentColor;border-radius:6px;transform:rotate(-4deg);line-height:1.25}
.bihar .stampmark.full{color:var(--ok)}
.bihar .stampmark.part{color:var(--signal-dk)}
.bihar .fare .cta{display:inline-flex;align-items:center;justify-content:center;gap:7px;font-family:var(--font-display);font-size:.9rem;font-weight:700;
  background:var(--ink);color:var(--paper);padding:11px 14px;border-radius:8px;border:2px solid var(--ink);cursor:pointer;transition:background .15s,color .15s}
.bihar .fare .cta:hover{background:var(--stamp);border-color:var(--stamp);color:#fff}

/* Featured ticket */
.bihar .ticket.featured{border-width:2.5px}
.bihar .ticket.featured .stub{background:var(--stamp)}
.bihar .ticket.featured .stub .sk{color:#F2C9C2}
.bihar .fribbon{grid-column:1 / -1;background:var(--signal);border-bottom:2px solid var(--ink);
  display:flex;align-items:center;gap:10px;padding:8px 22px;
  font-family:var(--font-sans);font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.bihar .fribbon .note{margin-left:auto;text-transform:none;letter-spacing:.02em;font-weight:500;color:#4A3B04}
.bihar .ticket.featured .fare{background:#FBF3DD}
.bihar .ticket.featured .fare .cta{background:var(--stamp);border-color:var(--stamp);color:#fff}
.bihar .ticket.featured .fare .cta:hover{background:var(--rail);border-color:var(--rail)}

/* ============ Bottom CTA ============ */
.bihar .bottomcta{background:var(--board);color:#EDEADF;padding:58px 0;border-top:3px solid var(--ink)}
.bihar .bottomcta .inner{display:grid;grid-template-columns:1fr auto;gap:36px;align-items:center}
.bihar .bottomcta h2{font-size:clamp(1.9rem,3.6vw,2.8rem);font-weight:800;color:#fff;line-height:1.05;max-width:22ch}
.bihar .bottomcta h2 .y{color:var(--signal)}
.bihar .bottomcta p{color:#A9B3A6;font-size:1rem;margin-top:12px;max-width:50ch}
.bihar .cta-actions{display:flex;flex-direction:column;gap:12px;min-width:240px}
.bihar .bottomcta .btn.alt{box-shadow:none}
.bihar .bottomcta .btn.ghost{background:transparent;color:#fff;border-color:#fff;box-shadow:none}
.bihar .bottomcta .btn.ghost:hover{background:rgba(255,255,255,.08)}

/* ============ Footer ============ */

/* ============ Responsive ============ */
@media (max-width:960px){
  .bihar .hero-grid{grid-template-columns:1fr;gap:34px}
  .bihar .farechart{grid-template-columns:repeat(2,1fr)}
  .bihar .fc:nth-child(2){border-right:none}
  .bihar .fc:nth-child(1),.bihar .fc:nth-child(2){border-bottom:1.5px dashed var(--line)}
  .bihar .how{grid-template-columns:1fr;gap:26px}
  .bihar .ticket{grid-template-columns:64px 1fr}
  .bihar .fare{grid-column:1 / -1;border-left:none;border-top:2px dashed var(--ink);flex-direction:row;align-items:center;flex-wrap:wrap}
  .bihar .fare:before{top:auto;bottom:auto;left:-9px;top:-9px}
  .bihar .fare:after{left:auto;right:-9px;top:-9px;bottom:auto}
  .bihar .fare .cta{margin-left:auto}
  .bihar .bottomcta .inner{grid-template-columns:1fr}
}
@media (max-width:580px){
  .bihar .frow{grid-template-columns:1fr}
  .bihar .datastrip{flex-direction:column}
  .bihar .ds{border-right:none;border-bottom:1.5px dashed var(--line)}
  .bihar .ds:last-child{border-bottom:none}
  .bihar .tbody{padding:16px 16px 14px}
  .bihar .stub .num{font-size:1.4rem}
  .bihar .fare{flex-direction:column;align-items:stretch}
  .bihar .fare .cta{margin-left:0;width:100%}
  .bihar .signboard .en{font-size:1.15rem}
  .bihar .masthead .route{display:none}
}
`;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
];

// Course options offered on this BSCC scheme page.
const COURSE_OPTIONS = ["BBA", "MBA", "B.Com", "M.Com", "B.A", "BCA"];

// Counsellor phone number for the "Call Now" buttons on this page.
const CALL_NUMBER = "9511050627";

/** Reusable "Call Now" button linking to the counsellor number. */
function CallNow(props: { ghost?: boolean; label?: string }) {
  return (
    <a class={`callbtn${props.ghost ? " ghost" : ""}`} href={`tel:+91${CALL_NUMBER}`}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      {props.label ?? "Call Now"}
    </a>
  );
}

export default function Bihar() {
  // Form state, wired to the project's real lead pipeline (submitLeadAction ->
  // backend) and using the same fields as the shared LeadForm, so every value
  // maps to a real backend column. Only the markup keeps this page's ticket theme.
  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [mobile, setMobile] = createSignal("");
  const [city, setCity] = createSignal("");
  const [course, setCourse] = createSignal("");
  const [consent, setConsent] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [sent, setSent] = createSignal(false);
  // City list used to map a typed city to a backend slug (the API rejects
  // unknown city strings, so an unmatched city is sent empty).
  const [cities, setCities] = createSignal<{ name: string; slug: string }[]>([]);

  let utm: Record<string, string> = {};
  onMount(() => {
    // Capture UTM/click ids from the URL, persisted across navigation.
    try {
      const stored = JSON.parse(sessionStorage.getItem("acl_utm") || "{}") as Record<string, string>;
      const url = new URLSearchParams(window.location.search);
      const out = { ...stored };
      for (const k of UTM_KEYS) {
        const v = url.get(k);
        if (v) out[k] = v;
      }
      sessionStorage.setItem("acl_utm", JSON.stringify(out));
      utm = out;
    } catch {
      /* sessionStorage/JSON may be unavailable; non-fatal */
    }
    void citiesQuery()
      .then((c) => setCities(c ?? []))
      .catch(() => {});
  });

  /** Smooth-scroll to the reservation form and focus the first field. */
  const jump = (e?: Event) => {
    e?.preventDefault();
    if (typeof document === "undefined") return;
    document.getElementById("lead")?.scrollIntoView({ behavior: "smooth", block: "center" });
    (document.getElementById("name") as HTMLInputElement | null)?.focus();
  };

  const mobileValid = () => /^[6-9]\d{9}$/.test(mobile());

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    if (name().trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!mobileValid()) {
      setError("Please enter a valid 10 digit mobile number.");
      return;
    }
    if (!consent()) {
      setError("Please tick the consent box so a counsellor can call you.");
      return;
    }

    // City is typed freely but the backend needs a known city slug (or empty) —
    // map the typed value to a matching slug, else send empty (never a 400).
    const typedCity = city().trim();
    const citySlug = slugify(typedCity);
    const matchedCity = cities().find(
      (c) => c.slug === citySlug || c.name.toLowerCase() === typedCity.toLowerCase(),
    );
    const safeCity = matchedCity ? matchedCity.slug : "";

    // This page's course list (BBA/MBA/B.Com …) is BSCC-specific and does not map
    // to backend course slugs, so course_interest is left empty and the chosen
    // course is recorded on source_page (stored verbatim) so it is never lost.
    const src = course()
      ? `/bihar-students-BSCC-scheme — course: ${course()}`
      : "/bihar-students-BSCC-scheme";

    const payload: LeadPayload = {
      name: name().trim(),
      mobile: mobile().trim(),
      email: email().trim(),
      city: safeCity,
      course_interest: "",
      qualification: "",
      source_page: src,
      utm,
      consent: { checked: true, text_version: CONSENT_TEXT_VERSION },
      hp_field: "",
    };

    setBusy(true);
    try {
      const res = (await submitLeadAction(payload)) as { status?: string } | null;
      if (res && res.status !== "rejected") {
        if (!isServer) {
          try {
            sessionStorage.setItem("acl_lead_ts", String(Date.now()));
          } catch {
            /* non-fatal */
          }
        }
        track("lead_submit", { source_page: payload.source_page, course: course() });
        setSent(true);
      } else {
        setError("We could not submit your request. Please try again.");
      }
    } catch (err) {
      console.error("Bihar lead submit failed", err);
      setError("Something went wrong submitting your request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo
        title="Bihar Student Credit Card MBA Colleges | Top 10 NAAC A+ Colleges for Bihar Students | ACL Portal"
        description="For students of Bihar. Use your Bihar Student Credit Card (up to Rs 4 lakh, 0% interest) to study an MBA or PGDM at a NAAC A, A+ or A++ college in Varanasi, Lucknow and Delhi NCR."
        canonical="/bihar-students-BSCC-scheme"
      />
      <Link rel="preconnect" href="https://fonts.googleapis.com" />
      <Link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
      <Link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@600;700&display=swap"
      />
      {/* eslint-disable-next-line solid/no-innerhtml */}
      <style innerHTML={PAGE_CSS} />

      <div class="bihar">
        {/* Departure-board marquee */}
        <div class="board" aria-hidden="true">
          <div class="track">
            <div class="set">
              <span>FOR STUDENTS OF BIHAR</span><span class="st">◆</span>
              <span class="deva">बिहार के छात्रों के लिए</span><span class="st">◆</span>
              <span>UP TO ₹4,00,000</span><span class="st">◆</span>
              <span>0% INTEREST</span><span class="st">◆</span>
              <span>NO COLLATERAL</span><span class="st">◆</span>
              <span>NAAC A+ COLLEGES ONLY</span><span class="st">◆</span>
            </div>
            <div class="set">
              <span>FOR STUDENTS OF BIHAR</span><span class="st">◆</span>
              <span class="deva">बिहार के छात्रों के लिए</span><span class="st">◆</span>
              <span>UP TO ₹4,00,000</span><span class="st">◆</span>
              <span>0% INTEREST</span><span class="st">◆</span>
              <span>NO COLLATERAL</span><span class="st">◆</span>
              <span>NAAC A+ COLLEGES ONLY</span><span class="st">◆</span>
            </div>
          </div>
        </div>

        {/* Hero (site Header renders above via app.tsx) */}
        <header class="hero">
          <div class="wrap">
            <div class="hero-grid">
              <div>
                <span class="kicker">
                  <span class="deva hi">सिर्फ़ बिहार के छात्रों के लिए</span> ONLY FOR BIHAR
                </span>
                <h1>
                  Your ticket to the BBA, BCA, MCA, MBA is the{" "}
                  <span class="green">Bihar Student</span>{" "}
                  <span class="mark">Credit Card</span>
                </h1>
                <p class="lede">
                  Up to <b>₹4,00,000</b> at <b>0% interest</b> to study at a NAAC A, A+ or A++
                  college. Ten strong options in Varanasi, Lucknow and Delhi NCR, and our
                  counsellors help you apply for the card and the college together.
                </p>
                <p class="hinglish">
                  Fees ab rukawat nahi. Card banwaiye, seat pakki kijiye, ghar se nikal jaiye.
                </p>
                <div class="fare-tags">
                  <span class="tag">LIMIT <b>₹4 LAKH</b></span>
                  <span class="tag">INTEREST <b>0%</b></span>
                  <span class="tag">COLLATERAL <b>NIL</b></span>
                  <span class="tag">GRADE <b>NAAC A+</b></span>
                </div>

                <div class="callrow">
                  <CallNow />
                  <span class="callnote">Prefer to talk? Speak to a counsellor now, free.</span>
                </div>

                <div class="route-strip">
                  <div class="rl">Route map — distance is part of the decision</div>
                  <div class="stops">
                    <div class="stop home">
                      <div class="sd" />
                      <div class="sc">Home, Bihar</div>
                      <div class="sk">PATNA / ARA / BUXAR</div>
                    </div>
                    <div class="stop">
                      <div class="sd" />
                      <div class="sc">Varanasi</div>
                      <div class="sk">3–5 HRS</div>
                    </div>
                    <div class="stop">
                      <div class="sd" />
                      <div class="sc">Lucknow</div>
                      <div class="sk">OVERNIGHT</div>
                    </div>
                    <div class="stop">
                      <div class="sd" />
                      <div class="sc">Delhi NCR</div>
                      <div class="sk">12–14 HRS</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="hero-side">
                {/* Education pass */}
                <div
                  class="pass"
                  role="img"
                  aria-label="Illustration of the Bihar Student Credit Card as an education pass"
                >
                  <div class="band">
                    <span class="bt">EDUCATION PASS</span>
                    <span class="bn">BSCC / SAAT NISHCHAY</span>
                  </div>
                  <div class="body">
                    <div class="holes"><i /><i /><i /><i /></div>
                    <div class="rows">
                      <div class="pr"><div class="k">Pass holder</div><div class="v">Student of Bihar</div></div>
                      <div class="pr"><div class="k">Issued by</div><div class="v">Govt. of Bihar</div></div>
                      <div class="pr"><div class="k">Loan limit</div><div class="v big">₹4,00,000</div></div>
                      <div class="pr"><div class="k">Interest</div><div class="v big zero">0%</div></div>
                    </div>
                    <div class="foot">
                      <span class="yj">VALID: ALL INDIA · RECOGNISED COLLEGES</span>
                      <span class="stamp-mini">NO GUARANTOR</span>
                    </div>
                  </div>
                </div>
                <p class="passcap">
                  ILLUSTRATIVE. THE BSCC IS AN OFFICIAL SCHEME OF THE GOVERNMENT OF BIHAR.
                </p>

                {/* Reservation form */}
                <div class="resform" id="lead">
                  <div class="fhead">
                    <span class="ft">Reserve your counselling</span>
                    <span class="free">FREE</span>
                  </div>
                  <div class="fbody">
                    <Show
                      when={!sent()}
                      fallback={
                        <div class="thanks">
                          <div class="tick">✓</div>
                          <h3>Seat noted</h3>
                          <p>
                            We have your details. An AAJneeti counsellor will reach out on your
                            number shortly.
                          </p>
                        </div>
                      }
                    >
                      <form id="leadForm" onSubmit={onSubmit} novalidate>
                        <p class="sub">
                          Share your details. A counsellor helps with the card and the college, at
                          no cost.
                        </p>
                        <Show when={error()}>
                          <p class="formerr" role="alert">{error()}</p>
                        </Show>
                        <div class="frow">
                          <div class="field">
                            <label for="name">Full name</label>
                            <input
                              id="name"
                              name="name"
                              type="text"
                              autocomplete="name"
                              placeholder="Your name"
                              value={name()}
                              onInput={(e) => setName(e.currentTarget.value)}
                              required
                            />
                          </div>
                          <div class="field">
                            <label for="email">Email</label>
                            <input
                              id="email"
                              name="email"
                              type="email"
                              autocomplete="email"
                              placeholder="you@email.com"
                              value={email()}
                              onInput={(e) => setEmail(e.currentTarget.value)}
                            />
                          </div>
                        </div>
                        <div class="frow">
                          <div class="field">
                            <label for="mobile">Mobile number</label>
                            <input
                              id="mobile"
                              name="mobile"
                              type="tel"
                              inputmode="numeric"
                              autocomplete="tel"
                              maxlength="10"
                              placeholder="10 digit mobile"
                              value={mobile()}
                              onInput={(e) =>
                                setMobile(e.currentTarget.value.replace(/\D/g, "").slice(0, 10))
                              }
                              required
                            />
                          </div>
                          <div class="field">
                            <label for="city">City you live in</label>
                            <input
                              id="city"
                              name="city"
                              type="text"
                              autocomplete="address-level2"
                              placeholder="Your city"
                              value={city()}
                              onInput={(e) => setCity(e.currentTarget.value)}
                            />
                          </div>
                        </div>
                        <div class="field">
                          <label for="course">Course interested in</label>
                          <select
                            id="course"
                            name="course"
                            value={course()}
                            onChange={(e) => setCourse(e.currentTarget.value)}
                          >
                            <option value="">Select</option>
                            <For each={COURSE_OPTIONS}>{(c) => <option value={c}>{c}</option>}</For>
                          </select>
                        </div>
                        <label class="consent">
                          <input
                            type="checkbox"
                            checked={consent()}
                            onChange={(e) => setConsent(e.currentTarget.checked)}
                          />
                          <span>
                            I agree to be contacted by ACL Portal (AAJneeti) about admissions and the
                            Bihar Student Credit Card by call, WhatsApp, SMS and email, and I accept
                            the <a href="/privacy-policy">Privacy Policy</a>.
                          </span>
                        </label>
                        <button class="btn" type="submit" disabled={busy()}>
                          {busy() ? "Submitting…" : "Get free counselling →"}
                        </button>
                        <p class="fineprint">NO SPAM. DETAILS USED ONLY FOR ADMISSIONS AND THE CARD.</p>
                      </form>
                    </Show>
                    <div class="callsplit">or call us directly</div>
                    <CallNow />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Listing */}
        <main class="listing">
          <div class="wrap">
            <div class="shead">
              <div class="eyeline">The shortlist</div>
              <h2>Ten colleges, ranked for a Bihar student</h2>
              <p>
                Not a national ranking. This order weighs quality, placements and how far you would
                travel from home, so the strongest nearby options that fit your card come first.
              </p>
            </div>

            {/* STATION: VARANASI */}
            <div class="signboard">
              <div class="en">Varanasi</div>
              <div class="hi deva">वाराणसी</div>
              <div class="dist">CLOSEST TO HOME · 3–5 HRS FROM MOST OF BIHAR</div>
            </div>

            {/* 1. BHU */}
            <article class="ticket">
              <div class="stub"><span class="punch" /><span class="num">01</span><span class="sk">SEAT NO.</span></div>
              <div class="tbody">
                <div class="toprow"><span class="naac">NAAC A</span><span class="badge">Institution of Eminence</span></div>
                <h3>Institute of Management Studies, BHU</h3>
                <div class="loc">VARANASI, UP · FORMERLY <b>FMS BHU</b></div>
                <p class="why">
                  The most respected public business school within easy reach of Bihar. Heritage
                  brand, strong faculty, and fees so low your card covers them with room to spare. A
                  genuine stretch goal worth aiming for.
                </p>
                <div class="datastrip">
                  <div class="ds"><div class="k">Entrance</div><div class="v">CAT + GD/PI</div></div>
                  <div class="ds"><div class="k">Total fee approx</div><div class="v">₹1,16,000</div></div>
                  <div class="ds"><div class="k">Flagship</div><div class="v">MBA / MBA-IB / AB</div></div>
                  <div class="ds"><div class="k">Est.</div><div class="v">1968</div></div>
                </div>
                <p class="recruit"><b>Recruiters</b>IBM, Infosys, Wipro, Genpact, Cognizant, S&amp;P Global</p>
              </div>
              <div class="fare">
                <div>
                  <div class="fk">Average package</div>
                  <div class="fv">₹11.3 <small>LPA</small></div>
                  <div class="fh">HIGHEST AROUND <b>₹35 LPA</b></div>
                </div>
                <span class="stampmark full">Card covers<br />full fee</span>
                <a class="cta" href="#lead" onClick={jump}>Get admission details →</a>
              </div>
            </article>

            {/* 2. SMS Varanasi FEATURED */}
            <article class="ticket featured">
              <div class="fribbon">
                <span>★ Counsellor's pick</span>
                <span class="note">Quality teaching, and your card covers the full fee</span>
              </div>
              <div class="stub"><span class="punch" /><span class="num">02</span><span class="sk">SEAT NO.</span></div>
              <div class="tbody">
                <div class="toprow"><span class="naac">NAAC A</span><span class="badge">Autonomous · UGC</span></div>
                <h3>School of Management Sciences, Varanasi</h3>
                <div class="loc">VARANASI, UP · <b>CLOSEST QUALITY CAMPUS TO WEST BIHAR</b></div>
                <p class="why">
                  For a student from Bihar, this is the sweet spot. A NAAC A autonomous campus with a
                  proven placement cell, a short journey from home, and total fees that sit
                  comfortably inside your ₹4 lakh credit card. No top-up, no stress.
                </p>
                <div class="datastrip">
                  <div class="ds"><div class="k">Entrance</div><div class="v">CAT/MAT/CMAT/CUET</div></div>
                  <div class="ds"><div class="k">Total fee approx</div><div class="v">₹4.24 Lacs</div></div>
                  <div class="ds"><div class="k">Courses</div><div class="v">MBA, MCA, BBA+</div></div>
                  <div class="ds"><div class="k">Standing</div><div class="v">Top 50 B-schools</div></div>
                </div>
                <p class="recruit"><b>Recruiters</b>ICICI Bank, Axis Bank, IndiGo, SBI Life, Wipro, TCS</p>
              </div>
              <div class="fare">
                <div>
                  <div class="fk">Average package</div>
                  <div class="fv">₹4.75 <small>LPA</small></div>
                  <div class="fh">HIGHEST AROUND <b>₹10 LPA</b> (2025)</div>
                </div>
                <span class="stampmark full">Card covers<br />full fee</span>
                <a class="cta" href="#lead" onClick={jump}>Talk to a counsellor →</a>
              </div>
            </article>
          </div>

          {/* Scheme: what the BSCC is — placed after the Varanasi college block */}
          <section class="scheme">
            <div class="wrap">
              <div class="shead">
                <div class="eyeline">The scheme</div>
                <h2>What is the Bihar Student Credit Card?</h2>
                <p>
                  A scheme of the Government of Bihar under Saat Nishchay. It gives students of Bihar
                  an education loan to study after Class 12, so fees never stop a good student from
                  studying.
                </p>
              </div>

              <div class="farechart">
                <div class="fc"><div class="v">₹4<small> lakh</small></div><div class="k">LOAN AMOUNT, UP TO</div></div>
                <div class="fc"><div class="v">0<small>%</small></div><div class="k">INTEREST FOR ALL, PER THE 2025 UPDATE</div></div>
                <div class="fc"><div class="v">NIL</div><div class="k">COLLATERAL. THE STATE STANDS GUARANTOR</div></div>
                <div class="fc"><div class="v">ALL<small> INDIA</small></div><div class="k">VALID AT RECOGNISED COLLEGES ACROSS STATES</div></div>
              </div>

              <div class="how">
                <div>
                  <h3>How to use it for these colleges</h3>
                  <p class="lead">
                    Get your admission letter, then apply for the card. Our counsellors run both
                    steps together so you do not lose time.
                  </p>
                  <ol class="halts">
                    <li>
                      <b>Confirm your seat</b>
                      <span>Get an admission or selection letter from a recognised college on this list.</span>
                    </li>
                    <li>
                      <b>Register on the official portal</b>
                      <span>
                        Apply for the Bihar Student Credit Card on the MNSSBY Saat Nishchay portal,{" "}
                        <a
                          href="https://www.7nishchay-yuvaupmission.bihar.gov.in/"
                          target="_blank"
                          rel="noopener"
                        >
                          7nishchay-yuvaupmission.bihar.gov.in
                        </a>
                        .
                      </span>
                    </li>
                    <li>
                      <b>Verify at your DRCC</b>
                      <span>
                        Visit your District Registration and Counselling Centre with original
                        documents. The DRCC confirms your college and course.
                      </span>
                    </li>
                    <li>
                      <b>Collect the sanction, complete at the bank</b>
                      <span>
                        Take your sanction letter to the bank to finish disbursal. Fees can be paid
                        directly to the college.
                      </span>
                    </li>
                  </ol>
                  <p class="helpline">
                    OFFICIAL HELPLINE: <b>1800 3456 444</b> · OR LET AN AAJNEETI COUNSELLOR GUIDE YOU
                    FREE
                  </p>
                  <div class="callrow" style="margin-top:14px">
                    <CallNow label="Call a counsellor" />
                  </div>
                </div>

                <div class="elig">
                  <div class="et">Who can apply</div>
                  <ul>
                    <li><span class="ok">✓</span> Permanent resident of Bihar, with domicile or a Bihar address on Aadhaar</li>
                    <li><span class="ok">✓</span> Passed Class 12 (Intermediate) from a recognised board, BSEB, CBSE, ICSE and others</li>
                    <li><span class="ok">✓</span> Confirmed admission to a UGC or AICTE recognised institution and an approved course</li>
                    <li><span class="ok">✓</span> Typically up to 25 years of age</li>
                    <li><span class="ok">✓</span> No family income limit</li>
                  </ul>
                  <div class="verify">
                    <b>Important.</b> Before you count on the card, check that your exact college and
                    course are on the approved list at your DRCC or on the MNSSBY portal. If a college
                    is not approved, the loan can be declined.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="wrap">
            {/* STATION: LUCKNOW */}
            <div class="signboard">
              <div class="en">Lucknow</div>
              <div class="hi deva">लखनऊ</div>
              <div class="dist">THE STATE CAPITAL · AN EASY OVERNIGHT TRAIN</div>
            </div>

            {/* 3. University of Lucknow */}
            <article class="ticket">
              <div class="stub"><span class="punch" /><span class="num">03</span><span class="sk">SEAT NO.</span></div>
              <div class="tbody">
                <div class="toprow"><span class="naac appp">NAAC A++</span><span class="badge">CGPA 3.55</span></div>
                <h3>University of Lucknow</h3>
                <div class="loc">LUCKNOW, UP · <b>FIRST A++ UNIVERSITY IN UP</b></div>
                <p class="why">
                  The strongest public university brand in the state capital, at public university
                  fees that your card handles easily. A century old, highly ranked, and a safe,
                  respected choice.
                </p>
                <div class="datastrip">
                  <div class="ds"><div class="k">Entrance</div><div class="v">CUET based</div></div>
                  <div class="ds"><div class="k">Fees</div><div class="v">Public, low</div></div>
                  <div class="ds"><div class="k">Courses</div><div class="v">MBA + integrated</div></div>
                  <div class="ds"><div class="k">Est.</div><div class="v">1920</div></div>
                </div>
                <p class="recruit"><b>Why it fits</b>Trusted government brand, low fees, capital city exposure</p>
              </div>
              <div class="fare">
                <div>
                  <div class="fk">Standing</div>
                  <div class="fv">Top 10 <small>UP UNIV</small></div>
                  <div class="fh">GROWING BASE IN <b>FINANCE, FMCG, IT</b></div>
                </div>
                <span class="stampmark full">Card covers<br />full fee</span>
                <a class="cta" href="#lead" onClick={jump}>Get admission details →</a>
              </div>
            </article>

            {/* 4. SMS Lucknow */}
            <article class="ticket">
              <div class="stub"><span class="punch" /><span class="num">04</span><span class="sk">SEAT NO.</span></div>
              <div class="tbody">
                <div class="toprow"><span class="naac aplus">NAAC A+</span><span class="badge">SMS Group</span></div>
                <h3>School of Management Sciences, Lucknow</h3>
                <div class="loc">LUCKNOW, UP · <b>THE SMS CAMPUS IN THE CAPITAL</b></div>
                <p class="why">
                  If the state capital suits you better than Varanasi, this keeps you inside the same
                  trusted SMS ecosystem, with fees your card covers in full. Management and
                  technology programmes on one campus.
                </p>
                <div class="datastrip">
                  <div class="ds"><div class="k">Entrance</div><div class="v">CAT/MAT/CMAT/SMS</div></div>
                  <div class="ds"><div class="k">Total fee approx</div><div class="v">₹1,41,000+</div></div>
                  <div class="ds"><div class="k">Courses</div><div class="v">MBA, B.Tech, BBA+</div></div>
                  <div class="ds"><div class="k">Standing</div><div class="v">Top 50, Business Today</div></div>
                </div>
                <p class="recruit"><b>Recruiters</b>Capgemini, SBI Life, British Paints, Indus Towers</p>
              </div>
              <div class="fare">
                <div>
                  <div class="fk">Average package</div>
                  <div class="fv">₹4.5 <small>LPA</small></div>
                  <div class="fh">HIGHEST AROUND <b>₹16 LPA</b></div>
                </div>
                <span class="stampmark full">Card covers<br />full fee</span>
                <a class="cta" href="#lead" onClick={jump}>Get admission details →</a>
              </div>
            </article>

            {/* 5. Integral */}
            <article class="ticket">
              <div class="stub"><span class="punch" /><span class="num">05</span><span class="sk">SEAT NO.</span></div>
              <div class="tbody">
                <div class="toprow"><span class="naac aplus">NAAC A+</span><span class="badge">SIRO recognised</span></div>
                <h3>Integral University, Lucknow</h3>
                <div class="loc">LUCKNOW, UP · LARGE MULTIDISCIPLINARY CAMPUS</div>
                <p class="why">
                  A big, well equipped private university with a strong placement engine and MBA fees
                  that your card can cover. Green campus, modern facilities, and a wide alumni
                  network.
                </p>
                <div class="datastrip">
                  <div class="ds"><div class="k">Entrance</div><div class="v">IUET / merit / CAT</div></div>
                  <div class="ds"><div class="k">Total fee approx</div><div class="v">₹1–2.3 lakh</div></div>
                  <div class="ds"><div class="k">Alumni</div><div class="v">50,000+</div></div>
                  <div class="ds"><div class="k">Valid to</div><div class="v">2028 (NAAC)</div></div>
                </div>
                <p class="recruit"><b>Why it fits</b>Scale, specialisations and a busy placement cell</p>
              </div>
              <div class="fare">
                <div>
                  <div class="fk">Placement rate</div>
                  <div class="fv">~90<small>%</small></div>
                  <div class="fh">FULL MENU OF <b>SPECIALISATIONS</b></div>
                </div>
                <span class="stampmark full">Within your<br />₹4 lakh card</span>
                <a class="cta" href="#lead" onClick={jump}>Get admission details →</a>
              </div>
            </article>

            {/* 6. Jaipuria */}
            <article class="ticket">
              <div class="stub"><span class="punch" /><span class="num">06</span><span class="sk">SEAT NO.</span></div>
              <div class="tbody">
                <div class="toprow"><span class="naac aplus">NAAC A+</span><span class="badge">AACSB · NBA</span></div>
                <h3>Jaipuria Institute of Management, Lucknow</h3>
                <div class="loc">GOMTI NAGAR, LUCKNOW · DEDICATED BUSINESS SCHOOL</div>
                <p class="why">
                  The premium, placement focused choice in Lucknow, internationally accredited by
                  AACSB, which puts it in the top six percent of business schools worldwide. Fees run
                  higher, so use your card as a base and top up with a regular loan.
                </p>
                <div class="datastrip">
                  <div class="ds"><div class="k">Entrance</div><div class="v">CAT/XAT/CMAT/MAT</div></div>
                  <div class="ds"><div class="k">Total fee approx</div><div class="v">₹18,20,000</div></div>
                  <div class="ds"><div class="k">Programme</div><div class="v">PGDM (= MBA, AIU)</div></div>
                  <div class="ds"><div class="k">NIRF 2025</div><div class="v">Mgmt rank 67</div></div>
                </div>
                <p class="recruit"><b>Recruiters</b>Deloitte, Accenture, Genpact, HDFC Bank, Amul, Adani</p>
              </div>
              <div class="fare">
                <div>
                  <div class="fk">Average package</div>
                  <div class="fv">₹11.8 <small>LPA</small></div>
                  <div class="fh">HIGHEST AROUND <b>₹24.11 LPA</b></div>
                </div>
                <span class="stampmark part">Plan a top-up<br />above ₹4 lakh</span>
                <a class="cta" href="#lead" onClick={jump}>Get admission details →</a>
              </div>
            </article>

            {/* 7. Amity Lucknow */}
            <article class="ticket">
              <div class="stub"><span class="punch" /><span class="num">07</span><span class="sk">SEAT NO.</span></div>
              <div class="tbody">
                <div class="toprow"><span class="naac aplus">NAAC A+</span><span class="badge">Amity network</span></div>
                <h3>Amity University, Lucknow</h3>
                <div class="loc">LUCKNOW, UP · PART OF AMITY UNIVERSITY UP</div>
                <p class="why">
                  The Amity brand and corporate network in the state capital, on a large, facility
                  rich campus. Strong industry links and a wide choice of specialisations, with fees
                  that usually need a small top-up over the card.
                </p>
                <div class="datastrip">
                  <div class="ds"><div class="k">Entrance</div><div class="v">Amity / national scores</div></div>
                  <div class="ds"><div class="k">Fees</div><div class="v">Mid range private</div></div>
                  <div class="ds"><div class="k">Courses</div><div class="v">MBA + wide UG/PG</div></div>
                  <div class="ds"><div class="k">Strength</div><div class="v">Corporate tie-ups</div></div>
                </div>
                <p class="recruit"><b>Why it fits</b>Recognised private brand with strong placement machinery</p>
              </div>
              <div class="fare">
                <div>
                  <div class="fk">Network</div>
                  <div class="fv">Amity <small>GROUP</small></div>
                  <div class="fh">CAMPUSES ACROSS INDIA AND <b>ABROAD</b></div>
                </div>
                <span class="stampmark part">Plan a top-up<br />above ₹4 lakh</span>
                <a class="cta" href="#lead" onClick={jump}>Get admission details →</a>
              </div>
            </article>

            {/* STATION: DELHI NCR */}
            <div class="signboard">
              <div class="en">Delhi NCR</div>
              <div class="hi deva">दिल्ली एनसीआर</div>
              <div class="dist">FOR A BIGGER CITY · 12–14 HRS BY TRAIN, WORTH IT FOR THE NETWORK</div>
            </div>

            {/* 8. Amity Noida */}
            <article class="ticket">
              <div class="stub"><span class="punch" /><span class="num">08</span><span class="sk">SEAT NO.</span></div>
              <div class="tbody">
                <div class="toprow"><span class="naac aplus">NAAC A+</span><span class="badge">Global tie-ups</span></div>
                <h3>Amity University, Noida</h3>
                <div class="loc">NOIDA, DELHI NCR · FLAGSHIP AMITY CAMPUS</div>
                <p class="why">
                  A flagship NCR private university with a wide specialisation menu and a heavyweight
                  recruiter base. Worth the distance for the network, with your card as a starting
                  base and a top-up for the rest.
                </p>
                <div class="datastrip">
                  <div class="ds"><div class="k">Entrance</div><div class="v">CAT/XAT/NMAT/GMAT</div></div>
                  <div class="ds"><div class="k">Programme</div><div class="v">MBA, 25+ tracks</div></div>
                  <div class="ds"><div class="k">NIRF 2024</div><div class="v">Mgmt rank 29</div></div>
                  <div class="ds"><div class="k">Placement</div><div class="v">90%+ record</div></div>
                </div>
                <p class="recruit"><b>Why it fits</b>Metro network, brand strength, wide specialisation choice</p>
              </div>
              <div class="fare">
                <div>
                  <div class="fk">Standing</div>
                  <div class="fv">Top 30 <small>INDIA MBA</small></div>
                  <div class="fh">OVERSEAS CAMPUSES, <b>GLOBAL PARTNERS</b></div>
                </div>
                <span class="stampmark part">Plan a top-up<br />above ₹4 lakh</span>
                <a class="cta" href="#lead" onClick={jump}>Get admission details →</a>
              </div>
            </article>

            {/* 9. Galgotias */}
            <article class="ticket">
              <div class="stub"><span class="punch" /><span class="num">09</span><span class="sk">SEAT NO.</span></div>
              <div class="tbody">
                <div class="toprow"><span class="naac aplus">NAAC A+</span><span class="badge">NBA accredited</span></div>
                <h3>Galgotias University, Greater Noida</h3>
                <div class="loc">GREATER NOIDA, NCR · KNOWLEDGE PARK</div>
                <p class="why">
                  A fast rising NCR university with heavy corporate engagement and strong placement
                  volume, commonly accepted under the credit card. International tie-ups with Purdue,
                  Goethe and Kent State add global exposure.
                </p>
                <div class="datastrip">
                  <div class="ds"><div class="k">Entrance</div><div class="v">CAT/MAT/CMAT/GU</div></div>
                  <div class="ds"><div class="k">Programme</div><div class="v">MBA, 10+ tracks</div></div>
                  <div class="ds"><div class="k">Recruiters</div><div class="v">850+ on campus</div></div>
                  <div class="ds"><div class="k">Partners</div><div class="v">Purdue, Goethe</div></div>
                </div>
                <p class="recruit"><b>Recruiters</b>Cognizant, Accenture, TCS, Capgemini, Infosys</p>
              </div>
              <div class="fare">
                <div>
                  <div class="fk">Placement drive</div>
                  <div class="fv">850+ <small>RECRUITERS</small></div>
                  <div class="fh">HIGH OFFER <b>VOLUME</b> EACH SEASON</div>
                </div>
                <span class="stampmark part">Card covers<br />much of the fee</span>
                <a class="cta" href="#lead" onClick={jump}>Get admission details →</a>
              </div>
            </article>

            {/* 10. Sharda */}
            <article class="ticket">
              <div class="stub"><span class="punch" /><span class="num">10</span><span class="sk">SEAT NO.</span></div>
              <div class="tbody">
                <div class="toprow"><span class="naac aplus">NAAC A+</span><span class="badge">CGPA 3.27</span></div>
                <h3>Sharda University, Greater Noida</h3>
                <div class="loc">GREATER NOIDA, NCR · SHARDA SCHOOL OF BUSINESS STUDIES</div>
                <p class="why">
                  One of NCR's most globally diverse campuses, with students from more than 95
                  countries. A good pick for students who want international exposure alongside their
                  MBA, with a top-up over the card.
                </p>
                <div class="datastrip">
                  <div class="ds"><div class="k">Entrance</div><div class="v">SUAT/CAT/MAT/XAT</div></div>
                  <div class="ds"><div class="k">Programme</div><div class="v">MBA, SSBS</div></div>
                  <div class="ds"><div class="k">Ranking</div><div class="v">QS South Asia</div></div>
                  <div class="ds"><div class="k">Diversity</div><div class="v">95+ countries</div></div>
                </div>
                <p class="recruit"><b>Why it fits</b>Global campus, modern facilities, international exposure</p>
              </div>
              <div class="fare">
                <div>
                  <div class="fk">Campus reach</div>
                  <div class="fv">95+ <small>COUNTRIES</small></div>
                  <div class="fh">RECRUITERS INCLUDE <b>DELOITTE</b></div>
                </div>
                <span class="stampmark part">Plan a top-up<br />above ₹4 lakh</span>
                <a class="cta" href="#lead" onClick={jump}>Get admission details →</a>
              </div>
            </article>
          </div>
        </main>

        {/* Bottom CTA */}
        <section class="bottomcta">
          <div class="wrap">
            <div class="inner">
              <div>
                <h2>One card, one counsellor, <span class="y">one seat.</span></h2>
                <p>
                  Tell us your district and preferred city. An AAJneeti counsellor helps you apply
                  for the Bihar Student Credit Card and secure your MBA seat, at no cost to you.
                </p>
              </div>
              <div class="cta-actions">
                <a class="btn alt" href="#lead" onClick={jump}>Get free counselling →</a>
                <CallNow ghost />
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
