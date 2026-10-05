/* Electorate candidate lookup. Loads data/electorates.json and an
   interactive SVG map, keeping the dropdown and map selection in sync. */

(function () {
  "use strict";

  const select = document.getElementById("electorateSelect");
  const result = document.getElementById("candidateResult");
  const sourceEl = document.getElementById("lookupSource");
  const mapWrap = document.getElementById("nzMapWrap");
  const mapHoverLabel = document.getElementById("mapHoverLabel");

  const partyById = Object.fromEntries(PARTIES.map((p) => [p.id, p]));
  let electoratesData = null;
  let currentSelectedName = null;

  function candidateCard(partyId, name) {
    const party = partyById[partyId];
    const logo = party ? `<img class="candidate-logo" src="${party.logo}" alt="${party.name}">` : "";
    const pc = party ? party.color : "#999";
    const partyName = party ? party.name : partyId;
    return `
      <div class="candidate-card" style="--pc:${pc}">
        ${logo}
        <div class="candidate-info">
          <div class="name ${name ? "" : "none"}">${name || "No candidate listed"}</div>
          <div class="party-label">${partyName}</div>
        </div>
      </div>
    `;
  }

  function renderUnverified(name) {
    result.innerHTML = `
      <p class="lookup-empty">We don't have verified candidate data for <strong>${name}</strong> yet.</p>
      <a class="btn btn-dark" href="${electoratesData.officialLookupUrl}" target="_blank" rel="noopener" style="margin-top:10px;">Check official candidates →</a>
    `;
  }

  function renderCandidates(electorate) {
    const order = ["national", "labour", "green", "act", "nzfirst", "maori", "top"];
    const cards = order.map((id) => candidateCard(id, electorate.candidates[id])).join("");
    result.innerHTML = `<div class="candidate-grid">${cards}</div>`;
  }

  function highlightMap(name) {
    if (!mapWrap) return;
    mapWrap.querySelectorAll(".electorate.selected").forEach((el) => el.classList.remove("selected"));
    if (!name) return;
    const path = mapWrap.querySelector(`.electorate[data-name="${CSS.escape(name)}"]`);
    if (path) path.classList.add("selected");
  }

  function selectElectorate(name, { fromMap } = {}) {
    if (!electoratesData) return;
    currentSelectedName = name;
    if (!fromMap) highlightMap(name);
    if (!name) {
      result.innerHTML = "";
      return;
    }

    const isUnverified = electoratesData.unverifiedElectorates.includes(name);
    if (isUnverified) {
      renderUnverified(name);
      return;
    }
    const electorate = electoratesData.electorates.find((e) => e.name === name);
    if (electorate) renderCandidates(electorate);
  }

  function syncDropdown(name) {
    if (select.value !== name) select.value = name || "";
  }

  async function loadMap() {
    try {
      const res = await fetch("assets/nz-electorates.svg", { cache: "force-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svgText = await res.text();
      mapWrap.innerHTML = svgText;

      mapWrap.querySelectorAll(".electorate").forEach((path) => {
        const name = path.getAttribute("data-name");
        path.addEventListener("mouseenter", () => {
          if (mapHoverLabel) mapHoverLabel.textContent = name;
        });
        path.addEventListener("mouseleave", () => {
          if (mapHoverLabel) mapHoverLabel.textContent = currentSelectedName || "Hover or tap a region";
        });
        path.addEventListener("click", () => {
          syncDropdown(name);
          selectElectorate(name, { fromMap: true });
          highlightMap(name);
          if (mapHoverLabel) mapHoverLabel.textContent = name;
        });
      });
    } catch {
      mapWrap.innerHTML = `<p class="map-loading">Map unavailable right now — use the dropdown instead.</p>`;
    }
  }

  async function init() {
    try {
      const res = await fetch("data/electorates.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      electoratesData = await res.json();
    } catch {
      result.innerHTML = `<p class="lookup-empty">Couldn't load electorate data right now. Try the official lookup below instead.</p>`;
      return;
    }

    const allNames = [
      ...electoratesData.electorates.map((e) => e.name),
      ...electoratesData.unverifiedElectorates,
    ].sort((a, b) => a.localeCompare(b));

    allNames.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });

    if (electoratesData.maoriElectorates && electoratesData.maoriElectorates.length) {
      const group = document.createElement("optgroup");
      group.label = "Māori electorates";
      electoratesData.maoriElectorates
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((e) => {
          const opt = document.createElement("option");
          opt.value = `__maori__${e.name}`;
          opt.textContent = e.name;
          group.appendChild(opt);
        });
      select.appendChild(group);
    }

    sourceEl.innerHTML = `Source: <a href="${electoratesData.sourceUrl}" target="_blank" rel="noopener">${electoratesData.source}</a>. ${electoratesData.note}`;

    select.addEventListener("change", () => {
      const val = select.value;
      if (!val) {
        currentSelectedName = null;
        highlightMap(null);
        result.innerHTML = "";
        return;
      }
      if (val.startsWith("__maori__")) {
        const name = val.replace("__maori__", "");
        currentSelectedName = name;
        highlightMap(null); // not on the general-electorate map
        const electorate = electoratesData.maoriElectorates.find((e) => e.name === name);
        if (electorate) renderCandidates(electorate);
        return;
      }
      selectElectorate(val);
    });

    loadMap();
  }

  init();
})();
