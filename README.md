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

### Enable real nearby food search

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
