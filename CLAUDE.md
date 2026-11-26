# CLAUDE.md — Nadun Chandrabahu portfolio

You are building Nadun Chandrabahu's personal portfolio site. Read this whole file before writing code. It is the source of truth for design, architecture, security and build order.

- **Copy source:** `docs/Content.md` holds the real copy (hero, about, projects, skills, experience, education, contact). Use it as written unless this file says otherwise.
- **Ignore the design sections of Content.md.** Section 2 "Design Direction" and Section 5 "Component and Formatting Notes" are superseded by this file. The copy voice rules in Content.md section 6 still apply.
- **Chatbot backend:** see `docs/CHATBOT_SETUP.md` for the n8n side. This file covers the front end and the `/api/chat` proxy.

---

## 0. Working rules for Claude

1. **Never invent facts about Nadun.** No made-up metrics, dates, employers, grades, links or quotes. If something is missing, put a visible placeholder and a `// TODO(nadun): ...` comment, and add it to the open-items list in section 14.
2. **Copy voice:** plain, specific, first person on the site (third person only inside the chatbot). Sentence case. Active voice. No exclamation marks. No marketing filler ("passionate", "data-driven storyteller", "turning data into insights", "cutting-edge", "leveraging").
3. **No secrets in the browser, ever.** Nothing secret gets a `NEXT_PUBLIC_` prefix. The browser only talks to this site's own origin. See section 9.
4. **Work in the phases in section 12.** Finish one phase and get it building cleanly before you start the next. At the end of each phase run `npm run lint && npm run typecheck && npm run build` and fix everything.
5. **Check current docs instead of trusting memory** for Next.js, React Three Fiber, drei, GSAP, Tailwind and Vercel BotID. Use the latest stable versions, and don't pin versions from this file.
6. **Keep all content in typed data files** (`src/content/*.ts`), never hard-coded in components. One source of truth also feeds the chatbot knowledge file (section 8.6).
7. Ask Nadun before adding any dependency that isn't listed in section 3.

---

## 1. Who this is for and what it has to do

**Nadun Chandrabahu** is a data scientist and AI engineer in Sydney. He has a Master of Data Science (Macquarie) and a Bachelor of Mechanical Engineering (Curtin, delivered at SLIIT). He also works with his hands: an automotive technician internship early on, now working as a mechanic, plus SolidWorks and Blender modelling. He is a Christian, and his faith is central to him.

**Target roles, in order:** AI Engineer, Data Scientist, Data Analyst.

**Three visitors to convince fast:**
- a recruiter skimming for 20 seconds: name, role, location, availability, one strong project, contact
- a hiring manager deciding whether to read on: project substance and outcomes
- a technical reviewer checking the work is real: GitHub links, methods, honest numbers

**The story the site tells:** *An engineer who builds things that work: with his hands, with statistics and with AI.* Mechanical engineering gave him the maths and the habit of measuring carefully. Data science and AI are where he applies it now. He builds real tools rather than slides. Faith is at the centre.

**How it should feel:** skilled, grounded, quietly confident. Rugged and masculine in a restrained way, like a well-made tool rather than a monster-truck ad. Technical and precise without the usual "AI landing page" look.

---

## 2. Design direction: "The Workshop"

### 2.1 Concept

The page is a **precision workshop at night**: machined metal, engineering drawings and measured results. Three visual languages meet here:

- **The machine shop:** machined steel, brass, stamped data plates, inspection tags, knurled grip textures.
- **The engineering drawing:** dimension lines, section markers, part callouts, exploded views.
- **The notebook:** monospace readouts of real results.

The centrepiece is a **3D planetary gearbox** that tells his story (section 7). The chatbot can drive it.

### 2.2 Avoid (hard rules)
- Glowing brains, neural-net node graphs, circuit boards, robot heads, stock photos of someone at a laptop
- Purple/blue "AI gradients", glassmorphism everywhere, neon glows, acid-green terminal themes
- Particle fields, typing effects, matrix rain, custom cursors, scroll-jacking
- Overdone "rugged": rust, grunge, camo, flames, skulls, distressed stencil fonts, tool clip-art
- One giant hero number. Metrics belong on the project inspection tags.
- Generic hero copy
- **Exception (approved by Nadun, 2026-11-26):** a faint green binary rain (0s and 1s) behind the hero gearbox only, so the hero reads as data and AI as well as engineering. It stays background texture: low opacity, masked to the gearbox side, never behind body text, ~20fps, paused off-screen, a still frame under reduced motion (`src/components/hero/DigitalRain.tsx`). The "matrix rain" and "acid-green" bans above still apply everywhere else.

### 2.3 Palette: "Graphite & Brass"

Dark-first. Define everything as CSS variables in Tailwind v4 `@theme`.

| Token | Hex | Use |
|---|---|---|
| `--graphite` | `#0F1011` | page background |
| `--cast` | `#17191B` | section bands, nav background (with 85% opacity + blur) |
| `--machined` | `#202327` | cards and panels |
| `--steel-line` | `#2F3337` | hairlines, borders, dimension lines |
| `--bone` | `#ECE7DE` | primary text (warm off-white, not pure white) |
| `--concrete` | `#9A9FA5` | secondary text, captions, meta |
| `--brass` | `#C9A35E` | **the single accent:** links, active nav, inspection-tag rule, focus rings, key 3D parts |
| `--brass-deep` | `#8C6B32` | brass pressed/hover-dark state, engraved text |

**Temper tint (3D and one hover only).** Heat-treated steel turns straw, then bronze, then purple, then blue. Use this gradient only on the 3D metal (subtle edge tint) and as a 1px hover sheen on inspection tags: `#D8B56A → #A8673A → #6B4A8C → #3D6A9E`. Do not use it as a background or on text.

Contrast: bone on graphite ≈ 15:1, concrete on graphite ≈ 7:1, brass on graphite ≈ 7.9:1. Keep body text at bone or concrete only.

**Lights and rain (added 2026-11-26, Nadun's request):** the site is always the dark workshop above; two independent effects sit on top, each switched on or off by its own toggle button in the header (lightbulb, rain cloud) and remembered per browser (`localStorage`, applied before first paint). Any combination works, including both. **Lights** is a bright LED overhead: cool light-grey surfaces (page `#D9DEE3`, cards `#EEF1F4`, ink `#101317`, brass `#6B4E16`), light pooling from the top of the screen, and the dark room still showing faintly at the edges; brighter, cooler 3D lighting. **Rain** adds faint falling streaks and a greyer, gloomier palette with dimmer, cooler 3D lighting; with the lights on as well it becomes an overcast, dimmer version of the lit workshop with darker streaks. Every text/accent pairing in every combination is at least 4.5:1. Token names keep their dark-theme roles, so components never branch. On `<html>` they are `data-light="on"` / `data-rain="on"`. The chatbot can switch them with the `lights` and `rain` actions (8.3). Code: `src/lib/theme.ts`, `src/lib/themeConfig.ts`, `src/components/layout/ThemeSwitcher.tsx`, tokens in `globals.css`.

### 2.4 Typography

Self-host every font through `next/font` so nothing is requested from Google at runtime.

- **Display:** **Archivo** (variable, with width axis). Hero name and section titles at `wdth` 112–125, weight 700–800. Feels engineered and sturdy. Use uppercase only for the hero name and short section titles.
- **Body:** **IBM Plex Sans**, 400/500. Has engineering heritage and reads well at length.
- **Mono:** **JetBrains Mono**, 400/500. For eyebrow labels, tags, data-plate fields, readouts and dimension labels. This is the "instrument" voice.

Type scale (fluid with `clamp`): display-xl 56→112px, display-l 40→64px, h2 32→44px, h3 20→24px, body 16→18px, small 14px, mono-label 12px with 0.08em tracking. Body measure 60–72ch. Line height 1.6 for body, 1.05 for display.

### 2.5 Texture and detail (subtle and cheap)
- **Machined bevel on cards:** 1px inner top highlight (`inset 0 1px 0 rgba(255,255,255,0.04)`), 1px `--steel-line` border, radius 6px, soft shadow `0 10px 30px -12px rgba(0,0,0,0.6)`.
- **Knurled divider:** a 6px-tall repeating diagonal cross-hatch (CSS `repeating-linear-gradient`) at 6% opacity, used under the nav and above the footer only.
- **Faint blueprint grid** behind the hero only: 24px minor and 120px major lines in `--steel-line` at 25% opacity, masked with a radial fade.
- **Fine film grain** over the whole page: SVG noise at 3% opacity, `pointer-events: none`. Skip it on mobile.

### 2.6 Signature components

**A. Data plate (hero).** A stamped metal nameplate like the one riveted to a machine: brushed-metal gradient surface, four small hex-screw heads in the corners (pure CSS), engraved mono text (dark text with a 1px light bottom text-shadow). Fields:

```
MODEL      N. CHANDRABAHU
CLASS      DATA SCIENCE · AI ENGINEERING
BUILD      B.ENG (MECHANICAL) → M.DATA SCI
LOCATION   SYDNEY, AU
STATUS     ● OPEN TO DATA & AI ROLES
```
The status lamp is a small brass dot with a slow 3s "breathing" glow, which stops under reduced motion.

**B. Inspection tag (project results).** This replaces the old "result readout". It sits at the bottom of every project card and looks like a QC tag: 2px brass left rule, notched top-right corner (CSS `clip-path`), a tiny punched hole, a mono `RESULT` label in concrete, and the readout in brass mono. Use the `→` arrow (U+2192). Example: `confidence 0.89 → 0.991`. On card hover, a 1px temper-tint sheen runs along the rule.

**C. Dimension-line section headers.** Every section starts with an engineering dimension line: `|←──── 02 · SELECTED WORK ────→|` drawn in `--steel-line`, with the label in mono. Below it sits the Archivo section title. The line draws itself left to right on reveal (scaleX), with no animation under reduced motion.

**D. Part callouts.** Where the 3D gearbox shows labels (About section, chatbot focus), use leader lines with a small circle at the anchor and a mono label, like an assembly drawing. Use drei `<Html>` and keep the labels as real DOM text.

### 2.7 Motion
- GSAP + ScrollTrigger for scroll choreography of the 3D scene and section reveals. Keep native scrolling with no smooth-scroll library and no scroll-jacking.
- Reveals: 16px rise + fade, 500ms, `power2.out`, staggered 60ms on card grids.
- Hover: cards lift 4px and their border shifts to brass at 40%; links get a brass underline that grows from the left.
- `prefers-reduced-motion: reduce` disables all scroll-driven 3D motion (the gearbox shows a static, assembled three-quarter view), reveals, the breathing lamp, idle rotation and the hero binary rain (which shows a still frame).

---

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | **Next.js (latest stable, App Router) + TypeScript (strict)**. Note: in Next.js 16, `middleware.ts` is now `proxy.ts`. |
| Styling | **Tailwind CSS v4** with tokens in `@theme` |
| 3D | **three.js + @react-three/fiber + @react-three/drei** |
| 3D postprocessing | `@react-three/postprocessing`, used sparingly: SMAA and a very light bloom on the brass only. Skip it on mobile. |
| Animation | **GSAP + ScrollTrigger** (free, including plugins) |
| Shared 3D/chat state | **zustand** |
| Validation | **zod** (chat request and response schemas) |
| Rate limiting | **@upstash/ratelimit + @upstash/redis** (Upstash via the Vercel Marketplace) |
| Bot protection | **Vercel BotID** (`botid`). Follow the current Vercel docs for setup. |
| Icons | `lucide-react` (only the few needed) |
| Testing | **vitest** for schemas and the action executor; **Playwright** for one smoke test |
| Hosting | **Vercel** for the site and the `/api/chat` proxy. **n8n is hosted elsewhere** (see CHATBOT_SETUP.md). |
| Analytics (optional) | Vercel Web Analytics (cookieless) |

There is no database, no auth and no CMS. Content is TypeScript files in the repo.

---

## 4. Information architecture

Single page, minimal sticky nav.

**Nav:** monogram `NC` (Archivo, brass on cast, in a small machined square) on the left. Links on the right: Work · About · Experience · Education · Contact · **Resume** (small outlined). Then an **"Digital twin"** button that opens the chatbot (brass outline, small gear icon), and two toggle buttons, lights and rain (also beside the menu button on mobile). The active section is highlighted in brass via IntersectionObserver. On mobile the links collapse into a full-height sheet menu; the chat button stays visible as a floating action button bottom-right.

**Section order and IDs:**

| # | id | Section | Notes |
|---|---|---|---|
| 01 | `hero` | Hero | Data plate + 3D gearbox |
| 02 | `work` | Selected work | Projects are the centre of gravity |
| 03 | `about` | About | Gearbox explodes into labelled parts |
| 04 | `hands-on` | Off the keyboard | New. The "works with his hands" story |
| 05 | `skills` | Toolbox | Skills clusters |
| 06 | `experience` | Experience | Compact timeline |
| 07 | `education` | Education | Degrees, then 8 certificate slots |
| 08 | `contact` | Contact + footer | Ephesians 2:8 lives here |

---

## 5. Section specs

### 5.1 Hero (`#hero`)
Layout on desktop: two columns. Left (≈55%) is text; right (≈45%) is the 3D gearbox canvas, which bleeds slightly off the right edge. Blueprint grid behind both. On mobile the gearbox stacks above the text at 60vw height.

Content:
- Eyebrow (mono, concrete): `SYDNEY, AU — DATA SCIENCE · AI ENGINEERING`
- H1 (Archivo, uppercase, expanded): `NADUN CHANDRABAHU`
- Role (Archivo, normal case, bone): `Data scientist and AI engineer` (TODO(nadun): Content.md says "Data Scientist"; confirm the wording)
- Line (Plex Sans, concrete, max 52ch): *I build and evaluate machine learning systems, from statistical models on large datasets to LLM fine-tuning and agentic AI evaluation.*
- Draft sub-line (TODO(nadun): approve or cut): *Trained as a mechanical engineer. I still like knowing how things work, down to the last bolt.*
- Actions: primary button **View work** (brass fill, graphite text) → `#work`; secondary **Digital twin** (outline) opens chat; inline icon links: GitHub · LinkedIn · Email
- Data plate (2.6A) under the actions on desktop, after the text on mobile
- Micro-line under the plate: *Currently in Sydney, open to data and AI roles.*

### 5.2 Selected work (`#work`)
Header: `02 · SELECTED WORK` / title **Selected work**. Optional intro (one line): *Projects with real data, real constraints and a measured result.*

Layout: the **Field Shift card is featured and spans the full width** (two columns inside it: copy left, a stylised map or satellite-tile visual right, or the 3D ring segment if there is no image). The rest sit in a 2-column grid on desktop and 1 column on mobile. **MIL Survey is a smaller secondary card** (half height, no inspection tag).

Card anatomy, top to bottom: optional thumbnail (16:9, full colour; the card must look finished without one) → **"Live ↗" and "GitHub ↗" buttons** (brass outline, on every card; a link that isn't public yet shows as a dashed, disabled button) → eyebrow (mono, brass-deep) → title (Archivo 600) → description (Plex Sans) → tech tags (mono chips, 1px steel-line outline, no fill) → **inspection tag**.

Each card has `data-project-id`. When a card is in view or hovered, it writes `highlightProject` to the gearbox store so its ring segment lights up (section 7).

**Project data** (`src/content/projects.ts`, in this order):

**0 · `field-shift` (featured)**
- Eyebrow: `NASA SPACE APPS / EARTH OBSERVATION`
- Title: **Field Shift: Adapting Farms with NASA Data**
- Description (rewritten from Content.md in plain card voice. Do not call it a hackathon; it's NASA's International Space Apps Challenge):
  > Built in two days with three teammates at NASA's International Space Apps Challenge on the Gold Coast. Field Shift helps farmers explore crop rotations and choose when to sow, using 30 years of NASA Earth observation data: MODIS land surface temperature from the Terra and Aqua satellites, ECOSTRESS, and NASA POWER climate records. We fitted harmonic regression models to land surface temperature and rainfall, and got the tool working for wheat, barley and corn across Perth, Brisbane and Melbourne. The same data covers almost anywhere on Earth, so soil moisture, soil nutrients, erosion and extreme weather are next.
  >
  > TODO(nadun): add one sentence on the part you owned, e.g. "I built the land surface temperature model…"
- Team line (small, concrete): *Team: Patrick Bujok (mentor), Jean-Luc Gravelle, Cole Nicholls*. TODO(nadun): confirm the spelling, Nicholls or Nichols.
- Tech: `Python` `harmonic regression` `MODIS (Terra/Aqua)` `ECOSTRESS` `NASA POWER` `Netlify`. TODO(nadun): confirm the front-end stack.
- Inspection tag: `30 yrs of NASA data → sowing windows · 3 crops × 3 cities`
- Links: Live prototype → `https://nasafieldshift.netlify.app` · GitHub → `https://github.com/nadunchandrabahu/field-shift-nasa`. TODO(nadun): confirm the prototype URL; one earlier note had `nasafieldship.netlify.app`.

**1 · `clinical-nlp`**: Empowering Medical Data Analytics with AI. Eyebrow `RESEARCH / NLP`. Description, tech, readout `baseline established → GPT-4.1 nano ~48.7% accuracy`, GitHub: all from Content.md. TODO(nadun): GitHub URL.

**2 · `language-id`**: Language ID for Endangered Languages (Hack 2025). Eyebrow `MACHINE LEARNING / SPEECH`. Readout `confidence 0.89 → 0.991`. TODO(nadun): GitHub URL.

**3 · `mortgage-defaults`**: Predicting Mortgage Defaults. Eyebrow `STATISTICS / MODELLING`. Readout `75 fields → 13-predictor model, 420,000+ loans`. TODO(nadun): GitHub URL.

**4 · `pickl-hq`**: PICKL HQ. Eyebrow `FULL-STACK / E-COMMERCE`. Readout `live in pre-launch · ~200 visitors/week`. Link: Live site → `https://picklhq.com`.

**5 · `grow365`**: Grow365. Eyebrow `MOBILE / FULL-STACK`. Readout `complete build · in testing`. Links: none yet (render "Private build, no public link yet" in concrete).

**6 · `mil-survey` (secondary)**: Multi-Instance Learning: A Survey. Eyebrow `RESEARCH / WRITING`. No inspection tag. TODO(nadun): GitHub URL.

### 5.3 About (`#about`)
Two columns on desktop: copy on the left; the gearbox (sticky, from the shared canvas) on the right in **exploded view** with part callouts. Use the two About paragraphs from Content.md exactly. Then:

- Draft third paragraph (TODO(nadun): approve, edit or cut): *Faith sits at the centre of how I live and work. I count what I've been able to build as grace, not something I earned.*
- A **"How the parts fit"** list of 4 rows. Each row is a mono part number, a part name and one line. Each row maps to a gearbox part, and hovering a row focuses that part:
  - `P-01 · Mechanical engineering`: where the maths and the habit of measuring carefully come from.
  - `P-02 · Statistics and data science`: modelling large, messy datasets properly.
  - `P-03 · Machine learning and AI`: fine-tuning, evaluating and stress-testing models and agents.
  - `P-04 · Building`: shipping real tools: web, mobile, automation.
  - `S-00 · Centre`: Ephesians 2:8. What everything turns around.

### 5.4 Off the keyboard (`#hands-on`) (new section)
Purpose: show he is genuinely good with his hands without overdoing it. There are four tiles in a row (2×2 on tablet, stacked on mobile). Each has a mono label, a short title, one line, and an optional photo slot (4:3, full colour). **Only use confirmed facts. All four need Nadun's sign-off.**

- `WORKSHOP`: **Working as a mechanic.** TODO(nadun): employer/context and a line on the work, started Nov 2026.
- `AUTOMOTIVE`: **Assistant automobile technician, DIMO Lanka.** Internship, Nov 2016 to Jan 2017, about 360 hours.
- `CAD & 3D`: **SolidWorks and Blender.** 3D modelling for engineering and product work. TODO(nadun): mention that the gearbox on this page could be your own model (see 7.6).
- `INFRASTRUCTURE`: **Moved a company's server network.** Relocated Azzureo's entire server network between two Sydney sites.

Closing line (concrete): *Same habit on the bench and in the notebook: measure, fix, test, then measure again.* (TODO(nadun): approve)

### 5.5 Toolbox (`#skills`)
Title **Toolbox**. Render the five clusters from Content.md as "drawers": each cluster is a panel with a mono drawer label (`DRAWER 01 · LANGUAGES`) and wrapped mono chips. Use a 3-column masonry on desktop and 1 column on mobile. No proficiency bars or percentages.

### 5.6 Experience (`#experience`)
A vertical timeline with a thin steel-line spine and brass nodes. Each entry shows the role (Archivo 600), employer, dates (mono, concrete) and one line. Use the entries from Content.md, newest first, and add:
- TODO(nadun): **Mechanic, [employer]** (Nov 2026 – present). Confirm whether this belongs in Experience or only in Off the keyboard.
- **Assistant Automobile Technician (Internship), DIMO Lanka** (Nov 2016 – Jan 2017): about 360 hours of hands-on vehicle servicing. TODO(nadun): confirm the line.

### 5.7 Education (`#education`)
Two sub-blocks.

**Degrees** (two large cards, side by side on desktop):
- **Master of Data Science**, Macquarie University, Sydney, 2023–2025. Mono note: `Major project: clinical NLP · Distinction (82)`.
- **Bachelor of Engineering (Mechanical) (Hons.)**, Curtin University, delivered at SLIIT, Sri Lanka, 2014–2020. (Honours confirmed by Nadun.)
- Each card has a **"View certificate ↗"** link driven by `credentialUrl`. If `credentialUrl` is empty, hide the link. Both degrees link to their My eQuals certificates.

**Certificates** (sub-heading *Certifications*, mono eyebrow `ONLINE CREDENTIALS`):
- Reserve a grid for **8 certificates**: 4 columns desktop, 2 tablet, 1 mobile. Cards are compact: issuer logo slot (optional, 32px), title, issuer, date, optional hours, 2–3 skill chips, and a **"Verify ↗"** link.
- Data lives in `src/content/certificates.ts` with this type:
  ```ts
  type Certificate = {
    id: string; title: string; issuer: string; date: string; // ISO yyyy-mm
    hours?: number; skills: string[]; credentialUrl?: string; image?: string;
    status: 'published' | 'placeholder';
  };
  ```
- Seed **8 entries**. Entry 1 is known: *Data Analytics Foundations*, DeepLearning.AI, 2026-09, course 1 of the Data Analytics Professional Certificate (TODO(nadun): credential URL and confirm). Entries 2–8 are `status: 'placeholder'`.
- Placeholder cards render as dashed-outline "slot reserved" cards **in development only**. In production they are filtered out, and the grid still lays out cleanly for any count from 1 to 8.

### 5.8 Contact + footer (`#contact`)
- Title: **Get in touch**. Line: *The fastest way to reach me is email. I reply within a couple of days.* (TODO(nadun): confirm)
- Big email link (Archivo, brass on hover). Build the address client-side from parts to reduce scraping, and provide a "Copy email" button with a quiet "Copied" toast.
- LinkedIn and GitHub links. Location: Sydney, Australia. **Never show the phone number.**
- **Download resume** button → `/resume/Nadun-Chandrabahu-Resume.pdf` (TODO(nadun): supply the PDF).
- Knurled divider, then the footer.
- **Footer verse.** Centred and quiet: Plex Sans italic for the verse, mono for the reference.
  > *"For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God."*
  > `EPHESIANS 2:8 · NIV`

  (New International Version, Nadun's choice, 2026-11-26. Biblica's quotation policy allows a short NIV quotation on the web with the "NIV" label.)
- Bottom row (mono, concrete, small): `© 2026 Nadun Chandrabahu · Built in Sydney with Next.js and three.js`, plus a "Back to top ↑" link.

---

## 6. Accessibility and quality floor
- WCAG 2.2 AA. Visible focus everywhere: 2px brass outline with 2px offset.
- The 3D canvas is `aria-hidden="true"`. Everything it communicates also exists as DOM text: About "How the parts fit", project cards.
- Gearbox controls are reachable by keyboard: the About part list rows are buttons.
- Chat panel: `role="dialog"`, labelled; a focus trap when it's open on mobile; `Esc` closes it; new replies are announced in an `aria-live="polite"` region; the input has a visible label.
- Reduced motion is respected everywhere (2.7).
- Skip-to-content link. Semantic landmarks. One `h1`.
- Responsive from 360px to 1920px+. Touch targets ≥ 44px.

---

## 7. The 3D gearbox

### 7.1 Why a planetary gearbox
It's a real piece of mechanical engineering, so it signals his engineering background without saying so. It's also a clean metaphor for the story:

| Part | Material | Meaning | Story id |
|---|---|---|---|
| **Sun gear** (centre) | brass | **Faith.** Engraved `EPH 2:8`. The centre everything turns around. | `sun` |
| **Planet 1** | machined steel | Mechanical engineering | `engineering` |
| **Planet 2** | machined steel | Statistics and data science | `data` |
| **Planet 3** | machined steel | Machine learning and AI | `ai` |
| **Planet 4** | machined steel | Building (web, mobile, automation) | `build` |
| **Ring gear** (outer, fixed) | dark steel | **The work.** 7 marked segments, one per project | `ring` |
| **Carrier plate** (behind) | graphite steel, knurled rim | Holds the planets together | `carrier` |

The ring is fixed, so the project segments stay put while the disciplines orbit past every project. Keep that physically true.

### 7.2 Geometry (procedural, no model file needed for v1)
- Generate involute spur gear profiles in code (`THREE.Shape` → `ExtrudeGeometry` with a small bevel), 20° pressure angle, module 1 in local units, then scale the group.
- Tooth counts must mesh properly: **sun Z=24, planets Z=12, ring Z=48 (internal)**. Check: 24 + 2×12 = 48, and (24 + 48) / 4 = 18 is an integer, so 4 equally spaced planets work. Pitch radii are 12, 6 and 24; the sun–planet centre distance is 18.
- The ring is an internal gear: outer circle shape with a toothed hole.
- Add bore holes, keyways and lightening holes on the sun and carrier for realism. Add hex bolt heads on the carrier.
- **Kinematics (ring fixed):** if the sun turns at ω, the carrier turns at ω/3 and each planet spins about its own axis at −ω. Drive everything from one `rpm` value so the teeth stay meshed visually.
- Mark the 7 project segments on the ring face with thin engraved index lines and tiny mono numbers `00`–`06` (drei `<Text>` with a **self-hosted font file**, never a CDN font). A highlighted segment gets an emissive brass inlay.
- The sun-gear face carries an engraved `EPH 2:8` (drei `<Text>`, brass-deep, slight depth offset).

### 7.3 Materials and lighting
- Steel: `MeshPhysicalMaterial`, metalness 1, roughness 0.28–0.38, a little anisotropy for a brushed look, a faint temper-tint edge (fresnel in `onBeforeCompile`, or a thin bevel ring mesh).
- Brass: metalness 1, roughness 0.3, colour around `#B8913F`.
- Environment: **drei `<Environment>` built from `<Lightformer>`s** (a procedural studio, so there is no HDR download and no CDN request). Add one warm key strip, one cool rim, and a soft top fill.
- Background stays transparent so the page's graphite shows through. Add soft contact shadows under the assembly.

### 7.4 Modes (also chatbot-controllable)
- `machined` (default): full PBR metal.
- `blueprint`: hide the solids and show `EdgesGeometry` line drawings in brass on transparent, plus centre lines (dash-dot) and two dimension callouts (`Ø48`, `Z=24`). This is the engineering-drawing view.

### 7.5 Scroll choreography (desktop, no reduced motion)
One fixed full-viewport `<Canvas>` behind the content (`position: fixed; inset: 0; pointer-events: none`), with the gearbox positioned per section by a **state machine in a zustand store**. GSAP ScrollTrigger only *writes target state*; the scene *damps toward it* every frame (`maath/easing` `damp3`/`dampE`).

| Section | Gearbox target state |
|---|---|
| hero | right side, assembled, three-quarter view, idle rpm 6, machined |
| work | moves right and tilts face-on to the ring; the segment for the card in view lights up |
| about | moves right (sticky), **exploded** along its axis (amount 0.7), part callouts on, slow rpm |
| hands-on | reassembles, `blueprint` mode, rpm 0 |
| skills / experience / education | shrinks into the top-right corner (scale 0.35, opacity 0.5) or fades out; keep reading comfort first |
| contact | returns centre-bottom, face-on, slowly turning so `EPH 2:8` on the sun reads clearly beside the footer verse |

On mobile (`< 768px`) or low-power devices, the canvas lives only in the hero (not fixed), uses DPR max 1.5, has no postprocessing and no scroll choreography. Chatbot actions still work: they scroll to the hero canvas first.

### 7.6 Swap-in path (v2, optional)
If Nadun models his own gearbox in SolidWorks or Blender, export it to GLB (meshopt-compressed, under 1.5 MB), keep the same node names (`sun`, `planet_engineering`, ...), and load it with `useGLTF` from `/public/models/`. "I modelled this myself" then becomes part of the story. Keep the procedural version as the fallback.

### 7.7 Performance and fallbacks
- Load the canvas with `next/dynamic` (`ssr: false`) **after** first paint. Show a static poster image (`/public/gearbox-poster.webp`, a render of the assembled gearbox) until it's ready, and keep it if WebGL is unavailable.
- Use drei `<PerformanceMonitor>` + `<AdaptiveDpr>` and pause rendering when the canvas is off-screen (`frameloop="demand"` with invalidation, or visibility checks).
- Budgets: LCP < 2.0s on 4G mid-range mobile; initial JS (without the 3D chunk) < 200 KB gzipped; 3D chunk < 450 KB gzipped; Lighthouse ≥ 90 on Performance, Accessibility, Best Practices and SEO.

### 7.8 The store (single source of truth for scroll *and* chatbot)
```ts
// src/three/gearboxStore.ts
type FocusTarget = 'overview' | 'sun' | 'engineering' | 'data' | 'ai' | 'build' | 'ring';
type GearboxState = {
  focus: FocusTarget;
  explode: number;          // 0..1
  mode: 'machined' | 'blueprint';
  rpm: number;              // 0..60
  highlightProject: ProjectId | null;
  controlledBy: 'scroll' | 'chat';
  // actions
  apply(partial: Partial<GearboxState>, source: 'scroll' | 'chat'): void;
  releaseToScroll(): void;
};
```
- When the chatbot sets state, `controlledBy = 'chat'` and scroll updates are ignored until the visitor scrolls more than ~40% of a viewport, clicks **"Release"** on a small chip (`GEARBOX · CHAT CONTROL · Release`), or the chat sends `reset`.
- `focus` moves the camera to a preset position/target for that part and shows its callout.

---

## 8. Chatbot (front end + proxy)

### 8.1 What it is
A "Digital twin" assistant (panel title "Digital Nadun") that answers questions about Nadun from a knowledge file, and **drives the gearbox to illustrate its answer**. Example: ask "how does a mechanical engineer end up in AI?" and it focuses the engineering planet, spins the gears so you can see the drive pass through the mesh, then focuses the AI planet.

### 8.2 Architecture
```
Browser ──POST /api/chat──▶ Vercel route handler (Node runtime)
                              1. BotID check
                              2. Rate limit (Upstash)
                              3. zod-validate request
                              4. POST to n8n webhook with secret header (server-side env only)
                              5. zod-validate n8n response, drop unknown actions, clamp numbers
                         ◀── { reply, actions[], suggestions[] }
Browser renders reply as text → runs actions through the executor → gearbox store
```
The browser never sees the n8n URL, the secret, the model provider or any key.

### 8.3 Contracts (`src/lib/chat/schema.ts`, shared by the route and the client)
```ts
export const ProjectId = z.enum(['field-shift','clinical-nlp','language-id','mortgage-defaults','pickl-hq','grow365','mil-survey']);
export const SectionId = z.enum(['hero','work','about','hands-on','skills','experience','education','contact']);

export const ChatRequest = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(500),
});

export const GearboxAction = z.discriminatedUnion('type', [
  z.object({ type: z.literal('focus'), target: z.enum(['overview','sun','engineering','data','ai','build','ring']) }),
  z.object({ type: z.literal('explode'), amount: z.number().min(0).max(1) }),
  z.object({ type: z.literal('mode'), value: z.enum(['machined','blueprint']) }),
  z.object({ type: z.literal('spin'), rpm: z.number().min(0).max(60) }),
  z.object({ type: z.literal('highlightProject'), id: ProjectId }),
  z.object({ type: z.literal('scrollTo'), section: SectionId }),
  z.object({ type: z.literal('reset') }),
  z.object({ type: z.literal('lights'), on: z.boolean() }), // page lighting, added 2026-11-26
  z.object({ type: z.literal('rain'), on: z.boolean() }),   // page weather, added 2026-11-26
  // (the route also accepts an older { type: 'theme', value: 'dark'|'light'|'rain' })
]);

export const ChatResponse = z.object({
  reply: z.string().max(1500),
  actions: z.array(GearboxAction).max(4).default([]),
  suggestions: z.array(z.string().max(80)).max(3).default([]),
});
```
In the route, parse each action individually with `safeParse` and **drop invalid ones rather than failing the whole reply**. Clamp numbers before validating.

### 8.4 `/api/chat` route handler (`src/app/api/chat/route.ts`)
- `export const runtime = 'nodejs'`; POST only; return 405 for anything else.
- Order: `checkBotId()` → 403 if bot; reject if the `Origin` header isn't the site's own origin; rate limit by a hashed IP (sliding window **8 requests/minute and 60/day**) → 429 with a friendly JSON message; parse the body (max 2 KB) with `ChatRequest` → 400 on failure.
- If `CHAT_ENABLED !== 'true'`, return a polite "assistant is offline, email Nadun" reply (a kill switch).
- If `CHAT_MOCK === 'true'`, return canned responses from `src/lib/chat/mock.ts` (keyword-matched, with realistic actions) **so the whole UI can be built before n8n exists**.
- Otherwise `fetch(process.env.N8N_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Portfolio-Secret': process.env.N8N_WEBHOOK_SECRET }, body: JSON.stringify({ sessionId, message }), signal: AbortSignal.timeout(25000) })`.
- Validate with `ChatResponse`. On any upstream error or timeout, return `{ reply: "The workshop assistant is having a moment. You can email Nadun directly at the address below.", actions: [], suggestions: [] }` with status 200, and log server-side without the message text.
- Response headers: `Cache-Control: no-store`.
- Never echo upstream error bodies to the client. Never log message contents.

### 8.5 Chat UI (`src/components/chat/`)
- A docked panel bottom-right on desktop (400×560); a full-height sheet on mobile. It's styled like a workshop instrument: a cast panel with a machined border, a header with a mono title `DIGITAL NADUN` and a small status lamp, and close/minimise buttons.
- Opening state: one line, *Ask about Nadun's projects, background or how to reach him. I can also take the gearbox apart for you.*, plus suggestion chips:
  - "How does a mechanical engineer end up in AI?"
  - "Show me the NASA project"
  - "Take the gearbox apart"
  - "What's at the centre?"
- Messages: visitor messages are right-aligned on machined; replies are left-aligned with no bubble, bone text, and a 2px brass left rule. **Render replies as plain text** (split paragraphs on blank lines, and auto-link only URLs on this site's own domain, GitHub and LinkedIn). **Never use `dangerouslySetInnerHTML`.**
- While waiting, show a small mono indicator `machining…` with three gear-tooth ticks (static under reduced motion).
- When actions run, show a one-line mono receipt under the reply, e.g. `→ focus: ai · spin: 30 rpm`, so it's clear the bot moved the model.
- Input: max 500 chars with a visible counter after 400; Enter sends, Shift+Enter adds a newline; the send button is disabled while waiting.
- Session: generate a `sessionId` with `crypto.randomUUID()` and keep it in `sessionStorage`. No cookies.
- Small print under the input (concrete, 12px): *AI assistant. It can be wrong; check anything important with Nadun.* (TODO(nadun): add "Chats aren't stored" only once n8n execution saving is turned off, see CHATBOT_SETUP.md.)

### 8.6 Action executor (`src/lib/chat/executor.ts`)
- Runs actions **in order**, ~900ms apart, so the movement reads as a sequence. (Under reduced motion: apply the final state instantly and skip the spin.)
- `scrollTo` uses `element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })`. On mobile, any gearbox action first scrolls to the hero canvas.
- `highlightProject` also scrolls the matching card into view and gives it a brass outline pulse for 2s.
- `reset` sets overview/assembled/machined/rpm 6 and releases control to scroll.
- Unit-test the executor and schemas with vitest, including malformed input.

### 8.7 Knowledge file (single source of truth)
Add `scripts/build-knowledge.ts`, run at `prebuild`. It compiles `src/content/*.ts` into `public/knowledge.md`: a plain-text fact sheet of hero, about, projects, hands-on, skills, experience, education, certificates (published only), public contact and the faith/verse note. **It must exclude** placeholders, TODO text and anything not shown on the site. The n8n workflow fetches this file, so the bot always matches the live site. This file is public by design: it contains only public site content.

---

## 9. Security (no login, no exposed APIs)

- **Secrets:** `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` are server-only env vars in Vercel. Add `import 'server-only'` to any module that reads them. Commit a `.env.example` with names only; `.env*` stays in `.gitignore`.
- **One outbound integration:** only `/api/chat` calls anything external. There are no client-side calls to GitHub, Supabase, model providers or n8n. If GitHub stats are ever wanted, fetch them at build time.
- **Security headers** (set in `next.config.ts` `headers()`). **Decision (Phase 6):** the CSP is static, not nonce-based. In Next.js 16 nonces force every page view to render on the server (no static prerendering), so `script-src` is `'self' 'unsafe-inline' blob:` instead of `'nonce-…' 'strict-dynamic'`; everything else below stands. `blob:` is for three.js text workers (troika). The site renders no user content as HTML. The policy as originally specified:
  - `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' <vercel analytics/BotID endpoints as the docs require>; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` · `X-Frame-Options: DENY`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
  - `Cross-Origin-Opener-Policy: same-origin`
- **Bot and abuse protection:** Vercel BotID on `POST /api/chat`; Upstash rate limiting; a request body size cap; message length cap; origin check; upstream timeout; a kill switch env var.
- **Output safety:** model output is treated as untrusted. It's rendered as text, actions are allow-listed by zod, and numbers are clamped. The model can never trigger navigation off-site, run code, or change anything but the gearbox and scroll position.
- **No forms besides chat.** Contact is a mailto link plus "copy email". There is no newsletter, no contact form endpoint and no database.
- **Dependencies:** commit the lockfile; enable Dependabot or Renovate; run `npm audit --omit=dev` in CI. **Keep Next.js on the latest patch.** Next.js has shipped security releases most months in 2026.
- **Privacy:** no cookies, no tracking pixels, cookieless analytics only. Never render the phone number anywhere, including the knowledge file.

---

## 10. Repository structure
```
/
├─ CLAUDE.md
├─ docs/
│  ├─ Content.md               # copy source (design sections superseded)
│  └─ CHATBOT_SETUP.md         # n8n + Vercel setup for the assistant
├─ public/
│  ├─ fonts/                   # font file for drei <Text> (self-hosted)
│  ├─ gearbox-poster.webp
│  ├─ images/projects/…        # optional thumbnails
│  ├─ resume/Nadun-Chandrabahu-Resume.pdf
│  └─ knowledge.md             # generated at prebuild
├─ scripts/build-knowledge.ts
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx  page.tsx  globals.css
│  │  ├─ api/chat/route.ts
│  │  ├─ opengraph-image.tsx   # OG card: data plate style
│  │  └─ sitemap.ts  robots.ts
│  ├─ content/  site.ts projects.ts about.ts handsOn.ts skills.ts experience.ts education.ts certificates.ts
│  ├─ components/
│  │  ├─ layout/  Nav.tsx Footer.tsx SectionHeader.tsx KnurlDivider.tsx
│  │  ├─ hero/    Hero.tsx DataPlate.tsx
│  │  ├─ work/    ProjectCard.tsx InspectionTag.tsx FeaturedProject.tsx
│  │  ├─ sections/ About.tsx HandsOn.tsx Toolbox.tsx Experience.tsx Education.tsx Contact.tsx
│  │  └─ chat/    ChatLauncher.tsx ChatPanel.tsx MessageList.tsx Suggestions.tsx
│  ├─ three/
│  │  ├─ GearboxCanvas.tsx Gearbox.tsx gearGeometry.ts materials.ts cameraPresets.ts
│  │  ├─ gearboxStore.ts useScrollChoreography.ts
│  │  └─ Callouts.tsx
│  ├─ lib/
│  │  ├─ chat/ schema.ts executor.ts mock.ts client.ts
│  │  ├─ ratelimit.ts env.ts (zod-validated, server-only)
│  │  └─ motion.ts (reduced-motion hook)
│  └─ instrumentation-client.ts  # BotID init protecting POST /api/chat
├─ tests/  schema.test.ts executor.test.ts smoke.spec.ts
└─ .env.example
```

---

## 11. SEO and sharing
- Title: `Nadun Chandrabahu · Data scientist and AI engineer, Sydney`
- Meta description: the hero line.
- OG image generated with `next/og` in the data-plate style.
- JSON-LD `Person` schema (name, jobTitle, address locality Sydney, sameAs LinkedIn/GitHub, alumniOf Macquarie and Curtin).
- `sitemap.ts`, `robots.ts`. Disallow `/api/`.

---

## 12. Build phases (do them in order)

**Phase 1: Scaffold.** create-next-app (TS, App Router, Tailwind, ESLint), strict TS, path aliases, fonts, tokens, `.env.example`, env validation, a vitest + Playwright setup, and `npm run typecheck`. Copy Content.md into `docs/`.
*Done when:* an empty page builds and lint/typecheck pass.

**Phase 2: Static site, no 3D.** All content files and all sections with real copy, nav with active state, mobile menu, data plate, inspection tags, dimension headers, the certificates grid with placeholders, and the footer verse. Use the poster image where the gearbox will go.
*Done when:* it's fully readable and responsive at 360/768/1280/1920, keyboard-navigable, and Lighthouse is ≥ 95 on all four.

**Phase 3: Gearbox.** Procedural gears with correct tooth counts and kinematics, materials, lightformer environment, both modes, explode, engravings, project segments, the store, and camera presets. Hero only at first.
*Done when:* it runs at 60fps on a mid-range laptop, with a WebGL fallback and reduced-motion static view.

**Phase 4: Scroll choreography.** A fixed canvas + ScrollTrigger state machine per 7.5, About callouts, card ↔ ring highlighting, and the mobile hero-only mode.

**Phase 5: Chat UI + proxy in mock mode.** The schema, route (with BotID, rate limit, kill switch, mock), panel UI, executor, receipts, control chip and knowledge build script. `CHAT_MOCK=true`.
*Done when:* all four suggestion chips produce sensible mock replies that move the gearbox, and the unit tests pass.

**Phase 6: Security + polish.** Headers/CSP (verify in the browser console that nothing is blocked), OG image, JSON-LD, sitemap, a reduced-motion pass and an accessibility pass (axe), plus a performance pass against the 7.7 budgets.

**Phase 7: Go live.** Deploy to Vercel, add env vars, connect n8n per CHATBOT_SETUP.md, set `CHAT_MOCK=false`, and run the red-team checklist in that doc.

---

## 13. Definition of done
- Every TODO(nadun) is either resolved or listed in section 14.
- No secret appears in client bundles. Check with `grep -r "N8N\|UPSTASH" .next/static` returning nothing.
- Lighthouse ≥ 90 on all four for mobile, ≥ 95 for desktop.
- No console errors or CSP violations.
- The site works with JavaScript disabled for all content (3D and chat excepted).

---

## 14. Open items for Nadun (keep this list current)
1. Role line: "Data scientist and AI engineer" vs "Data Scientist".
2. Field Shift: your own part (one sentence), front-end stack, prototype URL (`nasafieldshift` vs `nasafieldship`), teammate spelling (Nicholls/Nichols).
3. GitHub URLs for clinical NLP, language ID, mortgage defaults and the MIL survey.
4. Mechanic role details (employer, whether it goes in Experience).
5. Approval of the draft lines: hero sub-line, About faith paragraph, Off-the-keyboard closing line, contact reply-time line.
6. ~~Bachelor title: Honours or not. Degree certificate links.~~ Done: (Hons.) added, both certificates linked.
7. 8 certificates: titles, issuers, dates, links, images.
8. Resume PDF.
9. ~~Preferred Bible translation for Ephesians 2:8.~~ Done: NIV.
10. Optional photos for Off the keyboard (project thumbnails, Experience photos and the portrait are in).
11. Optional: your own SolidWorks/Blender gearbox GLB (7.6).
12. Production domain: set `SITE_URL` in Vercel (metadata, canonical URL, sitemap, robots, JSON-LD). Until then the Vercel production URL is used.
13. Research links for both degrees' major projects (`researchUrl` in `src/content/education.ts`): the clinical NLP project (master's) and "Measurement of Thermal and Optical Properties of Metal Oxide Nanoparticles" (bachelor's). The "View research" buttons appear once these are set.
