## Goal

Match seats.aero's results layout: one row per trip option showing miles + taxes + seats in Y / W / J / F columns. Drop the single-cabin filter — every cabin the source advertises for that trip renders inline.

## What the user sees

- Search form: remove the Cabin dropdown. Popular routes / dates / pax stay.
- Results table columns become: Program · Airline | Route · Date | Stops · Duration | Economy | Premium | Business | First | Updated | Book.
- Each cabin cell renders `miles` on top, `taxes (AUD)` + `seats` underneath, plus a tiny CPP grade chip. Empty cell = "—" when that cabin isn't on this trip.
- Card view (mobile): same idea — one card per trip with a 2×2 grid of cabin tiles.
- Sort menu adds "Cheapest cabin" (min miles across cabins on the row) and keeps depart / stops / duration / updated. Value / miles / taxes sorts move into a "Sort by cabin" submenu (Y/W/J/F).
- Sweet-spot highlight and CPP grade are computed per cabin cell, not per row.
- Compare tray, shortlist, and Book flow stay per-cabin — clicking a cabin cell selects that specific redemption.

## Data flow

- Provider stops filtering by requested cabin. For each seats.aero trip (already fanned out via `include_trips=true`), it emits up to 4 itineraries — one per cabin that trip advertises — sharing a stable `tripKey` (source availability + trip id).
- Search input `cabin` becomes optional and is ignored server-side. Keep the field so old shared URLs / recent-searches don't break; the client just doesn't send it.
- The results page groups itineraries by `tripKey` and renders one row with cabin cells. Ranking / sweet-spot / CPP grading run on the flat itinerary list first (unchanged math), then the grouper stitches the row.

## Downstream cleanups

- `SearchForm`, `ShareSearchButton`, `RecentSearches`, and the `/awards/$route` deep links stop reading/writing `cabin`.
- Alerts, watchlists, and the Book page keep asking for a specific cabin — those are per-redemption, not per-search.
- `PDF export` and the "No award space found — try a different cabin" empty state get updated copy.
- Homepage benchmark strip that reads `query.cabin` falls back to "business" for its illustrative numbers.

## Technical notes

Types (`src/lib/awards/types.ts`):
- Add `tripKey: string` to `AwardItinerary`.
- `SearchInput.cabin` becomes optional.

Provider (`seatsAeroProvider.ts`):
- Drop `cabin` from the query string; iterate all four cabin fields on each trip and emit an itinerary per available cabin. `tripKey = trip.ID` (falls back to `${row.ID}` on the availability-fallback path).

Server fn (`awards.functions.ts`):
- Make `cabin` optional in the Zod schema; include it in the cache key only when present.

Ranking (`intelligence.ts`):
- No math change — still per-itinerary CPP / grade / sweet-spot. Add a helper `groupByTrip(rows)` that returns `{ tripKey, base: RankedItinerary, cabins: Partial<Record<Cabin, RankedItinerary & SweetSpotInfo>> }[]`.

UI:
- `AwardTable` rewritten around the grouped shape. `AwardCard` gets a 2×2 cabin grid.
- `CompareBar` / shortlist store the underlying per-cabin itinerary id — no schema change.
- Book link becomes `/book?id=<per-cabin id>` on the cell, so cabin context is preserved.

## Out of scope

- Trip-detail expander (segments / aircraft) — keeping current single-line layout for now.
- Changing alerts to be multi-cabin.
