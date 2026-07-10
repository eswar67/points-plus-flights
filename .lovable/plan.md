# Concierge revamp

Rebuild the home page and results view around a first-time traveller who doesn't know what "CPP" or "sweet spot" means. Advanced power stays available, just tucked away.

## 1. Homepage — 3-field search

Replace the current dense SearchForm hero with a large, single card:

- **From** (airport code / city, with existing datalist)
- **To** (same)
- **When** (single "Anytime in the next 90 days" default, with an optional month picker)
- Big primary CTA: **Find my trip**

Remove from the hero: cabin toggle, passenger stepper, program picker, direct-only toggle, taxes cap, sort chips, tips row. All of these move behind a small "More options" disclosure (closed by default) on the same page. Passengers defaults to 1, cabin defaults to "any", stops "any".

Copy tone: "Tell us where you dream of going — we'll find the smartest way to get there with points."

Keep the existing HowItWorksStrip, ValueProps, FAQ below.

## 2. Results — split by cabin

Rewrite `src/routes/index.tsx` results section:

- Three stacked sections in this order: **Economy**, **Business**, **First**. Premium Economy folded into Economy when sparse, otherwise its own smaller section.
- Each section:
  - Section header with plain-English blurb ("Business class — lie-flat comfort, best value picks")
  - Top 3–5 itineraries only (view-all link expands the rest)
  - Table view stays as the layout inside each section, but scoped to that cabin
- Cards view removed as top-level choice; cabin is the organising axis instead. Table/Cards toggle → remove.
- Each row shows a concierge one-liner instead of grade chip: "Great deal — save ~$4,200 vs cash" / "Solid pick" / "Only book if flexible". Derived from existing `grade` + `cpp` fields, no new data.

## 3. Filters — collapsed refine drawer

- All existing filter/sort controls collapse into a single **Refine** button that opens a slide-over/drawer.
- Default sort per section: value (existing "value" ranking) — user doesn't choose.
- Inside the drawer: program picker, max stops, taxes cap, sort options (including per-cabin sorts). Keep everything already built, just hidden.

## 4. Concierge voice pass

Sweep visible copy in these files:
- `SearchForm.tsx` hero copy
- `AwardTable.tsx` — remove "CPP", "Y/W/J/F" short codes from row chips; replace with "Economy / Business" etc. Keep short codes only inside the refine drawer for power users.
- Section blurbs on results
- Empty state ("No trips found — try widening dates" instead of the current phrasing)

Terms like "points", "taxes", "seats left" stay — they're plain enough.

## Files touched

- `src/components/site/SearchForm.tsx` — collapse to 3 fields + "More options"
- `src/routes/index.tsx` — split-by-cabin results, Refine drawer, remove card/table toggle
- `src/components/site/AwardTable.tsx` — accept a `cabinScope` prop, plain-English recommendation column, drop the CPP chip
- New tiny helper `src/lib/concierge.ts` — grade + cpp → one-liner
- Copy tweaks in `HomeSections.tsx` if the hero section header conflicts

## Technical notes

- No data model / provider changes. All fields already exist on `RankedItinerary`.
- Sorting logic stays; per-cabin sort keys become accessible only via the Refine drawer.
- Existing routes, playbook drawer, shortlist, compare — all untouched.
- Table columns per section: Program · Route/Date · Stops · Duration · Points · Taxes · Recommendation · Updated. (Only one cabin's numbers shown per section, so the 4-cabin grid collapses to a single "Points" column.)
