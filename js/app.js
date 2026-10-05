/* NZ Election 2026 — Compare the Parties
   Renders data.js content into the DOM, fetches the live bot feeds,
   and wires up the poll + suggestion form. Plain DOM APIs, no build step. */

(function () {
  "use strict";

  const state = { visible: new Set(PARTIES.map((p) => p.id)) };

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    mobileNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => mobileNav.classList.remove("open"))
    );
  }

  /* ---------- Leaders strip ---------- */
  const stripEl = document.getElementById("leadersStrip");
  if (stripEl) {
    PARTIES.forEach((p) => {
      const c = document.createElement("div");
      c.className = "lchip";
      c.innerHTML = `<div class="av" style="background:${p.color}">${p.initials}</div><span>${p.leader}</span>`;
      stripEl.appendChild(c);
    });
  }

  /* ---------- Party toggle pills ---------- */
  const togglesEl = document.getElementById("partyToggles");
  function renderToggles() {
    if (!togglesEl) return;
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
          if (state.visible.size === 1) return;
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
  const matrixEl = document.getElementById("matrix");
  function renderMatrix() {
    if (!matrixEl) return;
    const activeParties = PARTIES.filter((p) => state.visible.has(p.id));
    matrixEl.innerHTML = "";
    matrixEl.style.gridTemplateColumns = `150px repeat(${activeParties.length}, minmax(195px, 1fr))`;
    matrixEl.style.minWidth = `${150 + activeParties.length * 205}px`;

    const corner = document.createElement("div");
    corner.className = "hcell corner";
    corner.innerHTML = "<span>Domain</span>";
    matrixEl.appendChild(corner);

    activeParties.forEach((p) => {
      const h = document.createElement("div");
      h.className = "hcell";
      h.innerHTML = `<div class="avatar" style="background:${p.color}">${p.initials}</div><h3>${p.name}</h3><div class="leader">${p.leader}</div>`;
      matrixEl.appendChild(h);
    });

    const rowTints = ["#f6e7d8", "#e4efe0", "#e8eef5", "#f5e6ea", "#eee6f3", "#f9efe0", "#e2eeee", "#f2e6e0", "#eaeff0", "#f0e9e2", "#e6f0e9", "#f3ece0", "#e0e9f2", "#efe4ea"];

    DOMAINS.forEach((dom, i) => {
      const tint = rowTints[i % rowTints.length];
      const label = document.createElement("div");
      label.className = "rowlabel";
      label.style.background = tint;
      label.innerHTML = `<div>${dom.name}<span class="d">${dom.desc}</span></div>`;
      matrixEl.appendChild(label);

      activeParties.forEach((party) => {
        const entry = (POLICIES[party.id] && POLICIES[party.id][dom.id]) || { p: "No published position yet.", a: "Not yet available for this party." };
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.style.borderLeft = `4px solid ${tint}`;
        cell.innerHTML = `
          <div class="policy">${entry.p}</div>
          <button class="explain-btn" type="button">Explain simply →</button>
          <div class="analogy">${entry.a}</div>
        `;
        const btn = cell.querySelector(".explain-btn");
        const an = cell.querySelector(".analogy");
        btn.addEventListener("click", () => {
          const show = an.classList.toggle("show");
          btn.textContent = show ? "Hide ↑" : "Explain simply →";
        });
        matrixEl.appendChild(cell);
      });
    });
  }

  /* ---------- Minor parties ---------- */
  const minorEl = document.getElementById("minorGrid");
  function renderMinor() {
    if (!minorEl) return;
    minorEl.innerHTML = "";
    OTHER_PARTIES.forEach((m) => {
      const c = document.createElement("div");
      c.className = "minor-card";
      c.innerHTML = `<b>${m.name}</b>${m.pitch}`;
      minorEl.appendChild(c);
    });
  }

  /* ---------- News (live bot feed with static fallback) ---------- */
  const newsList = document.getElementById("newsList");
  const newsMeta = document.getElementById("newsMeta");

  function formatDate(iso) {
    try { return new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  }

  function renderNewsItems(items, { date, text, link, source }) {
    if (!newsList) return;
    newsList.innerHTML = "";
    items.forEach((raw) => {
      const li = document.createElement("li");
      const label = date(raw), body = text(raw), href = link(raw), src = source(raw);
      li.innerHTML = `<span class="date">${label}</span>${src ? `<span class="news-source">${src}</span> &middot; ` : ""}${href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${body}</a>` : body}`;
      newsList.appendChild(li);
    });
  }

  async function renderNews() {
    if (!newsList) return;
    try {
      const res = await fetch("data/news.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.items || !data.items.length) throw new Error("empty");
      renderNewsItems(data.items, { date: (i) => formatDate(i.date), text: (i) => i.title, link: (i) => i.link, source: (i) => i.source });
      if (newsMeta) newsMeta.textContent = `Live feed — last checked ${formatDate(data.generatedAt)} (auto-refreshes every 6 hours).`;
    } catch {
      renderNewsItems(NEWS_ITEMS, { date: (i) => i.date, text: (i) => i.text, link: () => "", source: () => "" });
      if (newsMeta) newsMeta.textContent = "Showing a static snapshot — live feed unavailable right now.";
    }
  }

  /* ---------- Manifesto watch ---------- */
  const manifestoGrid = document.getElementById("manifestoGrid");
  const manifestoMeta = document.getElementById("manifestoMeta");
  const STATUS_LABEL = { changed: "Updated recently", unchanged: "No change detected", baseline: "Baseline captured", error: "Could not check" };

  function manifestoCard(name, url, status, lastChecked, lastChanged) {
    const card = document.createElement("article");
    card.className = `manifesto-card status-${status}`;
    card.innerHTML = `
      <h4>${name}</h4>
      <p class="manifesto-status">${STATUS_LABEL[status] || "Unknown"}</p>
      <p class="manifesto-meta">${lastChecked ? `Checked ${formatDate(lastChecked)}` : "Not checked yet"}${lastChanged ? ` &middot; changed ${formatDate(lastChanged)}` : ""}</p>
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
      data.parties.forEach((p) => manifestoGrid.appendChild(manifestoCard(p.name, p.url, p.status, p.lastChecked, p.lastChanged)));
      if (manifestoMeta) manifestoMeta.textContent = `Bot last checked all party pages ${formatDate(data.generatedAt)} (auto-refreshes every 6 hours).`;
    } catch {
      PARTIES.forEach((p) => manifestoGrid.appendChild(manifestoCard(p.name, p.policyUrl || "#", "error", null, null)));
      if (manifestoMeta) manifestoMeta.textContent = "Live change-detection hasn't run yet — see README to enable the GitHub Action.";
    }
  }

  /* ---------- Poll ---------- */
  const pollOptions = document.getElementById("pollOptions");
  const pollResults = document.getElementById("pollResults");
  const pollMeta = document.getElementById("pollMeta");
  const POLL_CHOICES = [...PARTIES.map((p) => ({ id: p.id, label: p.short, color: p.color, full: p.name })), { id: "undecided", label: "Undecided", color: "#8a8a8a", full: "Undecided" }];

  function renderPollResults(totals, totalVotes, yourVote) {
    if (!pollResults) return;
    pollResults.innerHTML = "";
    POLL_CHOICES.forEach((c) => {
      const count = totals[c.id] || 0;
      const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
      const row = document.createElement("div");
      row.className = "poll-row";
      row.innerHTML = `
        <span class="label">${c.full}${yourVote === c.id ? " (you)" : ""}</span>
        <span class="poll-bar-track"><span class="poll-bar-fill" style="width:${pct}%;--pc:${c.color}"></span></span>
        <span class="poll-pct">${pct}%</span>
      `;
      pollResults.appendChild(row);
    });
    if (pollMeta) pollMeta.textContent = `${totalVotes} vote${totalVotes === 1 ? "" : "s"} so far.`;
  }

  async function castVote(partyId) {
    try {
      const res = await fetch("/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ party: partyId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderPollResults(data.totals, data.totalVotes, data.yourVote);
      updatePollButtons(data.yourVote);
    } catch {
      if (pollMeta) pollMeta.textContent = "Couldn't reach the poll right now — try again shortly.";
    }
  }

  function updatePollButtons(yourVote) {
    if (!pollOptions) return;
    pollOptions.querySelectorAll(".poll-btn").forEach((btn) => {
      btn.classList.toggle("voted", btn.dataset.party === yourVote);
    });
  }

  async function renderPoll() {
    if (!pollOptions) return;
    pollOptions.innerHTML = "";
    POLL_CHOICES.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "poll-btn";
      btn.dataset.party = c.id;
      btn.style.setProperty("--pc", c.color);
      btn.textContent = c.label;
      btn.addEventListener("click", () => castVote(c.id));
      pollOptions.appendChild(btn);
    });

    try {
      const res = await fetch("/api/poll", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderPollResults(data.totals, data.totalVotes, data.yourVote);
      updatePollButtons(data.yourVote);
    } catch {
      if (pollMeta) pollMeta.textContent = "Poll is unavailable in this deployment (needs the /api function + Blob storage — see README).";
    }
  }

  /* ---------- Suggestion form ---------- */
  const form = document.getElementById("inquiryForm");
  const formMsg = document.getElementById("formMsg");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (document.getElementById("botcheck").value) return; // honeypot

      const name = document.getElementById("fname").value.trim();
      const email = document.getElementById("femail").value.trim();
      const message = document.getElementById("fmsg").value.trim();

      if (SITE_CONFIG.web3formsKey) {
        formMsg.textContent = "Sending…";
        formMsg.classList.remove("success");
        try {
          const res = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              access_key: SITE_CONFIG.web3formsKey,
              subject: "NZ Compare 2026 — suggestion",
              from_name: "NZ Compare 2026",
              name, email, message,
            }),
          });
          const result = await res.json();
          if (result.success) {
            formMsg.textContent = "Thanks — your suggestion has been sent.";
            formMsg.classList.add("success");
            form.reset();
          } else {
            throw new Error(result.message || "unknown error");
          }
        } catch {
          formMsg.textContent = "Couldn't send automatically. Please try again shortly.";
        }
      } else if (SITE_CONFIG.fallbackEmail) {
        const body = encodeURIComponent(`${message}\n\n— ${name} (${email || "no email given"})`);
        window.location.href = `mailto:${SITE_CONFIG.fallbackEmail}?subject=${encodeURIComponent("NZ Compare 2026 suggestion")}&body=${body}`;
        formMsg.textContent = "Opening your email client…";
      } else {
        formMsg.textContent = "This form isn't wired up to a backend yet — see README (SITE_CONFIG.web3formsKey in js/data.js).";
      }
    });
  }

  renderToggles();
  renderMatrix();
  renderMinor();
  renderNews();
  renderManifestoWatch();
  renderPoll();
})();
