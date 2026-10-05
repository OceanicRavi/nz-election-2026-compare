/* Electorate candidate lookup. Loads data/electorates.json and renders
   the selected electorate's candidates per party. */

(function () {
  "use strict";

  const select = document.getElementById("electorateSelect");
  const result = document.getElementById("candidateResult");
  const sourceEl = document.getElementById("lookupSource");

  const partyById = Object.fromEntries(PARTIES.map((p) => [p.id, p]));

  async function init() {
    let data;
    try {
      const res = await fetch("data/electorates.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch {
      result.innerHTML = `<p class="lookup-empty">Couldn't load electorate data right now. Try the official lookup below instead.</p>`;
      return;
    }

    data.electorates
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((e) => {
        const opt = document.createElement("option");
        opt.value = e.name;
        opt.textContent = e.name;
        select.appendChild(opt);
      });

    if (data.unverifiedElectorates && data.unverifiedElectorates.length) {
      const group = document.createElement("optgroup");
      group.label = "Not yet loaded — check vote.nz";
      data.unverifiedElectorates.forEach((name) => {
        const opt = document.createElement("option");
        opt.value = `__unverified__${name}`;
        opt.textContent = name;
        group.appendChild(opt);
      });
      select.appendChild(group);
    }

    sourceEl.innerHTML = `Source: <a href="${data.sourceUrl}" target="_blank" rel="noopener">${data.source}</a>. ${data.note}`;

    select.addEventListener("change", () => {
      const val = select.value;
      if (!val) {
        result.innerHTML = "";
        return;
      }
      if (val.startsWith("__unverified__")) {
        const name = val.replace("__unverified__", "");
        result.innerHTML = `
          <p class="lookup-empty">We don't have verified candidate data for <strong>${name}</strong> yet.</p>
          <a href="${data.officialLookupUrl}" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;background:#fff;color:#a3441f;font-weight:700;font-size:13px;padding:9px 16px;border-radius:20px;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.15);">Check official candidates →</a>
        `;
        return;
      }
      const electorate = data.electorates.find((e) => e.name === val);
      if (!electorate) return;

      const cards = PARTIES.map((p) => {
        const name = electorate.candidates[p.id];
        return `
          <div class="candidate-card" style="--pc:${p.color}">
            <div class="party">${p.name}</div>
            <div class="name ${name ? "" : "none"}">${name || "No candidate listed"}</div>
          </div>
        `;
      }).join("");

      result.innerHTML = `<div class="candidate-grid">${cards}</div>`;
    });
  }

  init();
})();
