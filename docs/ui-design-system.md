# AccessOps UI design system — application source of truth

This specifies the actual application, not an independent video dashboard. User-directed LastMile styling supplies unspecified spacing/timing values. **No video, composition, timeline, narration, Remotion/HyperFrames project or demo MP4 is produced in this task.** The background is the user's existing external video used by a normal webpage.

## Assets, typography and claims

- Document title: `Intelligence Designed To Evolve`.
- Background URL: `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4`. Absolute `.bg`, black, inset 0, overflow hidden; video 100% cover, autoplay/muted/loop/playsInline. Static black fallback on error, explicit pause control; reduced-motion pauses video and disables transitions/entrances. No local MP4 was created.
- Inter stylesheet: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap`. Stack: `"Inter", "Segoe UI", system-ui, sans-serif`.
- Display stylesheet: `https://db.onlinewebfonts.com/c/8cb707a9b8a73f8a7403336b861c3074?family=BubbledotICG-FinePos`. Family `"BubbledotICG-FinePos"`, then `"Geist Pixel Circle", monospace`. No local Bubbledot substitute.
- Geist fallback: `apps/web/public/fonts/GeistPixel-Circle.woff2`, from installed Geist package; accompanying `Geist-LICENSE.txt`. Technical mono uses the existing bundled DM Mono.
- FontAwesome 6.5.2: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css`, `crossOrigin="anonymous"`, integrity `sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==`.
- Real logo image: `apps/web/public/assets/logo.svg`, preserved Bumps `src/app/icon.svg` artwork; no supplied `assets/logo.webp` exists. It sits inside the circular white button with a grayscale filter. This explicit asset substitution follows the user's instruction to reuse the existing style/assets, not a claimed pixel comparison to an unavailable reference file.
- All labels and reference content: `apps/web/src/data/accessops-ui.ts`; no invented workspace metrics.
- Trust copy: `Trusted by 2000+ Enterprises`; three overlapping dark rings with white Microsoft/Amazon/Google inner icons. It is a **reference-design claim, not verified adoption**.
- Headline is two nowrap solid white lines: `Intelligence` and `Designed To Evolve`. No gradient/shimmer.
- Subheading: `Build applications that reason, adapt and collaborate using a modular AI platform designed for production.` CTA: `Get Started` → `/dashboard` (real authentication gate).
- Reference stats: `<` / `120ms` / `Inference Time`; `%` / `99.99%` / `Platform Uptime`; `*` / `24/7` / `Autonomous Runtime`; `#` / `2.4M` / `Context Windows`. A visible first-viewport label links to `/product#reference-claims`, explicitly marking adoption/performance figures unverified. Do not use them as factual AccessOps claims or hide this qualification in a future recording. Count-up is 1300ms cubic ease-out, each metric's stagger follows the CSS below, reduced motion shows final values immediately.

Verified browser asset probe: the exact MP4 reached readyState4, playback was active without media error, and BubbledotICG-FinePos loaded from the remote stylesheet. Additional 320×568 and 720×700 checks confirm trust/CTA/statistics remain inside the viewport without horizontal overflow. These results are in private `browser-asset-results.json`; network availability still depends on the deployment/client.

## Geometry and interactions

Desktop: viewport-height landing with header, flexible centered hero and statistics footer; 6vw horizontal padding. White 46px logo, centered 60px navigation pill, dark sign-in pill. Navigation has Home/Product/Case Studies/Contact and active three-dot marker; all destinations exist. Trust rings are dark, not solid white avatars. CTA has restrained glow and 2px hover lift. Statistics are four columns separated by faint rules. All exact values are preserved below from the shipped stylesheet.

At 720px: logo/burger 48px, desktop navigation/sign-in hidden, two-column statistics, 22px side padding. At 420px: 18px padding and smaller title/stat spacing. Height 700px adjustments keep trust, title, CTA and stats within the viewport at tested mobile sizes. Mobile menu is a full-screen translucent blurred dismissible overlay plus a white centered sheet, not a route replacement. Burger bars transition to a black X; aria-expanded/hidden, focus trap, Escape, overlay, link, logo, and desktop-resize dismissal are implemented. Main content is inert while open. Skip links and focus-visible outlines remain available.

Entrances: `slideDown` .75s; `headlineFade` .9s at .22/.36s; trust `reveal` .75s/.1s; subheading .8s/.48s; CTA `revealPulse` .8s/.6s; metric reveals .8s at .75/.85/.95/1.05s. Reduced motion immediately shows final values without movement and pauses background playback. See exact keyframes/easing below.

## Shared operational layout

Black surfaces, white/gray hierarchy, 1px restrained borders, white pill actions. Dot display headings and selected metrics; dense tables, body text and forms use Inter. Desktop sidebar 228px (195px at 1100px), then horizontal navigation on mobile; active route, building context and role remain visible. Split panes collapse without losing evidence. Status badges include textual labels, not color alone. Tables scroll within their own container. Real loading/error/empty/permission-denied states are preserved. Input validation uses the API's structured errors. The original drawing canvas remains a usable light geometric surface inside a monochrome workbench; the brand header is 68px and the editor receives remaining viewport height.

## Routes and components

All paths below are relative to `apps/web/src`.

| Routes | Actual components |
|---|---|
| `/` | `(landing)/page.tsx`, `components/brand/intelligence-landing.tsx`, `count-value.tsx`, `site-header.tsx` |
| `/product`, `/case-studies`, `/contact` and existing informational routes | `(landing)` layouts/pages, shared SiteHeader and editorial styles; contact uses existing project issue route and administrator instructions |
| workspace authentication / building selection | `(workspace)/layout.tsx`, `components/workspace/{workspace-shell,workspace-context,auth-panel}.tsx`; real cookie sessions, no fabricated sign-in |
| `/dashboard`, `/projects` | `dashboard-screen.tsx`, `projects-screen.tsx`; real authorized counts, upload/manual model review |
| `/sources` | `sources-screen.tsx`; registration, connection proof, preview/commit/mapping/errors, immutable snapshots |
| `/entities` | `entities-screen.tsx`; canonical context, unresolved matches, reviewer conflict decisions, append-only verification |
| `/graph` | `graph-screen.tsx`, `graph-diagram.tsx`; editable reviewed topology; schematic explicitly not physical scale |
| `/investigations`, `/investigations/[id]` | `investigations-screen.tsx`, `investigation-detail.tsx`, `finding-card.tsx`, `evidence-card.tsx`; frozen history, keyboard tabs, source lineage, provider runs, report links |
| `/scenarios`, `/actions` | `scenarios-screen.tsx`, `actions-screen.tsx`; real baseline/scenario results, owned proposals/approval/verified resolution |
| `/settings` | `settings-screen.tsx`; role-gated members/grants/audit/provider discovery; no client secret editor |
| `/operations` → `/dashboard`; `/operations/advanced` | retained original OperationsConsole in the shared shell |
| `/map/[id]` | existing Wizard/editor/canvas/validation/tactile/history/export components, map layout brand bar; backend protections unchanged |
| error/not-found/loading | `components/brand/fallback-page.tsx`, root boundaries and shared operational state components |

Shared request/data bindings: `lib/accessops.ts`, existing same-origin `lib/api.ts`, `app/backend/[...path]/route.ts`. API and cookie access controls stay authoritative. Source-derived text and model output render as text/escaped JSON. No HTML injection renderer is introduced.

## Future walkthrough preparation — documentation only

Load the real running app at the selected deployment/loopback origin; use its actual components, route state and shared CSS rather than rebuilding a fake dashboard. A future Remotion/HyperFrames task can orchestrate browser captures or embed authorized captures of these routes, importing the same tokens/geometry where necessary. This task creates no such composition or renderer. Freeze the source build, fixture/source snapshot IDs, viewport, device scale, font availability and reduced-motion/pause setting before capture. Wait for document.fonts.ready and real source/job completion; never animate a pending or rejected result into success.

Truthful future scenes: reproducible labelled synthetic clinic import/identity/reviewed graph/outage/approved action/resolution/report; actual Zetaris reference queries and their bounded schema-coverage finding; verified real NVIDIA provider run; actual local Engine trace. Preserve historical evidence timestamps. Do not suggest these geographical schemas are indoor measurements, a failed federation is a successful join, a simulated incident is live, or Engine conformance proves Runtime authentication/event qualification. No production-readiness or uptime claim without separate proof.

Private `.accessops-local/ui-phase` contains browser PNGs, command logs and redacted provider receipts. It also neighbors credential-bearing configuration/backups: select reviewed safe artifacts, never mount/publish the entire directory. Future rendering requires separate authorization, licensed remote assets, font availability and an appropriately authorized test workspace. Runtime URL/token, indoor federation tables, deployment/security review and claim confirmation remain separate gates.

## Exact shipped brand stylesheet

This is the concrete CSS specification, including tokens, geometry, breakpoints, animation delays/easing and reduced-motion rules. The live source remains authoritative when updated; regenerate this section when changing CSS.

```css
@font-face {
  font-family: "Geist Pixel Circle";
  src: url("/fonts/GeistPixel-Circle.woff2") format("woff2");
  font-display: swap;
  font-weight: 100 900;
}
:root,
html.dark {
  --bg: #000000;
  --text: #ffffff;
  --muted: #8e8e8e;
  --nav-text: #2e2e2e;
  --pill-dark: #28282a;
  --sign-in-text: #c8c8c8;
  --nav-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
  --trust-bg: #28282a;
  --trust-border: rgba(255, 255, 255, 0.4);
  --trust-text: #c4c2c3;
  --font-sans: "Inter", "Segoe UI", system-ui, sans-serif;
  --font-ui: "Inter", "Segoe UI", system-ui, sans-serif;
  --font-display: "BubbledotICG-FinePos", "Geist Pixel Circle", monospace;
  --background: #000;
  --foreground: #fff;
  --card: #111;
  --card-foreground: #fff;
  --popover: #181818;
  --popover-foreground: #fff;
  --primary: #fff;
  --primary-foreground: #000;
  --secondary: #202022;
  --secondary-foreground: #eee;
  --surface-muted: #19191b;
  --muted-foreground: #aaa;
  --accent: #28282a;
  --accent-foreground: #fff;
  --border: #303033;
  --input: #353538;
  --ring: #c8c8c8;
  --radius: 1rem;
  --sidebar: #080808;
  --sidebar-foreground: #fff;
  --sidebar-primary: #fff;
  --sidebar-primary-foreground: #000;
  --sidebar-accent: #202022;
  --sidebar-accent-foreground: #fff;
  --sidebar-border: #262629;
  --sidebar-ring: #aaa;
  --blue: #eee;
  --blue-fg: #111;
  --blue-hover: #d8d8d8;
  --green: #dadada;
  --green-fg: #111;
  --green-hover: #fff;
  --amber: #c7c7c7;
  --amber-fg: #111;
  --amber-hover: #eee;
  --brand: #fff;
  --brand-light: #ddd;
  --brand-lighter: #aaa;
  --brand-secondary: #ccc;
}
html {
  color-scheme: dark;
  scroll-behavior: smooth;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
* {
  box-sizing: border-box;
}
a,
button,
summary {
  touch-action: manipulation;
}
button,
a {
  -webkit-tap-highlight-color: transparent;
}
button {
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
}
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
summary:focus-visible {
  outline: 2px solid #ddd;
  outline-offset: 4px;
}
::selection {
  background: #fff;
  color: #000;
}
body.menu-open {
  overflow: hidden;
}
.skip-link {
  position: fixed;
  top: -100px;
  left: 16px;
  z-index: 200;
  background: #fff;
  color: #000;
  padding: 12px 20px;
  border-radius: 50px;
}
.skip-link:focus {
  top: 12px;
}
.ao-site-header {
  position: absolute;
  top: 25px;
  left: 0;
  right: 0;
  z-index: 80;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 6vw;
  animation: slideDown 0.75s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
.logo-button {
  display: flex;
  width: 46px;
  height: 46px;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 50%;
  box-shadow: var(--nav-shadow);
  justify-self: start;
  transition: transform 0.2s;
}
.logo-button:hover {
  transform: translateY(-2px);
}
.logo-button img {
  width: 30px;
  height: 30px;
  filter: grayscale(1) contrast(2);
  border-radius: 7px;
}
.ao-nav-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  padding: 10px 30px;
  height: 60px;
  border-radius: 100px;
  background: #fff;
  color: var(--nav-text);
  box-shadow: var(--nav-shadow);
}
.ao-nav-pill a {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  padding: 0 3px;
  transition: color 0.2s;
}
.ao-nav-pill a:hover {
  color: #000;
}
.nav-dots {
  position: absolute;
  left: 50%;
  bottom: -2px;
  transform: translateX(-50%) translateY(3px);
  display: flex;
  gap: 3px;
  opacity: 0;
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.nav-dots i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #000;
}
.ao-nav-pill a[aria-current] .nav-dots,
.ao-nav-pill a:hover .nav-dots {
  opacity: 1;
  transform: translateX(-50%);
}
.ao-sign-in {
  justify-self: end;
  border-radius: 100px;
  padding: 14px 24px;
  background: var(--pill-dark);
  color: var(--sign-in-text);
  font-size: 12px;
  transition:
    background 0.2s,
    color 0.2s;
}
.ao-sign-in:hover {
  background: #38383b;
  color: #fff;
}
.menu-toggle {
  display: none;
}
.mobile-menu[hidden] {
  display: none;
}
.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 90;
}
.menu-overlay {
  position: absolute;
  inset: 0;
  border: 0;
  background: #000a;
  backdrop-filter: blur(18px);
  width: 100%;
  height: 100%;
}
.menu-sheet {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(86vw, 440px);
  border-radius: 30px;
  background: #fff;
  color: #171717;
  box-shadow: var(--nav-shadow);
  padding: 30px;
}
.menu-sheet > a {
  display: block;
  font-size: 20px;
  font-weight: 500;
  padding: 18px 14px;
  border-bottom: 1px solid #e5e5e5;
}
.menu-sheet > a:hover {
  background: #f1f1f1;
  border-radius: 16px;
}
.menu-sheet .menu-sign-in {
  margin-top: 22px;
  border: 0;
  text-align: center;
  background: #28282a;
  color: #fff;
  border-radius: 100px;
  font-size: 15px;
}
.landing-viewport {
  height: 100vh;
  height: 100dvh;
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 128px 6vw 22px;
  background: #000;
}
.bg {
  position: absolute;
  inset: 0;
  background: #000;
  overflow: hidden;
  z-index: -2;
}
.bg video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}
.bg-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    #0005 0%,
    #0003 38%,
    #000b 88%,
    #000e 100%
  );
}
.landing-hero {
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  width: 100%;
}
.trust-row {
  display: flex;
  align-items: center;
  gap: 14px;
  animation: reveal 0.75s 0.1s both;
}
.trust-rings {
  display: flex;
  padding-left: 8px;
}
.trust-rings > span {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -8px;
  width: 37px;
  height: 37px;
  border-radius: 50%;
  padding: 6px;
  background: #28282a;
  border: 1px solid var(--trust-border);
  transition: transform 0.2s;
}
.trust-rings > span:hover {
  transform: translateY(-4px);
}
.trust-rings i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
  color: #111;
  font-size: 14px;
}
.trust-pill {
  padding: 9px 14px;
  border-radius: 100px;
  border: 1px solid var(--trust-border);
  background: var(--trust-bg);
  color: var(--trust-text);
  font-size: 10px;
  letter-spacing: 0.045em;
  white-space: nowrap;
}
.intelligence-headline {
  margin: 29px 0 21px;
  font-family: var(--font-display);
  font-size: clamp(24px, 5.4vw, 96px);
  font-weight: 400;
  line-height: 1.14;
  letter-spacing: -0.04em;
  color: #fff;
  width: 100%;
}
.intelligence-headline > span {
  display: block;
  white-space: nowrap;
  animation: headlineFade 0.9s 0.22s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
.intelligence-headline > span + span {
  animation-delay: 0.36s;
}
.intelligence-subheading {
  max-width: 605px;
  margin: 0 0 25px;
  font-size: 14px;
  line-height: 1.85;
  color: #c5c5c5;
  text-wrap: pretty;
  animation: reveal 0.8s 0.48s both;
}
.intelligence-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 23px;
  min-height: 51px;
  padding: 15px 25px;
  border-radius: 100px;
  background: #fff;
  color: #111;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 0 25px #ffffff24;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  animation: revealPulse 0.8s 0.6s both;
}
.intelligence-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px #ffffff38;
}
.landing-statistics {
  width: 100%;
  max-width: 1300px;
  margin: 40px auto 0;
}
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 31px 0 23px;
  border-top: 1px solid #ffffff2e;
}
.reference-stat {
  display: flex;
  align-items: center;
  gap: 17px;
  min-width: 0;
  padding-left: 28px;
  border-left: 1px solid #ffffff26;
  animation: reveal 0.8s 0.75s both;
}
.reference-stat:first-child {
  border-left: 0;
  padding-left: 0;
}
.reference-stat:nth-child(2) {
  animation-delay: 0.85s;
}
.reference-stat:nth-child(3) {
  animation-delay: 0.95s;
}
.reference-stat:nth-child(4) {
  animation-delay: 1.05s;
}
.stat-symbol {
  font-family: var(--font-display);
  font-size: 43px;
  color: #fff;
  flex-shrink: 0;
}
.reference-stat strong {
  display: block;
  font-size: 32px;
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.reference-stat small {
  font-size: 18px;
  margin-left: 3px;
}
.reference-stat p {
  font-size: 10px;
  color: #aaa;
  margin: 7px 0 0;
}
.landing-footnote {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  font-size: 10px;
  color: #bbb;
}
.landing-footnote > a {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.landing-footnote button {
  display: flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: 0;
  color: #bbb;
  white-space: nowrap;
  padding: 6px;
}
.editorial-page {
  max-width: 1080px;
  margin: auto;
  min-height: 100dvh;
  padding: 165px 6vw 90px;
}
.editorial-page h1 {
  font-family: var(--font-display);
  font-size: clamp(30px, 4.5vw, 65px);
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 1.14;
  max-width: 850px;
  margin: 0 0 32px;
}
.editorial-page p {
  font-size: 16px;
  line-height: 1.9;
  color: #b8b8b8;
  max-width: 720px;
  margin: 0 0 26px;
}
.editorial-rule {
  border-top: 1px solid var(--border);
  padding-top: 30px;
  margin-top: 70px;
}
.editorial-page h2 {
  font-size: 24px;
  margin-bottom: 20px;
}
.editorial-page .intelligence-cta {
  animation: none;
  margin: 10px 0;
}
.editorial-page a:not(.intelligence-cta) {
  text-decoration: underline;
  text-underline-offset: 4px;
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes headlineFade {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes revealPulse {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@media (max-width: 1000px) {
  .reference-stat {
    gap: 10px;
    padding-left: 15px;
  }
  .stat-symbol {
    font-size: 30px;
  }
}
@media (max-width: 720px) {
  .ao-site-header {
    top: 18px;
    padding: 0 22px;
    grid-template-columns: 1fr 1fr;
  }
  .logo-button {
    width: 48px;
    height: 48px;
  }
  .ao-nav-pill,
  .ao-sign-in {
    display: none;
  }
  .menu-toggle {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    justify-self: end;
    width: 48px;
    height: 48px;
    border: 1px solid #ffffff50;
    border-radius: 50%;
    background: #0005;
    position: relative;
    z-index: 110;
  }
  .menu-toggle span {
    display: block;
    width: 20px;
    height: 2px;
    background: #fff;
    transition:
      transform 0.25s,
      opacity 0.25s,
      background 0.25s;
  }
  .menu-toggle.is-open {
    background: #fff;
    position: fixed;
    right: 22px;
    top: 18px;
  }
  .menu-toggle.is-open span {
    background: #111;
  }
  .menu-toggle.is-open span:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }
  .menu-toggle.is-open span:nth-child(2) {
    opacity: 0;
  }
  .menu-toggle.is-open span:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }
  .ao-site-header:has(.is-open) {
    z-index: 100;
  }
  .landing-viewport {
    padding: 110px 22px 14px;
  }
  .trust-row {
    gap: 9px;
  }
  .trust-rings > span {
    width: 28px;
    height: 28px;
    padding: 4px;
  }
  .trust-rings i {
    font-size: 11px;
  }
  .trust-pill {
    font-size: 8px;
    padding: 8px 10px;
  }
  .intelligence-headline {
    margin: 28px 0 21px;
    font-size: clamp(24px, 5.4vw, 39px);
    letter-spacing: -0.045em;
    line-height: 1.2;
  }
  .intelligence-subheading {
    max-width: 430px;
    font-size: 12px;
    line-height: 1.8;
    margin-bottom: 24px;
  }
  .landing-statistics {
    margin-top: 26px;
  }
  .statistics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 27px 14px;
    padding: 25px 0;
  }
  .reference-stat,
  .reference-stat:first-child {
    padding-left: 12px;
    border-left: 1px solid #ffffff26;
    gap: 11px;
  }
  .reference-stat strong {
    font-size: 27px;
  }
  .reference-stat small {
    font-size: 16px;
  }
  .reference-stat p {
    font-size: 10px;
    line-height: 1.5;
  }
  .stat-symbol {
    font-size: 28px;
  }
  .landing-footnote {
    font-size: 9px;
    align-items: start;
  }
  .landing-footnote > a {
    max-width: 225px;
  }
  .editorial-page {
    padding: 135px 24px 60px;
  }
  .editorial-page p {
    font-size: 14px;
  }
}
@media (max-height: 700px) {
  .landing-viewport {
    padding-top: 110px;
  }
  .intelligence-headline {
    margin: 20px 0 14px;
    font-size: clamp(24px, 5vw, 65px);
  }
  .intelligence-subheading {
    margin-bottom: 18px;
  }
  .landing-statistics {
    margin-top: 25px;
  }
  .statistics-grid {
    padding: 20px 0;
  }
}
@media (max-width: 420px) {
  .landing-viewport {
    padding-left: 18px;
    padding-right: 18px;
  }
  .intelligence-headline {
    font-size: 25px;
  }
  .reference-stat {
    padding-left: 8px;
    gap: 8px;
  }
  .trust-pill {
    letter-spacing: 0.015em;
  }
  .landing-footnote > a {
    max-width: 205px;
  }
}
@media (max-width: 720px) and (max-height: 700px) {
  .landing-viewport {
    padding-top: 105px;
    padding-bottom: 12px;
  }
  .intelligence-headline {
    margin: 16px 0 12px;
    font-size: 25px;
  }
  .intelligence-subheading {
    font-size: 11px;
    line-height: 1.6;
    margin-bottom: 18px;
  }
  .intelligence-cta {
    min-height: 44px;
    padding: 12px 22px;
  }
  .landing-statistics {
    margin-top: 20px;
  }
  .statistics-grid {
    padding: 18px 0;
    row-gap: 17px;
  }
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
  .intelligence-headline span,
  .trust-row,
  .intelligence-subheading,
  .intelligence-cta,
  .reference-stat {
    opacity: 1;
    transform: none;
  }
}

```

## Exact shipped workspace stylesheet

```css
.workspace-layout {
  display: grid;
  grid-template-columns: 228px minmax(0, 1fr);
  min-height: 100dvh;
  background: #000;
  color: #fff;
  font-family: var(--font-sans);
  font-size: 13px;
}
.workspace-sidebar {
  position: sticky;
  top: 0;
  height: 100dvh;
  padding: 30px 20px 20px;
  border-right: 1px solid #252528;
  display: flex;
  flex-direction: column;
  background: #080808;
}
.workspace-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 21px;
  font-weight: 500;
  letter-spacing: -0.04em;
}
.workspace-brand img {
  border-radius: 50%;
  background: #fff;
  padding: 4px;
  filter: grayscale(1) contrast(1.5);
}
.sidebar-subtitle {
  font-size: 11px;
  color: #aaa;
  line-height: 1.7;
  margin: 12px 0 28px;
}
.workspace-switch {
  border-top: 1px solid #29292c;
  border-bottom: 1px solid #29292c;
  padding: 18px 0;
  margin-bottom: 24px;
  display: grid;
  gap: 8px;
}
.workspace-switch > span {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
}
.workspace-switch strong {
  font-weight: 500;
  font-family: var(--font-dm-mono), monospace;
  font-size: 11px;
}
.workspace-switch .status-badge {
  width: max-content;
}
.workspace-sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.workspace-sidebar nav a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 100px;
  color: #aaa;
  white-space: nowrap;
  transition:
    background 0.2s,
    color 0.2s;
}
.workspace-sidebar nav a:hover {
  background: #19191b;
  color: #fff;
}
.workspace-sidebar nav a[aria-current] {
  background: #fff;
  color: #111;
}
.sidebar-bottom {
  margin-top: auto;
  padding-top: 20px;
  display: grid;
  gap: 16px;
  color: #aaa;
}
.sidebar-bottom a,
.sidebar-bottom button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
}
.sidebar-bottom button {
  justify-content: start;
  background: none;
  border: 0;
  color: #aaa;
  padding: 0;
}
.workspace-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.workspace-topbar {
  height: 82px;
  padding: 14px 36px;
  border-bottom: 1px solid #252528;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.building-control {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
}
.building-control label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.building-control label > span {
  font-size: 10px;
  color: #999;
}
.building-control select {
  background: transparent;
  color: #eee;
  border: 0;
  max-width: 470px;
  padding: 0 20px 0 0;
  font-size: 12px;
  cursor: pointer;
  text-overflow: ellipsis;
}
.topbar-context {
  display: flex;
  align-items: center;
  gap: 18px;
  color: #aaa;
  font-size: 11px;
}
.topbar-context > a {
  display: flex;
  align-items: center;
  gap: 5px;
}
.workspace-main {
  padding: 43px 36px 35px;
  flex: 1;
  min-width: 0;
}
.workspace-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 36px;
}
.eyebrow {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #999;
  margin: 0 0 17px;
}
.workspace-heading h1 {
  font-family: var(--font-display);
  font-size: clamp(30px, 3.1vw, 46px);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.045em;
  margin: 0 0 13px;
  max-width: 850px;
}
.workspace-heading p:not(.eyebrow) {
  max-width: 690px;
  color: #aaa;
  line-height: 1.8;
  margin: 0;
}
.workspace-footer {
  margin: 0 36px;
  padding: 20px 0;
  border-top: 1px solid #252528;
  color: #999;
  font-size: 10px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
}
.workspace-main [data-slot="button"],
.auth-form-panel [data-slot="button"] {
  border-radius: 100px;
  min-height: 39px;
  padding: 9px 18px;
  gap: 9px;
  font-size: 12px;
}
.workspace-main [data-slot="input"],
.auth-form-panel [data-slot="input"] {
  border-radius: 11px;
  min-height: 42px;
  background: #0e0e10;
  color: #fff;
  border-color: #37373b;
  padding: 10px 12px;
  font-size: 13px;
}
.workspace-main textarea,
.workspace-main select {
  border: 1px solid #37373b;
  border-radius: 11px;
  background: #0e0e10;
  color: #fff;
  padding: 11px 12px;
  min-width: 0;
  font-size: 13px;
}
.workspace-main textarea {
  resize: vertical;
  min-height: 145px;
  font-family: var(--font-dm-mono), monospace;
  font-size: 12px;
  line-height: 1.7;
}
.workspace-main option {
  background: #171719;
  color: #fff;
}
.form-field {
  display: grid;
  gap: 9px;
  min-width: 0;
}
.form-field > span {
  font-size: 11px;
  font-weight: 500;
  color: #ccc;
}
.form-field > small {
  font-size: 10px;
  line-height: 1.6;
  color: #999;
}
.form-stack {
  display: grid;
  gap: 19px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.form-grid .full-width {
  grid-column: 1/-1;
}
.form-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.check-field {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #bbb;
  font-size: 12px;
  line-height: 1.6;
}
.check-field input {
  accent-color: #fff;
  min-width: 16px;
  min-height: 16px;
}
.panel {
  border: 1px solid #2a2a2d;
  border-radius: 20px;
  background: #0b0b0c;
  padding: 24px;
  min-width: 0;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 22px;
}
.panel h2,
.section-title {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0;
}
.panel p.description {
  font-size: 12px;
  color: #aaa;
  line-height: 1.8;
  margin: 8px 0 20px;
}
.panel + .panel {
  margin-top: 22px;
}
.split-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
  gap: 24px;
  align-items: start;
}
.section-stack {
  display: grid;
  gap: 24px;
}
.metrics-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid #303033;
  border-bottom: 1px solid #303033;
  margin-bottom: 34px;
}
.metric-cell {
  padding: 25px 24px;
  border-right: 1px solid #303033;
}
.metric-cell:first-child {
  padding-left: 0;
}
.metric-cell:last-child {
  border-right: 0;
}
.metric-cell strong {
  display: block;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 38px;
  line-height: 1.2;
}
.metric-cell span {
  display: block;
  color: #aaa;
  font-size: 11px;
  margin-top: 10px;
}
.metrics-strip.compact {
  margin-bottom: 20px;
}
.compact .metric-cell {
  padding: 15px 20px;
}
.compact .metric-cell strong {
  font-size: 27px;
}
.record-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 1.7;
  text-align: left;
}
.table-scroll {
  overflow: auto;
  max-width: 100%;
  min-width: 0;
}
.record-table thead {
  border-bottom: 1px solid #343437;
  color: #999;
  font-size: 10px;
  letter-spacing: 0.04em;
}
.record-table th {
  font-weight: 500;
  padding: 0 14px 12px 0;
  white-space: nowrap;
}
.record-table td {
  padding: 17px 14px 17px 0;
  border-bottom: 1px solid #252528;
  vertical-align: top;
}
.record-table tr:last-child td {
  border-bottom: 0;
}
.record-table td:first-child {
  color: #eee;
}
.record-table td small {
  display: block;
  font-size: 10px;
  color: #999;
}
.record-table button.link-button,
.text-action {
  background: none;
  border: 0;
  padding: 0;
  color: #eee;
  text-decoration: underline;
  text-underline-offset: 4px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.record-table td a {
  color: #eee;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.row-select {
  display: block;
  text-align: left;
  line-height: 1.7;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px;
  border: 1px solid #424246;
  border-radius: 100px;
  font-size: 10px;
  line-height: 1.2;
  color: #d7d7da;
  white-space: nowrap;
  text-transform: capitalize;
  background: #141416;
}
.status-badge i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.state-verified,
.state-completed,
.state-succeeded,
.state-resolved,
.state-reachable,
.state-current {
  border-color: #777;
  color: #fff;
  background: #242426;
}
.state-conflicting,
.state-high,
.state-failed,
.state-unreachable,
.state-rejected {
  border-style: double;
  border-width: 3px;
  padding: 3px 7px;
  color: #fff;
  background: #303033;
}
.state-unknown,
.state-stale,
.state-simulated,
.state-reported {
  border-style: dashed;
  color: #c5c5c9;
}
.feedback {
  display: flex;
  align-items: start;
  gap: 12px;
  border: 1px solid #555;
  border-radius: 14px;
  padding: 16px;
  font-size: 12px;
  line-height: 1.7;
  margin: 16px 0;
  background: #161618;
  overflow-wrap: anywhere;
}
.feedback strong {
  font-weight: 500;
}
.feedback p {
  margin: 4px 0 0;
  color: #bbb;
}
.feedback svg {
  flex-shrink: 0;
  margin-top: 3px;
}
.empty-state {
  border: 1px dashed #343438;
  border-radius: 18px;
  text-align: center;
  padding: 45px 22px;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-state h2 {
  color: #eee;
  font-size: 15px;
  font-weight: 500;
  margin: 0;
}
.empty-state p {
  max-width: 440px;
  font-size: 12px;
  line-height: 1.8;
  margin: 0;
}
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #bbb;
  padding: 60px;
  font-size: 12px;
}
.loading-spinner {
  animation: loadingSpin 1s linear infinite;
}
.workspace-boot {
  min-height: 100dvh;
  display: grid;
  place-items: center;
}
@keyframes loadingSpin {
  to {
    transform: rotate(360deg);
  }
}
.technical-record {
  border-top: 1px solid #2d2d30;
  padding: 16px 0;
  margin-top: 16px;
}
.technical-record summary {
  cursor: pointer;
  font-size: 11px;
  color: #aaa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.technical-record pre {
  font-size: 11px;
  color: #bbb;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.8;
  margin-top: 18px;
  max-height: 450px;
  overflow: auto;
}
.metadata-list {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 13px;
  font-size: 11px;
  line-height: 1.7;
}
.metadata-list dt {
  color: #999;
}
.metadata-list dd {
  margin: 0;
  color: #ddd;
  overflow-wrap: anywhere;
}
.evidence-list {
  display: grid;
  gap: 14px;
}
.evidence-item {
  padding: 18px;
  border: 1px solid #323236;
  border-radius: 15px;
  background: #101012;
  min-width: 0;
}
.evidence-item h3 {
  font-size: 13px;
  font-weight: 500;
  margin: 0 0 10px;
}
.evidence-item p {
  font-size: 12px;
  color: #bbb;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.evidence-item .metadata-list {
  margin-top: 15px;
  grid-template-columns: 90px 1fr;
  font-size: 10px;
}
.evidence-item a {
  color: #eee;
  text-decoration: underline;
}
.evidence-id {
  font-family: var(--font-dm-mono), monospace;
  font-size: 10px;
  color: #999;
  overflow-wrap: anywhere;
}
.finding-item {
  border-bottom: 1px solid #2a2a2d;
  padding: 23px 0;
}
.finding-item:first-child {
  padding-top: 0;
}
.finding-item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}
.finding-title {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 15px;
}
.finding-item h3 {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  margin: 0;
}
.finding-item p,
.finding-item li {
  font-size: 12px;
  color: #bbb;
  line-height: 1.9;
  margin-top: 12px;
}
.finding-item h4 {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #999;
  margin: 20px 0 5px;
}
.evidence-links {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.evidence-links button {
  border: 1px solid #414145;
  border-radius: 100px;
  background: #161618;
  color: #ddd;
  font-size: 10px;
  padding: 6px 9px;
}
.trace-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.trace-list li {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 10px;
  padding: 14px 0;
  border-bottom: 1px solid #252528;
}
.trace-list li:before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #aaa;
  margin-top: 8px;
}
.trace-list strong {
  font-weight: 400;
  font-size: 12px;
}
.trace-list time {
  display: block;
  color: #999;
  font-size: 10px;
  margin-top: 5px;
}
.upload-zone {
  border: 1px dashed #56565b;
  border-radius: 20px;
  padding: 35px 25px;
  text-align: center;
  background: #0b0b0d;
}
.upload-zone > svg {
  margin: auto auto 15px;
  color: #aaa;
}
.upload-zone h2 {
  font-size: 17px;
  font-weight: 500;
  margin: 0 0 10px;
}
.upload-zone p {
  color: #aaa;
  font-size: 12px;
  line-height: 1.8;
}
.upload-zone input[type="file"] {
  display: block;
  max-width: 100%;
  margin: 25px auto;
  font-size: 12px;
}
.auth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 6vw;
}
.auth-header > a:last-child {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #aaa;
}
.auth-layout {
  min-height: calc(100dvh - 100px);
  max-width: 1250px;
  margin: auto;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 12%;
  padding: 70px 6vw;
}
.auth-story h1 {
  font-family: var(--font-display);
  font-size: clamp(38px, 4.8vw, 68px);
  font-weight: 400;
  letter-spacing: -0.045em;
  line-height: 1.15;
  margin: 0 0 24px;
}
.auth-story > p:not(.eyebrow) {
  font-size: 14px;
  line-height: 1.9;
  color: #aaa;
  max-width: 450px;
}
.auth-proof {
  display: flex;
  align-items: start;
  gap: 13px;
  font-size: 11px;
  line-height: 1.8;
  color: #999;
  margin-top: 50px;
}
.auth-proof svg {
  flex-shrink: 0;
  margin-top: 3px;
}
.auth-form-panel {
  padding: 32px;
  border: 1px solid #343437;
  border-radius: 26px;
  background: #0c0c0d;
}
.auth-form-panel h2 {
  font-size: 23px;
  font-weight: 500;
  letter-spacing: -0.04em;
  margin: 0 0 14px;
}
.auth-form-panel > p {
  font-size: 12px;
  color: #aaa;
  line-height: 1.8;
  margin: 0 0 27px;
}
.auth-form-panel form {
  display: grid;
  gap: 22px;
}
.auth-form-panel [data-slot="button"] {
  margin-top: 5px;
  justify-content: space-between;
}
.map-brand-bar {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 24px;
  border-bottom: 1px solid #343437;
  background: #080808;
}
.map-brand-bar > a:last-child {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #aaa;
}
.map-workbench {
  height: calc(100dvh - 68px);
  min-height: 0;
  overflow: hidden;
}
.map-workbench > section {
  height: 100%;
}
.map-workbench [data-slot="button"] {
  border-radius: 100px;
}
.advanced-console {
  border: 1px solid #303033;
  border-radius: 20px;
  background: #0a0a0b;
  padding: 10px;
}
.advanced-console main {
  padding: 16px;
}
.advanced-console section {
  border-color: #303033;
  border-radius: 14px;
}
.advanced-console pre {
  font-size: 11px;
}
.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.toolbar .form-field {
  flex: 1;
}
.note {
  font-size: 11px;
  color: #aaa;
  line-height: 1.8;
}
.route-graph {
  width: 100%;
  height: 300px;
  background: #111;
  border-radius: 16px;
  border: 1px solid #303033;
}
.route-graph text {
  fill: #ddd;
  font-family: var(--font-sans);
  font-size: 11px;
}
.route-graph line {
  stroke: #bbb;
  stroke-width: 2;
}
.route-graph circle {
  fill: #fff;
  stroke: #111;
  stroke-width: 3;
}
.route-graph .graph-unknown {
  stroke-dasharray: 5 5;
}
.chart-legend {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  font-size: 10px;
  color: #aaa;
  margin: 13px 0 0;
}
.chart-legend span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.chart-legend i {
  width: 16px;
  border-top: 2px solid #aaa;
}
.chart-legend .dashed {
  border-top-style: dashed;
}
.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  border-bottom: 1px solid #303033;
  padding-bottom: 18px;
  margin-bottom: 23px;
}
.tabs button {
  border: 1px solid #3e3e42;
  border-radius: 100px;
  background: #111;
  color: #aaa;
  padding: 9px 15px;
  font-size: 11px;
}
.tabs button[aria-selected="true"] {
  background: #fff;
  color: #111;
  border-color: #fff;
}
.subtle-link {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 11px;
  color: #bbb;
  text-decoration: underline;
  text-underline-offset: 4px;
}
@media (max-width: 1100px) {
  .workspace-layout {
    grid-template-columns: 195px minmax(0, 1fr);
  }
  .workspace-sidebar {
    padding: 25px 14px;
  }
  .workspace-main {
    padding: 35px 24px;
  }
  .workspace-topbar {
    padding: 14px 24px;
  }
  .workspace-footer {
    margin: 0 24px;
  }
  .split-layout {
    grid-template-columns: 1fr;
  }
  .metrics-strip .metric-cell {
    padding-left: 15px;
  }
  .workspace-heading {
    align-items: start;
  }
  .topbar-context .status-badge {
    display: none;
  }
}
@media (max-width: 720px) {
  .workspace-layout {
    display: block;
  }
  .workspace-sidebar {
    position: relative;
    width: 100%;
    height: auto;
    padding: 18px 18px 0;
    border-right: 0;
    border-bottom: 1px solid #303033;
  }
  .workspace-brand {
    font-size: 19px;
  }
  .sidebar-subtitle,
  .workspace-switch {
    display: none;
  }
  .workspace-sidebar nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 6px;
    margin-top: 20px;
    padding-bottom: 14px;
  }
  .workspace-sidebar nav a {
    padding: 9px 13px;
    font-size: 11px;
    gap: 7px;
  }
  .workspace-sidebar nav a svg {
    width: 14px;
  }
  .sidebar-bottom {
    position: absolute;
    right: 18px;
    top: 23px;
    padding: 0;
    margin: 0;
  }
  .sidebar-bottom > a {
    display: none;
  }
  .sidebar-bottom button {
    font-size: 10px;
  }
  .workspace-topbar {
    height: 75px;
    padding: 14px 18px;
  }
  .building-control select {
    max-width: 245px;
    font-size: 11px;
  }
  .topbar-context > a {
    font-size: 10px;
  }
  .workspace-main {
    padding: 30px 18px;
  }
  .workspace-heading {
    flex-direction: column;
    gap: 20px;
    margin-bottom: 27px;
  }
  .workspace-heading h1 {
    font-size: 31px;
  }
  .workspace-heading .eyebrow {
    font-size: 9px;
  }
  .workspace-heading p:not(.eyebrow) {
    font-size: 12px;
  }
  .metrics-strip {
    grid-template-columns: 1fr 1fr;
  }
  .metric-cell {
    padding: 20px 14px !important;
  }
  .metric-cell:nth-child(2) {
    border-right: 0;
  }
  .metric-cell:nth-child(-n + 2) {
    border-bottom: 1px solid #303033;
  }
  .metric-cell strong {
    font-size: 32px;
  }
  .panel {
    padding: 20px 16px;
    border-radius: 17px;
  }
  .panel-header {
    align-items: start;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .form-grid .full-width {
    grid-column: auto;
  }
  .workspace-footer {
    margin: 0 18px;
    flex-direction: column;
    gap: 9px;
  }
  .metadata-list {
    grid-template-columns: 110px minmax(0, 1fr);
    font-size: 11px;
  }
  .auth-header {
    padding: 22px;
  }
  .auth-header > a:last-child {
    max-width: 140px;
    text-align: right;
    font-size: 10px;
  }
  .auth-layout {
    display: block;
    padding: 40px 22px;
  }
  .auth-story h1 {
    font-size: 39px;
  }
  .auth-story > p:not(.eyebrow) {
    font-size: 13px;
  }
  .auth-proof {
    margin-top: 22px;
    margin-bottom: 34px;
  }
  .auth-form-panel {
    padding: 25px 20px;
  }
  .record-table {
    font-size: 11px;
  }
  .record-table th {
    font-size: 9px;
  }
  .record-table td {
    min-width: 100px;
  }
  .record-table td:first-child {
    min-width: 150px;
  }
  .workspace-main [data-slot="button"] {
    min-height: 40px;
    font-size: 11px;
  }
  .map-brand-bar {
    padding: 12px 16px;
  }
  .map-brand-bar .workspace-brand span {
    display: none;
  }
  .map-brand-bar > a:last-child {
    font-size: 11px;
  }
  .evidence-item {
    padding: 15px;
  }
  .route-graph {
    height: 240px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
}

```

## Provider selection behavior update

The existing investigation explanation button now reads “Explain with configured provider” and omits a pinned provider so the server applies the explicit auto/fallback policy. Its note and persisted history identify actual execution; `auto` is not presented as Runtime inference. No tokens, spacing, typography, assets, layouts or animations changed in this task. No video or demo application was produced. See [current provider evidence](live-integration-verification.md#meterless-runtime-status-and-nvidia-nemotron-fallback).
