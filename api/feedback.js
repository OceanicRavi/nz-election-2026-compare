/* Suggestion/feedback form backend — no email client, no third-party
 * form service, just the same Vercel Blob storage already used for the
 * poll. POST stores a submission; GET (admin-only, requires a secret
 * key env var) lets the site owner read them back.
 */

import { put, head } from "@vercel/blob";
import crypto from "node:crypto";

const FEEDBACK_PATHNAME = "feedback/submissions.json";
const MAX_FIELD_LEN = 4000;

async function readAll() {
  try {
    const info = await head(FEEDBACK_PATHNAME).catch(() => null);
    if (!info) return { submissions: [] };
    const res = await fetch(info.url, { cache: "no-store" });
    if (!res.ok) return { submissions: [] };
    return await res.json();
  } catch {
    return { submissions: [] };
  }
}

function clean(value) {
  return typeof value === "string" ? value.slice(0, MAX_FIELD_LEN).trim() : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    // Honeypot: a hidden field real users never fill in.
    if (clean(body.botcheck)) {
      return res.status(200).json({ success: true }); // pretend success, drop silently
    }

    const message = clean(body.message);
    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required." });
    }

    const entry = {
      id: crypto.randomUUID(),
      name: clean(body.name) || "Anonymous",
      email: clean(body.email),
      message,
      page: clean(body.page),
      ts: new Date().toISOString(),
    };

    const data = await readAll();
    data.submissions.push(entry);
    // Keep the blob from growing unbounded — last 500 is plenty for this site's traffic.
    if (data.submissions.length > 500) data.submissions = data.submissions.slice(-500);

    await put(FEEDBACK_PATHNAME, JSON.stringify(data, null, 2), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });

    return res.status(200).json({ success: true });
  }

  if (req.method === "GET") {
    const key = req.query && req.query.key;
    if (!process.env.FEEDBACK_READ_KEY || key !== process.env.FEEDBACK_READ_KEY) {
      return res.status(404).json({ error: "Not found" });
    }
    const data = await readAll();
    return res.status(200).json(data);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
