/* NZ Election 2026 — Compare the Parties
   Renders data.js content into the DOM, fetches live bot feeds,
   and wires up the poll + suggestion form. Plain DOM APIs, no build step. */

(function () {
  "use strict";
  window.__nzAppLoaded = true;

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

  /* ---------- Leaders strip (real photos) ---------- */
  const stripEl = document.getElementById("leadersStrip");
  const partyColor = Object.fromEntries(PARTIES.map((p) => [p.id, p.color]));
  if (stripEl) {
    LEADER_PROFILES.forEach((l) => {
      const c = document.createElement("div");
      c.className = "lchip";
      c.innerHTML = `
        <img class="av-photo" style="--pc:${partyColor[l.partyId]}" src="assets/leaders/${l.photo}.jpg" alt="${l.name}" loading="lazy" width="44" height="44">
        <div class="meta"><b>${l.name}</b><span>${l.role}</span></div>
      `;
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
        <div class="party-head-row"><img class="party-logo" src="${party.logo}" alt="${party.name} logo"></div>
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

  function pollCard(poll, isLatest) {
    const card = document.createElement("div");
    card.className = "poll-card2" + (isLatest ? " latest" : "");
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
      ${isLatest ? '<span class="poll-latest-badge">Latest</span>' : ""}
      <div class="poll-head"><span class="poll-firm">${poll.firm}</span><span class="poll-date">${poll.dates}</span></div>
      <div class="poll-bars">${rows}</div>
    `;
    return card;
  }

  function buildTrendChart(polls) {
    // polls is newest-first; flip to chronological order for the chart
    const chrono = [...polls].reverse();
    const W = 720, H = 280, padL = 34, padR = 16, padT = 16, padB = 34;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const maxPct = 35;
    const n = chrono.length;
    const xAt = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
    const yAt = (pct) => padT + plotH - (pct / maxPct) * plotH;

    const gridLines = [0, 10, 20, 30].map((v) => `
      <line x1="${padL}" y1="${yAt(v)}" x2="${W - padR}" y2="${yAt(v)}" stroke="currentColor" stroke-opacity=".12" stroke-width="1"/>
      <text x="${padL - 8}" y="${yAt(v) + 4}" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".55">${v}%</text>
    `).join("");

    const xLabels = chrono.map((p, i) => `<text x="${xAt(i)}" y="${H - 8}" text-anchor="middle" font-size="9.5" fill="currentColor" fill-opacity=".55">${(p.dates.match(/\d{1,2}\s\w{3}/g) || [p.dates]).pop()}</text>`).join("");

    const lines = PARTIES.map((party) => {
      const pts = chrono.map((p, i) => {
        const v = p.results[party.id];
        return v == null ? null : [xAt(i), yAt(v)];
      }).filter(Boolean);
      if (pts.length < 2) return "";
      const d = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(" ");
      const dots = pts.map((pt) => `<circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="3.2" fill="${party.color}"/>`).join("");
      return `<path d="${d}" fill="none" stroke="${party.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>${dots}`;
    }).join("");

    const legend = PARTIES.map((p) => `<span class="chart-legend-item"><span class="dot" style="background:${p.color}"></span>${p.short}</span>`).join("");

    return `
      <svg viewBox="0 0 ${W} ${H}" class="trend-svg" role="img" aria-label="Poll trend over time by party">
        ${gridLines}
        ${lines}
        ${xLabels}
      </svg>
      <div class="chart-legend">${legend}</div>
    `;
  }

  async function renderPolls() {
    if (!pollsGrid) return;
    pollsGrid.innerHTML = "";
    const chartEl = document.getElementById("pollsChart");
    try {
      const res = await fetch("data/polls.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.polls || !data.polls.length) throw new Error("empty");

      if (chartEl) chartEl.innerHTML = buildTrendChart(data.polls);

      data.polls.forEach((poll, i) => pollsGrid.appendChild(pollCard(poll, i === 0)));
      if (pollsMeta) pollsMeta.innerHTML = `Updated ${data.updatedAt} from <a href="${data.sourceUrl}" target="_blank" rel="noopener">${data.source}</a>. ${data.note}`;
    } catch {
      if (chartEl) chartEl.innerHTML = "";
      if (pollsMeta) pollsMeta.textContent = "Poll data unavailable right now.";
    }
  }

  /* ---------- Tweets / social moments decoded ---------- */
  const decodedGrid = document.getElementById("decodedGrid");
  const X_LOGO_SVG = `<svg class="x-logo" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

  function renderDecoded() {
    if (!decodedGrid) return;
    decodedGrid.innerHTML = "";
    TWEETS_DECODED.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card decoded-card";
      card.innerHTML = `
        <div class="x-post">
          <div class="x-post-head">
            ${X_LOGO_SVG}
            <div class="x-post-who">
              <div class="x-post-name">${item.who}</div>
              <div class="x-post-context">${item.context}</div>
            </div>
          </div>
          <p class="x-post-quote">“${item.quote}”</p>
        </div>
        <div class="decoded-body">
          <p class="decoded-explain"><b>What's actually going on:</b> ${item.explain}</p>
          <a class="decoded-link" href="${item.link}" target="_blank" rel="noopener noreferrer">Read more →</a>
        </div>
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

  /* ---------- Scroll-fade affordances for horizontally-scrollable areas ---------- */
  function wireScrollFade(scrollEl, fadeTargetEl, hintEl) {
    if (!scrollEl) return;
    const target = fadeTargetEl || scrollEl;
    function update() {
      const canRight = scrollEl.scrollWidth - scrollEl.clientWidth - scrollEl.scrollLeft > 4;
      const canLeft = scrollEl.scrollLeft > 4;
      target.classList.toggle("can-scroll-right", canRight);
      target.classList.toggle("can-scroll-left", canLeft);
      if (hintEl) hintEl.classList.toggle("show", canRight);
    }
    scrollEl.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // content (table columns, poll cards) can resize after this runs — recheck shortly after
    setTimeout(update, 50);
    setTimeout(update, 400);
    update();
    return update;
  }

  const matrixScrollEl = document.getElementById("matrixScroll");
  const matrixScrollHint = document.getElementById("matrixScrollHint");
  const updateMatrixFade = wireScrollFade(matrixScrollEl, matrixScrollEl, matrixScrollHint);

  renderToggles();
  renderMatrix();
  renderMinor();
  renderNews();
  renderManifestoWatch();
  renderPolls().then(() => {
    const pollsScrollEl = document.getElementById("pollsGrid");
    const pollsWrapEl = document.getElementById("pollsScrollWrap");
    const pollsScrollHint = document.getElementById("pollsScrollHint");
    wireScrollFade(pollsScrollEl, pollsWrapEl, pollsScrollHint);
  });
  renderDecoded();
  renderPoll();

  if (updateMatrixFade) {
    const origRenderMatrix = renderMatrix;
    renderMatrix = function () {
      origRenderMatrix();
      setTimeout(updateMatrixFade, 30);
    };
  }
})();
