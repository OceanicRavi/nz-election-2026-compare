# NZ Election 2026 — Compare the Parties

A static, zero-build website comparing registered parties contesting the
2026 New Zealand general election across 14 policy domains — kept fresh
by a scheduled bot that pulls real news and watches official party
policy pages for changes.

Pure HTML/CSS/JS on the frontend — no framework, no build step. The
only "backend" is a GitHub Action that runs a Node script on a timer.

## Structure

```
index.html                         Page markup
css/styles.css                     All styling (light/dark aware, responsive)
js/data.js                         Party, domain, policy & fallback data
js/app.js                          Renders data into the DOM, fetches live data, handles toggles + form
data/news.json                     Bot-generated — latest filtered election news (RSS)
data/manifesto-watch.json          Bot-generated — per-party change-detection status
data/manifesto-hashes.json         Bot-internal — content hashes used to detect changes between runs
scripts/fetch-updates.mjs          The bot: fetches RSS + party pages, writes the data/*.json files
.github/workflows/update-content.yml   Cron job that runs the bot every 6h and commits changes
assets/favicon.svg                 Tab icon
netlify.toml / vercel.json         Deploy configs (+ security headers)
package.json                       Optional local preview script
```

## Run locally

No install needed. Any static file server works:

```
npm start
```

or just open `index.html` directly in a browser.

## Deploy

### Netlify (recommended — forms work out of the box)
1. Push this folder to a GitHub repo, or drag the folder into
   [app.netlify.com/drop](https://app.netlify.com/drop).
2. Netlify auto-detects `netlify.toml`; no build command needed.
3. The "Suggest an improvement" form already has `data-netlify="true"` —
   submissions will appear under **Site → Forms** automatically.
4. Netlify auto-deploys on every `git push` — including the bot's own
   commits — so the live site refreshes itself every 6 hours.

### Vercel
```
npm i -g vercel
vercel --prod
```
`vercel.json` is already configured for a static deploy, and Vercel
likewise auto-redeploys on push (including the bot's commits).

### GitHub Pages
1. Push this folder to a repo.
2. In **Settings → Pages**, set the source to the branch/root folder.
3. No build step required — it's served as-is, and updates when the
   bot pushes.

## The automated update bot

**What it actually does** (and doesn't): there is no free, reliable way
to pull live tweets from X/Twitter anymore, and scraping it violates its
terms of service — so this bot does **not** attempt that. The site's
"Live: X/Twitter search" link in the News section is still the right
tool for real-time social content. What the bot *does* automate:

1. **News** — pulls RSS from [RNZ Politics](https://www.rnz.co.nz/rss/political.xml)
   and [Beehive.govt.nz government releases](https://www.beehive.govt.nz/rss.xml),
   keeps only items matching election-relevant keywords (party names,
   "election", "poll", "budget", leader names, etc.), dedupes, and
   writes the top 15 to `data/news.json`.
2. **Manifesto watch** — fetches each of the 7 main parties' official
   policy pages, strips HTML, hashes the text, and compares it to the
   hash from the previous run (stored in `data/manifesto-hashes.json`).
   If the content changed, it's flagged as `"changed"` with a
   timestamp in `data/manifesto-watch.json`. It deliberately does
   **not** try to auto-summarise *what* changed — only *that* something
   did — so you know to go read the source yourself.

Both run from **`scripts/fetch-updates.mjs`**, a dependency-free Node
script (uses only `fetch` and `crypto`, built into Node 20+).

### Enabling the schedule on GitHub
1. Push this repo to GitHub.
2. The workflow at `.github/workflows/update-content.yml` runs
   automatically every 6 hours (cron `0 */6 * * *`) once it's on the
   default branch — nothing else to configure in most cases.
3. If commits from the bot fail with a permissions error, go to
   **Settings → Actions → General → Workflow permissions** and select
   "Read and write permissions" (the workflow already declares
   `permissions: contents: write`, which is normally sufficient on
   its own).
4. To run it immediately instead of waiting: **Actions → Update
   election content → Run workflow**.
5. To change how often it runs, edit the `cron` line in the workflow
   file. GitHub Actions schedules can drift by a few minutes and are
   disabled automatically if a repo goes 60 days with no activity —
   just re-enable it from the Actions tab if that happens.

### Running the bot manually / testing locally
```
node scripts/fetch-updates.mjs
```
This overwrites `data/news.json`, `data/manifesto-watch.json`, and
`data/manifesto-hashes.json` in place. Commit the result if you want
it to ship.

### Adding/changing sources
Edit the `NEWS_FEEDS`, `KEYWORDS`, and `MANIFESTO_SOURCES` constants at
the top of `scripts/fetch-updates.mjs`. Party websites get restructured
during campaigns — if a manifesto check starts showing `"error"` status
on the site, the party's policy URL has likely moved; find the new one
and update it there. (Watch out for look-alike domains — e.g. NZ
First's real site is `nzfirst.nz`, not `nzfirst.org.nz`, which is an
unrelated parked domain.)

## Content notes

- Policy summaries in the comparison matrix (`js/data.js` → `POLICIES`)
  are intentionally short, simplified, hand-written summaries for
  side-by-side comparison — they are **not** official party positions
  and are not kept in sync automatically. Always verify against each
  party's actual manifesto (the Manifesto Watch section links straight
  to each one) before voting.
- The News section shows the bot's live `data/news.json` feed when
  available, and falls back to the static snapshot in `js/data.js` →
  `NEWS_ITEMS` if the fetch fails (e.g. opened via `file://`, or before
  the bot's first run).
- The suggestion form falls back to a local success message when not
  deployed on Netlify. Swap in your own form backend (e.g. Formspree,
  a serverless function) by editing the fallback logic in `js/app.js`.
- Not affiliated with the New Zealand Electoral Commission.

## Editing content

Hand-written party/policy/domain content lives in `js/data.js` as plain
JS arrays and objects — no templating system to learn. Bot-generated
content lives in `data/*.json` and is overwritten on every run.
