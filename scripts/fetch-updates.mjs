#!/usr/bin/env node
/* Fetches NZ election news (RSS) and checks official party policy pages
 * for changes, writing the results to data/*.json for the site to read.
 *
 * No external dependencies — uses Node's built-in fetch + a small regex
 * based RSS parser, so it runs with nothing but `node` in CI.
 *
 * Usage: node scripts/fetch-updates.mjs
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const UA = "nz-election-2026-compare-bot/1.0 (+https://github.com/; educational, non-commercial)";

/* -------------------------------------------------------------------- */
/* Sources — edit these to add/remove feeds or party policy pages       */
/* -------------------------------------------------------------------- */

const NEWS_FEEDS = [
  { name: "RNZ Politics", url: "https://www.rnz.co.nz/rss/political.xml" },
  { name: "Beehive (Govt releases)", url: "https://www.beehive.govt.nz/rss.xml" },
];

// Only RSS items matching one of these (case-insensitive) are kept.
const KEYWORDS = [
  "election", "2026", "poll", "polling", "national party", "labour",
  "green party", "act party", "nz first", "new zealand first",
  "te pāti māori", "te pati maori", "opportunity party",
  "luxon", "hipkins", "seymour", "peters", "manifesto", "budget 2026",
  "coalition", "policy", "campaign",
];

// Official party pages to watch for changes. Verified reachable as of
// Oct 2026 — party sites get restructured during campaigns, so if one
// starts 404ing, find the new URL and update it here.
const MANIFESTO_SOURCES = [
  { id: "national", name: "National", url: "https://www.national.org.nz/plan" },
  { id: "labour", name: "Labour", url: "https://www.labour.org.nz/our-policies/" },
  { id: "green", name: "Green", url: "https://2026-nzgreens.nationbuilder.com/policy" },
  { id: "act", name: "ACT", url: "https://www.act.org.nz/policies" },
  { id: "nzfirst", name: "NZ First", url: "https://www.nzfirst.nz/news" },
  { id: "maori", name: "Te Pāti Māori", url: "https://www.maoriparty.org.nz/policy" },
  { id: "top", name: "The Opportunity Party", url: "https://www.opportunity.org.nz/policy" },
];

/* -------------------------------------------------------------------- */
/* Helpers                                                               */
/* -------------------------------------------------------------------- */

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function parseRss(xml, sourceName) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const title = decodeEntities((block.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1]);
    const link = decodeEntities((block.match(/<link>([\s\S]*?)<\/link>/i) || [, ""])[1]);
    const pubDateRaw = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [, ""])[1];
    const date = pubDateRaw ? new Date(pubDateRaw) : new Date();
    if (title && link) items.push({ title, link, date: date.toISOString(), source: sourceName });
  }
  return items;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/* -------------------------------------------------------------------- */
/* News                                                                  */
/* -------------------------------------------------------------------- */

async function fetchNews() {
  const all = [];
  for (const feed of NEWS_FEEDS) {
    try {
      const xml = await fetchText(feed.url);
      all.push(...parseRss(xml, feed.name));
    } catch (err) {
      console.error(`[news] failed to fetch ${feed.name}: ${err.message}`);
    }
  }

  const kwRegex = new RegExp(KEYWORDS.join("|"), "i");
  const seen = new Set();
  const filtered = all
    .filter((item) => kwRegex.test(item.title))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((item) => {
      if (seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    })
    .slice(0, 15);

  return filtered;
}

/* -------------------------------------------------------------------- */
/* Manifesto watch                                                       */
/* -------------------------------------------------------------------- */

async function fetchManifestoWatch() {
  const hashPath = path.join(DATA_DIR, "manifesto-hashes.json");
  let prevHashes = {};
  if (existsSync(hashPath)) {
    try {
      prevHashes = JSON.parse(readFileSync(hashPath, "utf8"));
    } catch {
      prevHashes = {};
    }
  }

  const nextHashes = {};
  const watch = [];
  const now = new Date().toISOString();

  for (const party of MANIFESTO_SOURCES) {
    const prev = prevHashes[party.id];
    try {
      const html = await fetchText(party.url);
      const text = stripHtml(html);
      const h = sha256(text);
      const firstRun = !prev;
      const changed = !firstRun && prev.hash !== h;
      const lastChanged = changed || firstRun ? now : prev.lastChanged || null;

      nextHashes[party.id] = { hash: h, lastChecked: now, lastChanged };
      watch.push({
        id: party.id,
        name: party.name,
        url: party.url,
        status: changed ? "changed" : firstRun ? "baseline" : "unchanged",
        lastChecked: now,
        lastChanged,
      });
    } catch (err) {
      console.error(`[manifesto] failed to fetch ${party.name}: ${err.message}`);
      nextHashes[party.id] = prev || { hash: null, lastChecked: now, lastChanged: null };
      watch.push({
        id: party.id,
        name: party.name,
        url: party.url,
        status: "error",
        lastChecked: now,
        lastChanged: prev?.lastChanged || null,
      });
    }
  }

  writeFileSync(hashPath, JSON.stringify(nextHashes, null, 2));
  return watch;
}

/* -------------------------------------------------------------------- */

async function main() {
  const [news, watch] = await Promise.all([fetchNews(), fetchManifestoWatch()]);

  writeFileSync(
    path.join(DATA_DIR, "news.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), items: news }, null, 2)
  );
  writeFileSync(
    path.join(DATA_DIR, "manifesto-watch.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), parties: watch }, null, 2)
  );

  console.log(`Wrote ${news.length} news items and ${watch.length} manifesto watch entries.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
