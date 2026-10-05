# NZ Election 2026 — Compare the Parties

A static, zero-build website comparing registered parties contesting the
2026 New Zealand general election across 14 policy domains.

Pure HTML/CSS/JS — no framework, no build step, no server required.

## Structure

```
index.html          Page markup
css/styles.css       All styling (light/dark aware, responsive)
js/data.js           Party, domain, policy, news and "also on the ballot" data
js/app.js            Renders data into the DOM, handles toggles + form
assets/favicon.svg   Tab icon
netlify.toml         Netlify deploy config (+ security headers)
vercel.json          Vercel deploy config (+ security headers)
package.json         Optional local preview script
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

### Vercel
```
npm i -g vercel
vercel --prod
```
`vercel.json` is already configured for a static deploy.

### GitHub Pages
1. Push this folder to a repo.
2. In **Settings → Pages**, set the source to the branch/root folder.
3. No build step required — it's served as-is.

## Content notes

- Policy summaries are intentionally short, simplified, and written for
  side-by-side comparison — they are **not** official party positions.
  Always verify against each party's published manifesto before voting.
- The "Developing movements" news section is a static snapshot (as of
  late September 2026) — it does not pull a live feed. Update
  `js/data.js` → `NEWS_ITEMS` to refresh it, or wire in a real news API.
- The suggestion form falls back to a local success message when not
  deployed on Netlify. Swap in your own form backend (e.g. Formspree,
  a serverless function) by editing the fallback logic in `js/app.js`.
- Not affiliated with the New Zealand Electoral Commission.

## Editing content

All party/policy/news content lives in `js/data.js` as plain JS arrays
and objects — no templating system to learn. Edit the arrays and reload.
