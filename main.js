/**
 * Carbon Scout — Embodied Carbon Dashboard for Autodesk Forma
 * Methodology: EN 15978 / RICS Whole Life Carbon Assessment (A1-A5)
 * EC factors aligned with EC3 (Carbon Leadership Forum) benchmarks
 */

// ── Try to connect to Forma SDK ─────────────────────────────────────────────
let Forma = null;
let formaConnected = false;

async function tryConnectForma() {
  try {
    const sdk = await import("https://esm.sh/forma-embedded-view-sdk@0.x/auto");
    Forma = sdk.Forma;
    formaConnected = true;
    console.log("[CarbonScout] Forma SDK connected ✓");
    await syncFromForma();
  } catch (e) {
    console.log("[CarbonScout] Running in standalone mode (no Forma context)");
  }
}

async function syncFromForma() {
  if (!Forma) return;
  try {
    // Pull geometry data from Forma scene
    const elements = await Forma.elements.getAll();
    let totalArea = 0;
    for (const el of elements) {
      if (el.properties?.area) totalArea += el.properties.area;
    }
    if (totalArea > 0) {
      document.getElementById("gfa").value = Math.round(totalArea);
      console.log(`[CarbonScout] GFA synced from Forma: ${totalArea.toFixed(0)} m²`);
    }
  } catch (e) {
    console.log("[CarbonScout] Could not sync from Forma:", e.message);
  }
}

// ── Embodied Carbon Factors (kg CO₂e / m² GFA) ──────────────────────────────
// Based on: LETI 2020, IStructE 2022, EC3 CLF benchmarks, RICS 2017
// Structural system base factors (A1-A3 structure + foundation)
const STRUCTURE_FACTORS = {
  concrete_cast:    { base: 290, label: "Concrete (CIP)",     color: "#f87171" },
  concrete_precast: { base: 260, label: "Concrete (Precast)", color: "#fb923c" },
  steel_composite:  { base: 245, label: "Steel Composite",    color: "#fbbf24" },
  steel_light:      { base: 210, label: "Steel Light",        color: "#facc15" },
  timber_clt:       { base: 115, label: "Mass Timber CLT",    color: "#4ade80" },
  timber_glulam:    { base: 100, label: "Mass Timber Glulam", color: "#34d399" },
  masonry:          { base: 230, label: "Masonry",            color: "#fb923c" },
};

// Envelope / MEP / fitout additions (A1-A5)
const USE_ADDITIONS = {
  office:       85,
  residential:  65,
  mixed:        75,
  retail:       60,
  education:    70,
  healthcare:  110,
};

// Floor count modifier (taller = more structure intensity)
function floorModifier(floors) {
  if (floors <= 3)  return 0.85;
  if (floors <= 6)  return 0.95;
  if (floors <= 12) return 1.00;
  if (floors <= 20) return 1.08;
  if (floors <= 40) return 1.18;
  return 1.30;
}

// LEED MRc1 Whole Building LCA thresholds (% reduction vs baseline)
const LEED_THRESHOLD_KG = 300;  // kg CO₂e/m² = ~10% reduction target approx
const EXCELLENT_THRESHOLD = 200;
const RED_THRESHOLD = 400;

// ── Carbon Calculation ───────────────────────────────────────────────────────
function calculate() {
  const gfa       = parseFloat(document.getElementById("gfa").value)     || 5000;
  const floors    = parseInt(document.getElementById("floors").value)     || 8;
  const structure = document.getElementById("structure").value;
  const use       = document.getElementById("use").value;

  const strFactor  = STRUCTURE_FACTORS[structure];
  const useFactor  = USE_ADDITIONS[use];
  const modifier   = floorModifier(floors);

  const intensity  = Math.round((strFactor.base * modifier) + useFactor);  // kg CO₂e/m²
  const totalCarbon = Math.round(intensity * gfa / 1000);                  // tonnes CO₂e

  return { intensity, totalCarbon, gfa, floors, structure, use, strFactor, useFactor, modifier };
}

// ── UI Update ────────────────────────────────────────────────────────────────
function updateUI(data) {
  const { intensity, totalCarbon, structure, use, gfa, floors } = data;

  // Determine color tier
  let tier, pct;
  if (intensity <= EXCELLENT_THRESHOLD) {
    tier = "green";
    pct  = (intensity / EXCELLENT_THRESHOLD) * 40;
  } else if (intensity <= LEED_THRESHOLD_KG) {
    tier = "green";
    pct  = 40 + ((intensity - EXCELLENT_THRESHOLD) / (LEED_THRESHOLD_KG - EXCELLENT_THRESHOLD)) * 20;
  } else if (intensity <= RED_THRESHOLD) {
    tier = "yellow";
    pct  = 60 + ((intensity - LEED_THRESHOLD_KG) / (RED_THRESHOLD - LEED_THRESHOLD_KG)) * 20;
  } else {
    tier = "red";
    pct  = Math.min(100, 80 + ((intensity - RED_THRESHOLD) / 200) * 20);
  }

  const badgeText = {
    green:  intensity <= EXCELLENT_THRESHOLD ? "EXCELLENT" : "LEED ELIGIBLE",
    yellow: "REVIEW NEEDED",
    red:    "HIGH CARBON"
  }[tier];

  // Main meter
  document.getElementById("main-value").textContent = intensity;
  document.getElementById("main-value").className = `meter-value ${tier}`;
  document.getElementById("main-badge").textContent = badgeText;
  document.getElementById("main-badge").className = `meter-badge badge-${tier}`;
  document.getElementById("bar").style.width = pct + "%";
  document.getElementById("bar").className = `bar-fill ${tier}`;

  // Scenarios
  renderScenarios(intensity, use, gfa);

  // LEED Credits
  renderCredits(intensity, gfa, floors, structure);

  // Narrative
  renderNarrative(data, intensity, totalCarbon, tier);
}

// ── Scenario Comparison ──────────────────────────────────────────────────────
function renderScenarios(currentIntensity, use, gfa) {
  const useFactor = USE_ADDITIONS[use];
  const floors = parseInt(document.getElementById("floors").value) || 8;
  const mod = floorModifier(floors);

  const scenarios = Object.entries(STRUCTURE_FACTORS).map(([key, val]) => ({
    key,
    label: val.label,
    color: val.color,
    intensity: Math.round(val.base * mod + useFactor),
  })).sort((a, b) => a.intensity - b.intensity);

  const currentKey = document.getElementById("structure").value;
  const minVal = scenarios[0].intensity;
  const maxVal = scenarios[scenarios.length - 1].intensity;

  const container = document.getElementById("scenarios-list");
  container.innerHTML = "";

  scenarios.forEach(s => {
    const delta = s.intensity - currentIntensity;
    const deltaStr = delta === 0 ? "current" :
      (delta > 0 ? `+${delta}` : `${delta}`) + " kg/m²";
    const deltaColor = delta < 0 ? "#4ade80" : delta === 0 ? "#6b7f6e" : "#f87171";

    const row = document.createElement("div");
    row.className = "scenario-row" + (s.key === currentKey ? " active" : "");
    row.innerHTML = `
      <div class="scenario-dot" style="background:${s.color}"></div>
      <div class="scenario-name">${s.label}</div>
      <div class="scenario-val" style="color:${s.color}">${s.intensity}</div>
      <div class="scenario-delta" style="color:${deltaColor}">${deltaStr}</div>
    `;
    row.onclick = () => {
      document.getElementById("structure").value = s.key;
      recalculate();
    };
    container.appendChild(row);
  });
}

// ── LEED / Sustainability Credits ────────────────────────────────────────────
function renderCredits(intensity, gfa, floors, structure) {
  const isCLT = structure.includes("timber");
  const credits = [
    {
      icon: "🏗",
      name: "MRc1 Whole Building LCA",
      ok: intensity <= LEED_THRESHOLD_KG,
      warn: intensity > LEED_THRESHOLD_KG && intensity <= RED_THRESHOLD,
    },
    {
      icon: "🪵",
      name: "MRc2 Low Carbon Materials",
      ok: isCLT,
      warn: structure.includes("steel"),
    },
    {
      icon: "📊",
      name: "EA Carbon Reporting",
      ok: gfa >= 1000,
      warn: false,
    },
    {
      icon: "🌍",
      name: "LETI Embodied Target",
      ok: intensity <= 250,
      warn: intensity > 250 && intensity <= 350,
    },
  ];

  const container = document.getElementById("credits-grid");
  container.innerHTML = "";

  credits.forEach(c => {
    const statusClass = c.ok ? "credit-ok" : c.warn ? "credit-warn" : "credit-no";
    const statusText  = c.ok ? "✓ ON TRACK" : c.warn ? "⚠ REVIEW"   : "✗ AT RISK";
    const chip = document.createElement("div");
    chip.className = "credit-chip";
    chip.innerHTML = `
      <div class="credit-icon">${c.icon}</div>
      <div>
        <div class="credit-name">${c.name}</div>
        <div class="credit-status ${statusClass}">${statusText}</div>
      </div>
    `;
    container.appendChild(chip);
  });
}

// ── AI Narrative ─────────────────────────────────────────────────────────────
function renderNarrative(data, intensity, totalCarbon, tier) {
  const { structure, use, floors, gfa } = data;
  const strLabel = STRUCTURE_FACTORS[structure].label;
  const saving   = STRUCTURE_FACTORS["concrete_cast"].base + USE_ADDITIONS[use];
  const vs       = saving - intensity;

  let msg = "";

  if (tier === "green" && intensity <= 200) {
    msg = `<strong>Outstanding performance.</strong> At ${intensity} kg CO₂e/m², this ${strLabel} ${use} building is in the top 10% globally — tracking for <strong>LEED Platinum</strong> on embodied carbon. Switching to ${strLabel} saves approximately <strong>${vs} kg CO₂e/m²</strong> vs a standard concrete baseline, equivalent to <strong>${Math.round(vs * gfa / 1000)} tonnes CO₂</strong> avoided on this project. Recommend A1–A5 LCA documentation via EC3 for LEED MRc1 submission.`;
  } else if (tier === "green") {
    msg = `<strong>LEED eligible.</strong> ${intensity} kg CO₂e/m² meets the LEED MRc1 whole building LCA benchmark of 300 kg/m². Total embodied carbon: <strong>${totalCarbon} tCO₂e</strong>. Consider specifying low-carbon EPD-verified concrete mixes or increasing recycled steel content to push below 200 kg/m² for a LETI-aligned target. Daylight and facade optimization can further reduce operational carbon to strengthen ESG reporting.`;
  } else if (tier === "yellow") {
    msg = `<strong>Review required.</strong> At ${intensity} kg CO₂e/m², this scheme exceeds the LEED MRc1 target of 300 kg/m² by <strong>${intensity - 300} kg/m²</strong>. Consider switching to a mass timber (CLT) or hybrid timber-steel system — this could reduce intensity to below 200 kg/m² and unlock LEED credits. Facade envelope contributes ~${USE_ADDITIONS[use]} kg/m² — specify high-recycled-content cladding systems to reduce embodied carbon.`;
  } else {
    msg = `<strong>High embodied carbon — design intervention needed.</strong> At ${intensity} kg CO₂e/m², total project carbon is <strong>${totalCarbon} tCO₂e</strong>, ${intensity - 300} kg/m² above LEED eligibility threshold. A structural substitution to CLT could reduce intensity by <strong>${intensity - (STRUCTURE_FACTORS["timber_clt"].base + USE_ADDITIONS[use])} kg/m²</strong>. This is a critical early-design decision — embodied carbon set here is locked in for the building's lifetime.`;
  }

  document.getElementById("narrative-text").innerHTML = msg;
}

// ── Export ───────────────────────────────────────────────────────────────────
window.exportReport = function () {
  const d = calculate();
  const lines = [
    "Carbon Scout — Embodied Carbon Report",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    `GFA: ${d.gfa} m²`,
    `Floors: ${d.floors}`,
    `Structure: ${d.strFactor.label}`,
    `Use: ${d.use}`,
    `Carbon Intensity: ${d.intensity} kg CO₂e/m² (A1-A5)`,
    `Total Embodied Carbon: ${d.totalCarbon} tCO₂e`,
    `LEED MRc1 Status: ${d.intensity <= 300 ? "ELIGIBLE" : "AT RISK"}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "carbon-scout-report.txt";
  a.click();
};

window.copyData = function () {
  const d = calculate();
  const csv = `GFA,Floors,Structure,Use,Intensity_kgCO2em2,Total_tCO2e\n${d.gfa},${d.floors},${d.strFactor.label},${d.use},${d.intensity},${d.totalCarbon}`;
  navigator.clipboard.writeText(csv).then(() => {
    const btn = document.querySelector(".btn-ghost");
    btn.textContent = "✓ Copied!";
    setTimeout(() => btn.textContent = "⎘ Copy CSV", 2000);
  });
};

// ── Recalculate on any input change ─────────────────────────────────────────
function recalculate() {
  const data = calculate();
  updateUI(data);
}

window.recalculate = recalculate;

["gfa", "floors", "structure", "use"].forEach(id => {
  document.getElementById(id).addEventListener("input", recalculate);
  document.getElementById(id).addEventListener("change", recalculate);
});

// ── Init ─────────────────────────────────────────────────────────────────────
(async () => {
  await tryConnectForma();
  recalculate();
})();
