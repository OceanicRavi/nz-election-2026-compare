/* NZ Election 2026 — Compare the Parties
   Renders the data from data.js into the DOM and wires up interactions.
   No build step required — plain DOM APIs only. */

(function () {
  "use strict";

  const state = {
    visible: new Set(PARTIES.map((p) => p.id)),
  };

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    mobileNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- Party toggle pills ---------- */
  const togglesEl = document.getElementById("partyToggles");
  function renderToggles() {
    togglesEl.innerHTML = "";
    PARTIES.forEach((party) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "party-toggle";
      btn.style.setProperty("--pc", party.color);
      btn.setAttribute("aria-pressed", String(state.visible.has(party.id)));
      btn.innerHTML = `<span class="dot" aria-hidden="true"></span>${party.short}`;
      btn.title = `${party.name} — toggle in comparison`;
      btn.addEventListener("click", () => {
        if (state.visible.has(party.id)) {
          if (state.visible.size === 1) return; // keep at least one party visible
          state.visible.delete(party.id);
        } else {
          state.visible.add(party.id);
        }
        renderToggles();
        renderMatrix();
      });
      togglesEl.appendChild(btn);
    });
  }

  /* ---------- Comparison matrix ---------- */
  const headEl = document.getElementById("matrixHead");
  const bodyEl = document.getElementById("matrixBody");

  function renderMatrix() {
    const activeParties = PARTIES.filter((p) => state.visible.has(p.id));

    // Header row
    headEl.innerHTML = "";
    const headRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.className = "domain-col";
    corner.textContent = "Policy domain";
    headRow.appendChild(corner);

    activeParties.forEach((party) => {
      const th = document.createElement("th");
      th.className = "party-col-head";
      th.style.setProperty("--pc", party.color);
      th.scope = "col";
      th.innerHTML = `
        <div class="party-head-name"><span class="dot" aria-hidden="true"></span>${party.name}</div>
        <div class="party-head-leader">${party.leader} &middot; ${party.role}</div>
      `;
      headRow.appendChild(th);
    });
    headEl.appendChild(headRow);

    // Body rows
    bodyEl.innerHTML = "";
    DOMAINS.forEach((domain) => {
      const row = document.createElement("tr");
      const th = document.createElement("th");
      th.className = "domain-col";
      th.scope = "row";
      th.textContent = domain.name;
      row.appendChild(th);

      activeParties.forEach((party) => {
        const td = document.createElement("td");
        td.className = "policy-cell";
        const text = (POLICIES[party.id] && POLICIES[party.id][domain.id]) || "No published position yet.";
        td.textContent = text;
        row.appendChild(td);
      });
      bodyEl.appendChild(row);
    });
  }

  /* ---------- Also on the ballot ---------- */
  const alsoGrid = document.getElementById("alsoGrid");
  function renderAlso() {
    alsoGrid.innerHTML = "";
    OTHER_PARTIES.forEach((p) => {
      const card = document.createElement("article");
      card.className = "also-card";
      card.innerHTML = `<h4>${p.name}</h4><p>${p.pitch}</p>`;
      alsoGrid.appendChild(card);
    });
  }

  /* ---------- News ----------
     Tries the bot-generated data/news.json (refreshed every 6h by the
     GitHub Action in .github/workflows/update-content.yml). Falls back
     to the static NEWS_ITEMS snapshot from data.js if that fetch fails
     (e.g. opened via file://, or before the bot's first run). */
  const newsList = document.getElementById("newsList");
  const newsMeta = document.getElementById("newsMeta");

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  }

  function renderNewsItems(items, { date, text, link, source }) {
    newsList.innerHTML = "";
    items.forEach((raw) => {
      const li = document.createElement("li");
      const label = date(raw);
      const body = text(raw);
      const href = link(raw);
      const src = source(raw);
      li.innerHTML = `
        <time>${label}</time>
        <p>${src ? `<span class="news-source">${src}</span> &middot; ` : ""}${href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${body}</a>` : body}</p>
      `;
      newsList.appendChild(li);
    });
  }

  async function renderNews() {
    try {
      const res = await fetch("data/news.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.items || !data.items.length) throw new Error("empty");

      renderNewsItems(data.items, {
        date: (i) => formatDate(i.date),
        text: (i) => i.title,
        link: (i) => i.link,
        source: (i) => i.source,
      });
      if (newsMeta) {
        newsMeta.textContent = `Live feed — last checked ${formatDate(data.generatedAt)} (auto-refreshes every 6 hours).`;
      }
    } catch (err) {
      // Fallback to the static snapshot shipped in data.js
      renderNewsItems(NEWS_ITEMS, {
        date: (i) => i.date,
        text: (i) => i.text,
        link: () => "",
        source: () => "",
      });
      if (newsMeta) {
        newsMeta.textContent = "Showing a static snapshot — live feed unavailable right now.";
      }
    }
  }

  /* ---------- Manifesto watch ----------
     Shows the bot's change-detection results for each party's official
     policy page (data/manifesto-watch.json). Falls back to a simple
     "not checked yet" list built from PARTIES if the file isn't there. */
  const manifestoGrid = document.getElementById("manifestoGrid");
  const manifestoMeta = document.getElementById("manifestoMeta");

  const STATUS_LABEL = {
    changed: "Updated recently",
    unchanged: "No change detected",
    baseline: "Baseline captured",
    error: "Could not check",
  };

  function manifestoCard(name, url, status, lastChecked, lastChanged) {
    const card = document.createElement("article");
    card.className = `manifesto-card status-${status}`;
    card.innerHTML = `
      <h4>${name}</h4>
      <p class="manifesto-status">${STATUS_LABEL[status] || "Unknown"}</p>
      <p class="manifesto-meta">
        ${lastChecked ? `Checked ${formatDate(lastChecked)}` : "Not checked yet"}
        ${lastChanged ? ` &middot; last change ${formatDate(lastChanged)}` : ""}
      </p>
      <a href="${url}" target="_blank" rel="noopener noreferrer">View official policy page →</a>
    `;
    return card;
  }

  async function renderManifestoWatch() {
    if (!manifestoGrid) return;
    manifestoGrid.innerHTML = "";
    try {
      const res = await fetch("data/manifesto-watch.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.parties || !data.parties.length) throw new Error("empty");

      data.parties.forEach((p) => {
        manifestoGrid.appendChild(manifestoCard(p.name, p.url, p.status, p.lastChecked, p.lastChanged));
      });
      if (manifestoMeta) {
        manifestoMeta.textContent = `Bot last checked all party pages ${formatDate(data.generatedAt)} (auto-refreshes every 6 hours).`;
      }
    } catch (err) {
      PARTIES.forEach((p) => {
        manifestoGrid.appendChild(manifestoCard(p.name, p.policyUrl || "#", "error", null, null));
      });
      if (manifestoMeta) {
        manifestoMeta.textContent = "Live change-detection hasn't run yet in this deployment — see README to enable the GitHub Action.";
      }
    }
  }

  /* ---------- Suggestion form ---------- */
  const form = document.getElementById("suggestForm");
  const status = document.getElementById("formStatus");
  if (form) {
    form.addEventListener("submit", (e) => {
      // If deployed on Netlify (or similar form backend), let the native
      // POST happen. Otherwise fall back to a friendly local message.
      const isNetlify = window.location.hostname.endsWith("netlify.app") ||
        document.querySelector('meta[name="generator"][content*="Netlify"]');

      if (!isNetlify) {
        e.preventDefault();
        const name = form.name.value || "there";
        status.textContent = `Thanks, ${name}! This demo form has no backend wired up yet — deploy to Netlify (forms work out of the box) or connect your own endpoint to receive submissions.`;
        status.classList.add("success");
        form.reset();
      }
      // On Netlify, the form submits normally to Netlify Forms.
    });
  }

  renderToggles();
  renderMatrix();
  renderAlso();
  renderNews();
  renderManifestoWatch();
})();
