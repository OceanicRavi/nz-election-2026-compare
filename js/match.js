/* Find Your Match — pick a profile, then a concern, one step revealed
   at a time, then see every party's position side by side. */

(function () {
  "use strict";

  // app.js (on index.html) already wires up the mobile nav toggle — only
  // bind it here when this script is the one running the page (e.g. the
  // standalone find-your-match page, which doesn't load app.js).
  if (!window.__nzAppLoaded) {
    const navToggle = document.getElementById("navToggle");
    const mobileNav = document.getElementById("mobileNav");
    if (navToggle && mobileNav) {
      navToggle.addEventListener("click", () => {
        const open = mobileNav.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", String(open));
      });
    }
  }

  const profileStep = document.getElementById("profileStep");
  const profileOptions = document.getElementById("profileOptions");
  const concernStep = document.getElementById("concernStep");
  const concernOptions = document.getElementById("concernOptions");
  const matchResult = document.getElementById("matchResult");

  let selectedProfile = null;
  let selectedConcern = null;

  function scrollTo(el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderProfiles() {
    profileOptions.innerHTML = "";
    PROFILES.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "match-option";
      btn.innerHTML = `<span class="icon">${p.icon}</span>${p.label}`;
      btn.addEventListener("click", () => {
        selectedProfile = p;
        profileStep.style.display = "none";
        concernStep.style.display = "block";
        renderConcerns();
        scrollTo(concernStep);
      });
      profileOptions.appendChild(btn);
    });
  }

  function renderConcerns() {
    concernOptions.innerHTML = "";
    const suggested = new Set(selectedProfile ? selectedProfile.suggested : []);
    const ordered = [...DOMAINS].sort((a, b) => (suggested.has(b.id) ? 1 : 0) - (suggested.has(a.id) ? 1 : 0));

    ordered.forEach((d) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "match-option";
      btn.innerHTML = `${suggested.has(d.id) ? '<span class="icon">★</span>' : ""}${d.name}`;
      btn.title = suggested.has(d.id) ? "Often relevant to your profile" : "";
      btn.addEventListener("click", () => {
        selectedConcern = d;
        concernStep.style.display = "none";
        renderResult();
        scrollTo(matchResult);
      });
      concernOptions.appendChild(btn);
    });
  }

  function redo() {
    selectedProfile = null;
    selectedConcern = null;
    matchResult.innerHTML = "";
    concernStep.style.display = "none";
    profileStep.style.display = "block";
    [...profileOptions.children].forEach((c) => c.classList.remove("selected"));
    scrollTo(profileStep);
  }

  function renderResult() {
    if (!selectedConcern) {
      matchResult.innerHTML = "";
      return;
    }
    const domain = selectedConcern;
    const cards = PARTIES.map((party) => {
      const entry = (POLICIES[party.id] && POLICIES[party.id][domain.id]) || { p: "No published position yet.", a: "Not yet available for this party." };
      return `
        <div class="card" style="padding:1.1rem 1.3rem;border-top:4px solid ${party.color};">
          <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.5rem;">
            <img src="${party.logo}" alt="${party.name} logo" style="max-height:26px;max-width:120px;width:auto;object-fit:contain;">
          </div>
          <div style="font-size:.74rem;color:var(--ink-soft);margin-bottom:.5rem;">${party.leader}</div>
          <p style="font-size:.92rem;margin-bottom:.6rem;">${entry.p}</p>
          <div class="analogy-box show" style="margin-top:0;">${entry.a}</div>
        </div>
      `;
    }).join("");

    matchResult.innerHTML = `
      <div class="match-breadcrumb">
        <span>${selectedProfile.icon} ${selectedProfile.label}</span>
        <span class="sep">→</span>
        <span>${domain.name}</span>
      </div>
      <div class="section-head" style="margin-top:.8rem;">
        <h2>What each party proposes</h2>
        <p>${domain.desc} Every party's position on this, explained like you're 15.</p>
      </div>
      <div class="minor-grid">${cards}</div>
      <div class="match-result-actions">
        <button type="button" class="btn btn-dark" id="matchRedoBtn">↺ Start over</button>
        <a class="btn btn-ghost-light" href="/#matrix-anchor">See the full comparison →</a>
      </div>
    `;
    document.getElementById("matchRedoBtn").addEventListener("click", redo);
  }

  renderProfiles();
})();
