/* NZ Election 2026 — Compare the Parties
   Renders data.js content into the DOM, fetches live bot feeds,
   and wires up the poll + suggestion form. Plain DOM APIs, no build step. */

(function () {
  "use strict";

  const state = { visible: new Set(PARTIES.map((p) => p.id)) };

  function formatDate(iso) {
    try { return new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  }

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
      c.innerHTML = `<div class="av" style="background:${p.color}">${p.initials}</div><div class="meta"><b>${p.leader}</b><span>${p.role} &middot; ${p.name}</span></div>`;
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

  /* ---------- Comparison matrix (real table) ---------- */
  const headEl = document.getElementById("matrixHead");
  const bodyEl = document.getElementById("matrixBody");

  function renderMatrix() {
    if (!headEl || !bodyEl) return;
    const activeParties = PARTIES.filter((p) => state.visible.has(p.id));

    headEl.innerHTML = "";
    const headRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.className = "corner";
    corner.scope = "col";
    corner.textContent = "Policy domain";
    headRow.appendChild(corner);

    activeParties.forEach((party) => {
      const th = document.createElement("th");
      th.className = "party-head";
      th.scope = "col";
      th.innerHTML = `
        <div class="party-head-row"><span class="dot" style="background:${party.color}"></span><span class="party-head-name">${party.name}</span></div>
        <div class="party-head-leader">${party.leader}</div>
      `;
      headRow.appendChild(th);
    });
    headEl.appendChild(headRow);

    bodyEl.innerHTML = "";
    DOMAINS.forEach((domain) => {
      const row = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.innerHTML = `${domain.name}<span class="domain-desc">${domain.desc}</span>`;
      row.appendChild(th);

      activeParties.forEach((party) => {
        const entry = (POLICIES[party.id] && POLICIES[party.id][domain.id]) || { p: "No published position yet.", a: "Not yet available for this party." };
        const td = document.createElement("td");
        td.innerHTML = `
          <div class="policy-text">${entry.p}</div>
          <button class="explain-toggle" type="button">Explain simply →</button>
          <div class="analogy-box">${entry.a}</div>
        `;
        const btn = td.querySelector(".explain-toggle");
        const box = td.querySelector(".analogy-box");
        btn.addEventListener("click", () => {
          const show = box.classList.toggle("show");
          btn.textContent = show ? "Hide ↑" : "Explain simply →";
        });
        row.appendChild(td);
      });
      bodyEl.appendChild(row);
    });
  }

  /* ---------- Minor parties ---------- */
  const minorEl = document.getElementById("minorGrid");
  function renderMinor() {
    if (!minorEl) return;
    minorEl.innerHTML = "";
    OTHER_PARTIES.forEach((m) => {
      const c = document.createElement("div");
      c.className = "card minor-card";
      c.innerHTML = `<b>${m.name}</b>${m.pitch}`;
      minorEl.appendChild(c);
    });
  }

  /* ---------- News (live bot feed with static fallback) ---------- */
  const newsList = document.getElementById("newsList");
  const newsMeta = document.getElementById("newsMeta");

  function renderNewsItems(items, { date, text, link, source }) {
    if (!newsList) return;
    newsList.innerHTML = "";
    items.forEach((raw) => {
      const li = document.createElement("li");
      const label = date(raw), body = text(raw), href = link(raw), src = source(raw);
      li.innerHTML = `<time>${label}</time>${src ? `<span class="news-source">${src}</span> &middot; ` : ""}${href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${body}</a>` : body}`;
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
      if (newsMeta) newsMeta.textContent = `Live feed — last checked ${formatDate(data.generatedAt)} (auto-refreshes every 2 hours).`;
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
    card.className = `card manifesto-card status-${status}`;
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
      if (manifestoMeta) manifestoMeta.textContent = `Bot last checked all party pages ${formatDate(data.generatedAt)} (auto-refreshes every 2 hours).`;
    } catch {
      PARTIES.forEach((p) => manifestoGrid.appendChild(manifestoCard(p.name, p.policyUrl || "#", "error", null, null)));
      if (manifestoMeta) manifestoMeta.textContent = "Live change-detection hasn't run yet — see README to enable the GitHub Action.";
    }
  }

  /* ---------- Real published polls ---------- */
  const pollsGrid = document.getElementById("pollsGrid");
  const pollsMeta = document.getElementById("pollsMeta");
  const partyById = Object.fromEntries(PARTIES.map((p) => [p.id, p]));

  function pollCard(poll) {
    const card = document.createElement("div");
    card.className = "poll-card2";
    const rows = Object.entries(poll.results)
      .sort((a, b) => b[1] - a[1])
      .map(([id, pct]) => {
        const party = partyById[id];
        if (!party) return "";
        return `
          <div class="poll-bar-row">
            <span class="label">${party.short}</span>
            <span class="poll-track"><span class="poll-fill" style="width:${Math.min(pct * 2.4, 100)}%;--pc:${party.color}"></span></span>
            <span class="poll-pct">${pct}%</span>
          </div>
        `;
      })
      .join("");
    card.innerHTML = `
      <div class="poll-head"><span class="poll-firm">${poll.firm}</span><span class="poll-date">${poll.dates}</span></div>
      <div class="poll-bars">${rows}</div>
    `;
    return card;
  }

  async function renderPolls() {
    if (!pollsGrid) return;
    pollsGrid.innerHTML = "";
    try {
      const res = await fetch("data/polls.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.polls || !data.polls.length) throw new Error("empty");
      data.polls.forEach((poll) => pollsGrid.appendChild(pollCard(poll)));
      if (pollsMeta) pollsMeta.innerHTML = `Updated ${data.updatedAt} from <a href="${data.sourceUrl}" target="_blank" rel="noopener">${data.source}</a>. ${data.note}`;
    } catch {
      if (pollsMeta) pollsMeta.textContent = "Poll data unavailable right now.";
    }
  }

  /* ---------- Tweets / social moments decoded ---------- */
  const decodedGrid = document.getElementById("decodedGrid");
  function renderDecoded() {
    if (!decodedGrid) return;
    decodedGrid.innerHTML = "";
    TWEETS_DECODED.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card decoded-card";
      card.innerHTML = `
        <div class="decoded-who">${item.who}</div>
        <p class="decoded-quote">"${item.quote}"</p>
        <p class="decoded-explain"><b>What's actually going on:</b> ${item.explain}</p>
        <a class="decoded-link" href="${item.link}" target="_blank" rel="noopener noreferrer">Read more →</a>
      `;
      decodedGrid.appendChild(card);
    });
  }

  /* ---------- Leaning poll (anonymous, our own) ---------- */
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
      if (document.getElementById("botcheck").value) return;

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
  renderPolls();
  renderDecoded();
  renderPoll();
})();
