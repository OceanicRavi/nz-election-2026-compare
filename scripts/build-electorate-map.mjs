#!/usr/bin/env node
/* Builds assets/nz-electorates.svg from the simplified general-electorate
 * GeoJSON (sourced from Stats NZ's official "General Electorates 2025"
 * dataset — see README for provenance). Projects lon/lat to SVG space
 * with a simple equirectangular + latitude-cosine-correction projection,
 * which is accurate enough at New Zealand's scale and needs no mapping
 * library. Outlying islands (Chathams etc.) are allowed to project
 * outside the fixed mainland viewBox and are simply not drawn.
 *
 * Usage: node scripts/build-electorate-map.mjs <input.geojson> <output.svg>
 *
 * To fetch + simplify a fresh input file:
 *   curl "https://services2.arcgis.com/vKb0s8tBIA3bdocZ/arcgis/rest/services/General_Electorates_2025/FeatureServer/0/query?where=1%3D1&outFields=GED2025_V1_00_NAME&returnGeometry=true&f=geojson&geometryPrecision=4" -o raw.geojson
 *   npx mapshaper -i raw.geojson -simplify 0.7% visvalingam keep-shapes -clean -filter-fields GED2025_V1_00_NAME -rename-fields name=GED2025_V1_00_NAME -o simplified.geojson format=geojson precision=0.0001
 *   node scripts/build-electorate-map.mjs simplified.geojson assets/nz-electorates.svg
 *
 * The equivalent Māori electorate layer (not currently mapped — see
 * README) is at .../services/M%C4%81ori_Electorates_2025/FeatureServer.
 */

import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("Usage: node build-electorate-map.mjs <input.geojson> <output.svg>");
  process.exit(1);
}

const geojson = JSON.parse(readFileSync(inPath, "utf8"));

// Fixed mainland NZ bounding box (excludes Chatham Islands / Kermadecs)
const LON_MIN = 166.3, LON_MAX = 178.65;
const LAT_MIN = -47.35, LAT_MAX = -34.0;
const LAT_MID = (LAT_MIN + LAT_MAX) / 2;
const COS_LAT = Math.cos((LAT_MID * Math.PI) / 180);

const WIDTH = 760;
const lonSpan = (LON_MAX - LON_MIN) * COS_LAT;
const latSpan = LAT_MAX - LAT_MIN;
const HEIGHT = Math.round(WIDTH * (latSpan / lonSpan));

function project([lon, lat]) {
  const x = ((lon - LON_MIN) * COS_LAT / lonSpan) * WIDTH;
  const y = ((LAT_MAX - lat) / latSpan) * HEIGHT; // flip so north is up
  return [Number(x.toFixed(2)), Number(y.toFixed(2))];
}

function ringToPath(ring) {
  return ring
    .map(project)
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ") + " Z";
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // strip macrons for the id
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const paths = [];
for (const feature of geojson.features) {
  const name = feature.properties.name;
  const geom = feature.geometry;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;

  const dParts = [];
  for (const poly of polys) {
    for (const ring of poly) {
      dParts.push(ringToPath(ring));
    }
  }
  const d = dParts.join(" ");
  paths.push(`<path d="${d}" data-name="${name}" id="e-${slugify(name)}" class="electorate" />`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Map of New Zealand general electorates">
<g>
${paths.join("\n")}
</g>
</svg>
`;

writeFileSync(outPath, svg);
console.log(`Wrote ${outPath} (${paths.length} electorates, ${WIDTH}x${HEIGHT} viewBox)`);
