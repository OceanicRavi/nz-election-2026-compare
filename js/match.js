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

  function shareUrlFor(profile, domain) {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("profile", profile.id);
    url.searchParams.set("concern", domain.id);
    return url.toString();
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
        <button type="button" class="btn btn-ghost-light" id="matchShareBtn">Share this ↗</button>
      </div>
      <p class="share-note" id="matchShareNote" style="display:none;"></p>
    `;
    document.getElementById("matchRedoBtn").addEventListener("click", redo);

    const shareBtn = document.getElementById("matchShareBtn");
    const shareNote = document.getElementById("matchShareNote");
    shareBtn.addEventListener("click", async () => {
      const url = shareUrlFor(selectedProfile, domain);
      const text = `Here's what all 7 NZ parties say about ${domain.name.toLowerCase()} — compare for yourself, no spin:`;
      if (navigator.share) {
        try {
          await navigator.share({ title: "NZ Compare 2026", text, url });
          return;
        } catch {
          /* user cancelled the native share sheet — fall through to copy */
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        shareNote.textContent = "Link copied — paste it anywhere.";
      } catch {
        shareNote.textContent = url;
      }
      shareNote.style.display = "block";
    });
  }

  function applyDeepLink() {
    const params = new URLSearchParams(location.search);
    const profileId = params.get("profile");
    const concernId = params.get("concern");
    if (!profileId || !concernId) return false;
    const profile = PROFILES.find((p) => p.id === profileId);
    const domain = DOMAINS.find((d) => d.id === concernId);
    if (!profile || !domain) return false;
    selectedProfile = profile;
    selectedConcern = domain;
    profileStep.style.display = "none";
    concernStep.style.display = "none";
    renderResult();
    return true;
  }

  renderProfiles();
  if (!applyDeepLink()) {
    /* no shared link in the URL — normal first-step view */
  }
})();
