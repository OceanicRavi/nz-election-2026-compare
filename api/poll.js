/* Anonymous "who are you leaning toward" poll.
 * GET  -> current aggregate counts, { national: 12, labour: 9, ... }
 * POST -> { party: "national" } casts (or changes) this browser's vote.
 *
 * Storage: a single JSON file in Vercel Blob (public, read-only URL;
 * writes go through this function only). No personal data is stored —
 * just a per-browser random id (in a cookie) so one browser can't stuff
 * the ballot box by resubmitting, and so it can change its own vote.
 *
 * This is a casual engagement poll, not a scientific survey or the real
 * election — the UI says so, and so does this comment.
 */

import { put, head } from "@vercel/blob";
import crypto from "node:crypto";

const VOTES_PATHNAME = "poll/votes.json";
const VALID_PARTIES = ["national", "labour", "green", "act", "nzfirst", "maori", "top", "undecided"];
const COOKIE_NAME = "nzc_voter";

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

async function readVotes() {
  try {
    const info = await head(VOTES_PATHNAME).catch(() => null);
    if (!info) return { voters: {}, totals: {} };
    const res = await fetch(info.url, { cache: "no-store" });
    if (!res.ok) return { voters: {}, totals: {} };
    return await res.json();
  } catch {
    return { voters: {}, totals: {} };
  }
}

function tally(voters) {
  const totals = {};
  for (const party of Object.values(voters)) {
    totals[party] = (totals[party] || 0) + 1;
  }
  return totals;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const { voters } = await readVotes();
    const cookies = parseCookies(req.headers.cookie);
    const voterId = cookies[COOKIE_NAME];
    return res.status(200).json({
      totals: tally(voters),
      totalVotes: Object.keys(voters).length,
      yourVote: voterId ? voters[voterId] || null : null,
    });
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const party = body && body.party;
    if (!VALID_PARTIES.includes(party)) {
      return res.status(400).json({ error: "Invalid party." });
    }

    const cookies = parseCookies(req.headers.cookie);
    let voterId = cookies[COOKIE_NAME];
    if (!voterId) {
      voterId = crypto.randomUUID();
      res.setHeader("Set-Cookie", `${COOKIE_NAME}=${voterId}; Path=/; Max-Age=31536000; SameSite=Lax`);
    }

    const { voters } = await readVotes();
    voters[voterId] = party;
    const totals = tally(voters);

    await put(VOTES_PATHNAME, JSON.stringify({ voters, updatedAt: new Date().toISOString() }), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });

    return res.status(200).json({ totals, totalVotes: Object.keys(voters).length, yourVote: party });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
