# Makan Mana

**Good food. Less overthinking.** A responsive food finder by Lim Ziwei, built with vanilla JavaScript, custom SVG artwork, and a Cloudflare Worker backend. No build step or frontend framework is required.

## Ready now

- Discover, Map, and Saved screens, with phone bottom navigation.
- Six clearly fictional sample restaurants so the app works before API setup.
- Cuisine moods, relative price levels, radius, opening status, text search, and sorting.
- Saved place IDs stored locally, with removal and persistence across visits.
- A random picker that avoids repeating the previous choice when possible.
- Place details, opening hours when provided, and real Google Maps directions in live mode.
- Optional one-time geolocation, consent explanation, graceful denial, empty results, retry controls, reduced-motion support, keyboard focus, and native dialogs.
- Installable-app manifest and icons. Installation availability depends on browser; there is no offline search or service worker.

## Run locally

Node.js 20 or newer:

```sh
node scripts/dev.mjs
```

Open **http://localhost:4180**. `PORT` can override the port. Sample mode requires no API keys. The local server runs the same API handler as Cloudflare. To test live search locally, provide secrets through your shell environment; never commit them.

```sh
npm test
npm run check
```

## Deploy to Cloudflare Workers

Connect this GitHub repository to Workers Builds. Root directory: repository root. No build command is needed; deploy command: `npx wrangler deploy`. Alternatively, install/sign in to the official Wrangler CLI and run that command from this repository. `wrangler.jsonc` serves `public/` and routes `/api/*` to `src/worker.js`.

Deploying without keys is supported and shows sample mode honestly. This repository has not created a Cloudflare deployment or enabled any paid Google services for you.

### Recommended: free Geoapify + OpenStreetMap

1. Create a free account at https://myprojects.geoapify.com/ and create a project.
2. Copy its API key directly into Cloudflare → Workers & Pages → makan-mana → Settings → Variables and Secrets. Add **Secret** `GEOAPIFY_API_KEY`, then deploy/save the change. Do not put the key in Git or chat.
3. Reload Makan Mana, choose Live search, enter an area (e.g. Setapak, Kuala Lumpur) and choose a food mood. Or use Find food near me. The separate optional restaurant-name field matches names, not arbitrary food descriptions.
4. Open Map for an OpenStreetMap embed and selectable results. No Google key or billing setup is needed for this path.

Geoapify is preferred automatically when its secret exists. Its free plan currently offers 3,000 credits/day, no card required; stay within its usage limits (https://www.geoapify.com/pricing/). Credits are not identical to searches: area lookup, places, and saved-place refresh consume requests. Monitor the provider dashboard. Our per-isolate throttle is not a global quota.

Geoapify/OpenStreetMap results include names, addresses, coordinates and available source hours. Ratings, price levels and open-now status are not supplied by this integration, so their controls are disabled in live free mode. Halal/allergen status is never inferred. Coverage can be incomplete. Food artwork stays illustrative. Attribution is shown near results and the map.

Searches and optional coordinates go to Geoapify through the server. Opening a map sends its selected location to OpenStreetMap. Only provider-prefixed saved IDs are persisted. Google-saved places stay in storage but are not fetched with the Geoapify key.

### Alternative: Google Places nearby food search

1. Create a Google Cloud project and enable **Places API (New)** with billing. Check current pricing before enabling it: requested rating, price, and opening-hours fields affect the SKU charged.
2. Create a server API key restricted to Places API (New). Add the Worker **secret** `GOOGLE_PLACES_API_KEY` in Cloudflare Settings → Variables and Secrets, or use `npx wrangler secret put GOOGLE_PLACES_API_KEY` interactively. Never paste the secret into browser source, Git, or chat.
3. Configure Google API quotas and billing alerts before public use. The Worker has a modest per-IP, per-isolate throttle (8 requests/minute); it is **not a global quota or a spending cap**. For public launch, add Cloudflare WAF/rate limits and abuse monitoring. Search is user-triggered, not autocomplete, and returns at most 20 places.
4. Reload the app, choose **Live search**, then enter an area or use **Find food near me**. Coordinates are never requested automatically. Distance filters use straight-line distance from the shared position, not driving distance.

### Embedded map (optional)

Enable **Maps Embed API** and make a separate browser key restricted to Maps Embed API and your site's HTTP referrers. Set `GOOGLE_MAPS_EMBED_KEY` as a Worker variable. This key is intentionally visible to the browser, unlike the Places secret. The Map view shows the selected place through Google's map. Without it, live places still have an external Google Maps link. Sample mode shows an explicitly illustrative map, never fake real-world pins.

## Data and privacy

- Sample names, ratings, hours, prices, and coordinates are fictional. All food graphics are illustrations created for this project, not venue photographs.
- Live results are attributed to Google Maps. Unknown prices, ratings, and hours are labelled unknown; they are not estimated. Price levels are relative `$` categories, not USD amounts or RM menu prices.
- We do not claim halal certification or allergen safety. Confirm dietary requirements with the venue.
- Only place IDs are persisted to local storage. Live place details are held in memory and re-fetched from the provider when saved items need to be loaded. Up to 12 saved IDs per mode are supported.
- Search requests and optional coordinates go through the Worker to Google. API responses use `no-store`. This app does not deliberately persist search/location history; infrastructure providers may retain operational logs. Google Fonts and an optional Google map also make third-party requests.
- No API credentials are included. Real provider connectivity, account restrictions, quotas, and billing cannot be validated until the owner configures their keys.

## Structure

| Path | Purpose |
| --- | --- |
| `public/index.html`, `style.css` | Responsive UI |
| `public/app.js` | Routing, UI state, saved places, picker, maps |
| `public/core.js` | Shared filtering, distance, input validation, normalization |
| `public/data.js` | Fictional sample places |
| `src/worker.js` | Protected Places proxy, validation, errors, configuration |
| `scripts/dev.mjs` | Dependency-free local preview server |
| `tests/` | Core behavior and mocked provider/API contract tests |

## Provider references

- [Google Places Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search)
- [Google Places Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Place data fields and billing categories](https://developers.google.com/maps/documentation/places/web-service/data-fields)
- [Google Maps Embed API](https://developers.google.com/maps/documentation/embed/get-started)

The public Nominatim and Overpass endpoints are not used as a production backend for this app.

## Free venue details and distances

Each real-place detail screen now includes a Google Maps venue search for reviews and prices, separate walking/driving directions, and source-provided menu, website, and phone links when available. External search may return multiple matches; check the restaurant name and address. No ratings or menu prices are scraped or invented.

Distance labels distinguish a device location (with reported accuracy) from a searched area's centre. In-app distances are straight-line estimates; road distance and travel time are shown by Google Maps after opening directions. Location is requested only after consent and is not persisted by this app. Source hours can be raw OpenStreetMap notation and do not imply verified open-now status.

## Discovery improvements

- Location status names the searched area or device position, includes accuracy, and offers refresh/change-area controls with specific permission and timeout help.
- Separate area and food fields. Recognised food words map to supported cuisine categories; unknown text remains a restaurant-name query. Individual dishes are not guaranteed.
- Real Geoapify places appear as numbered, selectable Leaflet markers with an accessible place-button list. Moving the map never calls the search API automatically: use Search this area to search its centre using the selected radius.
- Clean cards omit repeated missing-data labels; one explanation remains above the list and full availability details remain in the dialog.
- Picker lets you choose current results or saved places, explains distance/category matches, and skips the last choice when alternatives exist. Existing filters still apply.
- Skeleton loading, request cancellation and stale-response guards prevent old searches overwriting new results. Filters remain intact across screens; errors retain a retry action.

Leaflet 1.9.4 is vendored under `public/vendor/`, including its BSD license. Live map tiles load directly from OpenStreetMap using browser caching and visible attribution. No tile prefetch/offline downloads are implemented. Public tiles are best-effort and subject to https://operations.osmfoundation.org/policies/tiles/; for substantial traffic move to a dedicated tile provider. Browser access was disabled during this change; automated behavior tests do not replace a real phone visual QA pass.


## Broader discovery

- Geoapify initial searches request up to 10 places per 1 km distance band. A 3 km search queries 0–1, 1–2, and 2–3 km separately; cuisine applies to each. Each group has its own offset, Load 10 more, retry, loading and exhaustion state. Initial requests run sequentially and resolve an area only once.
- Each group can traverse up to 1,000 provider results. Polygon distance bands are checked against exact straight-line distance; boundary approximations and incomplete map coverage mean this is not an exhaustive directory.
- Recent pages stay in memory for five minutes, bounded to 40 pages. No automatic infinite scroll or background prefetch. Existing rate limits remain enabled. Wider searches require more API requests and free provider quotas still apply.
- Phone cards use compact rows with distance badges, Save, Directions, and Prices & hours. Sticky distance tabs jump to expanded groups. The filter bottom sheet stages cuisine/distance changes and applies once; Cancel and Escape discard edits.
- Saved places support Want to try / Been there, name search, and private notes. Stored only in this browser, without an account. Removing a saved place removes its notes.
- View scroll positions, expanded groups, and the map viewport are retained during List/Map navigation. Closing restaurant details restores the background position.
- Pick for me supports loaded results or saved places, filters, excluding visited places, and avoiding immediate repeats.
- No additional paid API or service is required. Browser visual QA requires enabling local browser use in Work settings.
