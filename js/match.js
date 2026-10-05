/* Find Your Match — pick a profile, pick a concern, see every party's
   position on that one domain, side by side, explained simply. */

(function () {
  "use strict";

  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  const profileOptions = document.getElementById("profileOptions");
  const concernStep = document.getElementById("concernStep");
  const concernOptions = document.getElementById("concernOptions");
  const matchResult = document.getElementById("matchResult");

  let selectedProfile = null;
  let selectedConcern = null;

  function renderProfiles() {
    profileOptions.innerHTML = "";
    PROFILES.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "match-option";
      btn.innerHTML = `<span class="icon">${p.icon}</span>${p.label}`;
      btn.addEventListener("click", () => {
        selectedProfile = p;
        [...profileOptions.children].forEach((c) => c.classList.remove("selected"));
        btn.classList.add("selected");
        concernStep.style.display = "block";
        renderConcerns();
        concernStep.scrollIntoView({ behavior: "smooth", block: "start" });
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
      if (selectedConcern && selectedConcern.id === d.id) btn.classList.add("selected");
      btn.innerHTML = `${suggested.has(d.id) ? '<span class="icon">★</span>' : ""}${d.name}`;
      btn.title = suggested.has(d.id) ? "Often relevant to your profile" : "";
      btn.addEventListener("click", () => {
        selectedConcern = d;
        [...concernOptions.children].forEach((c) => c.classList.remove("selected"));
        btn.classList.add("selected");
        renderResult();
        matchResult.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      concernOptions.appendChild(btn);
    });
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
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;">
            <div style="width:30px;height:30px;border-radius:50%;background:${party.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.68rem;flex-shrink:0;">${party.initials}</div>
            <div>
              <div style="font-weight:700;font-size:.95rem;">${party.name}</div>
              <div style="font-size:.74rem;color:var(--ink-soft);">${party.leader}</div>
            </div>
          </div>
          <p style="font-size:.92rem;margin-bottom:.6rem;">${entry.p}</p>
          <div class="analogy-box show" style="margin-top:0;">${entry.a}</div>
        </div>
      `;
    }).join("");

    matchResult.innerHTML = `
      <div class="section-head" style="margin-top:2rem;">
        <p class="kicker">${selectedProfile ? selectedProfile.label : "Your"} &middot; ${domain.name}</p>
        <h2>What each party proposes</h2>
        <p>${domain.desc} Every party's position on this, explained like you're 15.</p>
      </div>
      <div class="minor-grid">${cards}</div>
      <p class="feed-meta" style="margin-top:1rem;"><a href="/#matrix-anchor" style="color:var(--jade);font-weight:700;text-decoration:none;">See the full 14-domain comparison →</a></p>
    `;
  }

  renderProfiles();
})();
