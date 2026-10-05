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

  /* ---------- News ---------- */
  const newsList = document.getElementById("newsList");
  function renderNews() {
    newsList.innerHTML = "";
    NEWS_ITEMS.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<time>${item.date}</time><p>${item.text}</p>`;
      newsList.appendChild(li);
    });
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
})();
