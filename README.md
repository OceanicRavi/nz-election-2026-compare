# NZ Election 2026 — Compare the Parties

**Live:** https://nz-election-2026-compare.vercel.app

A comparison of the 7 main parties contesting the 2026 New Zealand
general election across 18 policy domains — each policy explained
simply (ELI15 analogies), plus a bot-updated live news feed, real
published opinion polls with a trend chart, campaign social-media
moments decoded, a personalised "Find Your Match" tool, an anonymous
leaning poll, and an electorate candidate lookup.

Editorial design system (Fraunces/Inter type, warm sunset-orange accent)
over a real NZ landscape photo and real leader photos/party logos — all
properly licensed, see **Photo & logo credits** below.

Pure HTML/CSS/JS on the frontend — no framework, no build step. The
only "backend" is a GitHub Action (content bot) and two small Vercel
serverless functions (poll + storage).

## Structure

```
index.html                             Main comparison page (includes embedded Find Your Match)
find-your-match.html                   Standalone deep-link version of the same tool
constituency.html                      Electorate candidate lookup page
css/styles.css                         All styling (editorial theme, responsive)
js/data.js                             Parties, 18 domains, policies+analogies, leaders, profiles, SITE_CONFIG
js/app.js                              Renders the matrix, polls, decoder, manifesto watch, leaning poll, form
js/match.js                            Renders the Find Your Match profile/concern picker (used on both pages)
js/constituency.js                     Renders the electorate lookup page
api/poll.js                            Vercel serverless function: anonymous poll (GET/POST)
data/electorates.json                  Candidate-by-electorate data (43 verified + list of unverified)
data/news.json                         Bot-generated — latest filtered election news (RSS)
data/polls.json                        Manually-refreshed real published opinion polls
data/manifesto-watch.json              Bot-generated — per-party change-detection status
data/manifesto-hashes.json             Bot-internal — content hashes used to detect changes
scripts/fetch-updates.mjs              The news/manifesto bot (runs on a schedule)
scripts/make-og-image.py               Regenerates assets/og-image.png if you change the branding
.github/workflows/update-content.yml   Cron job: runs the bot every 2h, commits changes
assets/hero-photo*.jpg                 Hero background (real photo, see credits)
assets/leaders/*.jpg                   Leader photos (real photos, see credits)
assets/logos/*                         Party logos (official party assets)
assets/favicon.svg, og-image.png       Tab icon + social preview
robots.txt / sitemap.xml               SEO
netlify.toml / vercel.json             Deploy configs (+ security headers)
package.json                           @vercel/blob dependency + local preview script
```

## Run locally

```
npm install
npm start
```
or just open `index.html` in a browser (the poll and some live-data
fetches won't work without a real deploy, since they need `/api` and
the GitHub Action's output).

## Deploy

### Vercel (what's live right now — needed for the poll + SEO canonical URLs)
```
npm i -g vercel
vercel --prod
```
Already linked to `ravis-projects-053aad42/nz-election-2026-compare`.
`vercel.json` handles routing/headers; the `/api/poll.js` function and
the connected Blob store (`nz-election-votes`) are what make the poll
work with **zero extra signup** — both live under the same Vercel
account already used to deploy.

### Netlify / GitHub Pages (static parts only)
Everything except the `/api/poll` endpoint works fine as a plain static
deploy (drag-and-drop to Netlify, or GitHub Pages). The poll will show
"unavailable in this deployment" there, since those hosts don't run
Vercel's serverless functions — the rest of the site (comparison
matrix, news, manifesto watch, electorate lookup) is unaffected.

## One-time setup steps (each is free, no new account beyond what you already have)

1. **Analytics — Vercel Web Analytics.** The page already includes the
   tracking script (`<script defer src="/_vercel/insights/script.js">`
   in `index.html`). Turn it on with one click: Vercel dashboard →
   this project → **Analytics** tab → **Enable**. Free on the Hobby
   plan, no separate account, no cookie banner needed.
2. **Suggestion form — Web3Forms.** Go to [web3forms.com](https://web3forms.com),
   enter an email, and you'll instantly get a free access key (no
   password/signup flow). Paste it into `SITE_CONFIG.web3formsKey` in
   `js/data.js`. Until you do, the form falls back to opening the
   visitor's email client (if you set `SITE_CONFIG.fallbackEmail`) or
   shows a "not wired up yet" message.
3. **Poll storage** is already live (Vercel Blob store `nz-election-votes`,
   created and connected via `vercel storage create` / `vercel storage
   connect`) — nothing further to do.

## The anonymous "leaning" poll

`api/poll.js` is a tiny serverless function: `GET` returns current vote
totals, `POST { party }` casts/changes a vote. One browser = one vote,
enforced with a random id in a cookie (`nzc_voter`) — **no name, email,
or IP is stored**. Votes live in a single JSON file in Vercel Blob
(`poll/votes.json`), read-modify-written on each vote. This is a casual
engagement feature, not a scientific survey, and the UI says so.

Caveats: it's not abuse-proof (clearing cookies lets someone vote
again), and read-modify-write isn't atomic (fine at low traffic, could
drop a vote under heavy concurrent load). If this ever needs to be
rigorous, swap the storage for a proper KV/DB with atomic increments.

## Electorate candidate lookup (`constituency.html`)

Sourced from Wikipedia's "Candidates in the 2026 New Zealand general
election by electorate" page. **43 electorates** have verified
candidate data in `data/electorates.json`; the rest (~28, including all
7 Māori electorates) are listed but marked unverified — the page links
straight to the official [vote.nz](https://vote.nz/enrol-and-check-my-enrolment/check-or-update-enrolment/)
lookup for those. Candidate lists can change until nominations close,
so treat this as a starting point, not the final word — same goes for
the verified ones.

To fill in the remaining electorates: re-run the same Wikipedia lookup
(the page is long enough that fetching it in 2–3 chunks works better
than one shot) and extend the `electorates` array in
`data/electorates.json` following the existing shape.

## The automated content bot (news + manifesto watch)

There is no free, reliable way to pull live tweets from X/Twitter
anymore, and scraping it violates its terms of service — so this bot
does **not** attempt that. The site's "Live: X/Twitter search" link is
still the right tool for real-time social content. What the bot *does*
automate, from `scripts/fetch-updates.mjs` (dependency-free Node,
`fetch` + `crypto` only):

1. **News** — pulls RSS from RNZ Politics and Beehive.govt.nz, filters
   to election-relevant keywords, dedupes, writes the top 15 to
   `data/news.json`.
2. **Manifesto watch** — fetches each of the 7 parties' official policy
   pages, hashes the stripped text, and compares to the previous run's
   hash (`data/manifesto-hashes.json`). Flags `"changed"` with a
   timestamp in `data/manifesto-watch.json` — it tracks *that*
   something changed, never *what*, so you always go read the source.

### Enabling the schedule on GitHub
1. Push this repo to GitHub (it isn't yet — see below).
2. `.github/workflows/update-content.yml` runs every 2 hours (cron
   `0 */2 * * *`) automatically once on the default branch.
3. If the bot's commits fail with a permissions error: **Settings →
   Actions → General → Workflow permissions → Read and write**.
4. Run it immediately instead of waiting: **Actions → Update election
   content → Run workflow**.
5. GitHub disables schedules after 60 days of repo inactivity — just
   re-enable from the Actions tab if that happens.

### Running it manually
```
node scripts/fetch-updates.mjs
```
Overwrites the three `data/*.json` bot files in place.

### Changing sources
Edit `NEWS_FEEDS`, `KEYWORDS`, and `MANIFESTO_SOURCES` in
`scripts/fetch-updates.mjs`. Party sites get restructured during
campaigns — a `"error"` status in Manifesto Watch usually means a URL
moved. (Watch for look-alike domains: NZ First's real site is
`nzfirst.nz`, not `nzfirst.org.nz`, which is an unrelated parked
domain.)

## Content notes

- Policy + "explain simply" content in `js/data.js` → `POLICIES` is
  hand-written and simplified for comparison — not official party
  positions, not auto-synced. The Manifesto Watch section links to
  each party's real policy page.
- "Also on the ballot" (`OTHER_PARTIES`) is cross-checked against the
  Electoral Commission's official Register of Political Parties and
  Logos (as at 5 August 2026) — 17 parties total, 7 compared in detail
  + 10 listed with a headline pitch.
- The News section shows the bot's live feed, falling back to the
  static `NEWS_ITEMS` snapshot in `js/data.js` if the fetch fails.
- Not affiliated with the New Zealand Electoral Commission.

## SEO

`index.html` and `constituency.html` both carry a descriptive
`<title>`/meta description, canonical URL, Open Graph + Twitter Card
tags (image at `assets/og-image.png`, regenerate with
`python scripts/make-og-image.py` if you change the branding), a
`WebSite` JSON-LD block, and a `<noscript>` fallback summary of the 7
parties for non-JS crawlers. `robots.txt` and `sitemap.xml` sit at the
project root. If you redeploy to a different domain, update the
canonical/OG URLs in both HTML files, `robots.txt`, and `sitemap.xml`.

## Photo & logo credits

**Hero photo** (`assets/hero-photo*.jpg`): Aoraki/Mt Cook sunrise from
Mueller Hut, by [Michal Klajban](https://commons.wikimedia.org/wiki/File:Mueller_Hut_with_Mt_Sefton_and_Aoraki_(Mt_Cook)_during_the_sunrise.jpg),
CC BY-SA 4.0 — cropped/resized, credited in the hero itself.

**Leader photos** (`assets/leaders/*.jpg`), all from Wikimedia Commons,
cropped to square:
- Luxon, Seymour: Doug Mountain / Governor-General's Office, CC0
- Hipkins: NZ Labour Party, CC BY-SA 4.0
- Davidson, Swarbrick: Green Party of Aotearoa NZ, CC BY-SA 4.0
- Peters: UK Foreign, Commonwealth & Development Office, CC BY 2.0
- Ngarewa-Packer, Waititi: Dhantegge & PANG, CC BY-SA 4.0
- Wong: The Opportunity Party, CC BY 4.0

**Party logos** (`assets/logos/*`): each party's own official logo,
pulled from their current website (or Wikimedia Commons for ACT/Green,
both effectively public domain as simple geometric marks), used here
for editorial identification only — no endorsement implied. National,
NZ First and Te Pāti Māori's logos are white-on-transparent in their
official form, so they're composited onto a rounded tile in that
party's brand colour for legibility on light backgrounds — if a party
changes its logo again, re-fetch the source and recomposite the same
way (trim to bounding box, centre on a rounded rect filled with that
party's `color` from `js/data.js`).

## Editing content

Hand-written content (parties, domains, policies, analogies, minor
parties) lives in `js/data.js`. Bot-generated content lives in
`data/*.json` and is overwritten on each bot run. No build step either
way — edit and reload.
