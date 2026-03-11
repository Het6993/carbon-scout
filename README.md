# 🌿 Carbon Scout — Embodied Carbon Dashboard for Autodesk Forma

> **Real-time A1–A5 embodied carbon analysis, LEED compliance tracking, and scenario comparison — built as a custom Forma Extension.**

![Carbon Scout Preview](preview.png)

Built with the [Forma Embedded View SDK](https://app.autodeskforma.com/forma-embedded-view-sdk/docs/index.html) · Methodology: EN 15978 / RICS WLCA / EC3 CLF benchmarks

---

## 🎯 The Problem

Early massing decisions lock in **70–80% of a building's embodied carbon**, yet architects have no real-time feedback on how structural choices affect carbon performance. By the time an LCA consultant runs analysis, design decisions are irreversible.

## ✅ The Solution

Carbon Scout is a **custom Autodesk Forma Extension** that provides:
- **Live carbon intensity meter** (kg CO₂e/m², A1–A5 lifecycle stages)
- **Side-by-side structural system comparison** (concrete vs steel vs CLT)
- **LEED MRc1 + LETI compliance tracking**
- **AI-generated sustainability narrative**
- **One-click CSV/report export**

All updated in real-time as you adjust your massing in Forma.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- Autodesk Forma account (AEC Collection or standalone)

### Step 1 — Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/forma-carbon-extension.git
cd forma-carbon-extension
npm install
```

### Step 2 — Run locally
```bash
npm run dev
```
This starts a dev server at `http://localhost:5173`

### Step 3 — Load in Forma
1. Open [Autodesk Forma](https://app.autodeskforma.com)
2. Open any project
3. Click **Extensions** in the left panel → **Add Extension**
4. Select **"Load from URL"**
5. Enter: `http://localhost:5173`
6. The Carbon Scout panel appears in the right sidebar ✓

### Step 4 — Use it
- Adjust GFA, floors, structural system, and building use
- Watch the carbon meter update in real time
- Click structural systems in the scenario list to compare
- Export a report for LEED documentation

---

## ☁️ Deploy to GitHub Pages (Share with anyone)

### Step 1 — Build
```bash
npm run build
```

### Step 2 — Deploy
```bash
# Install gh-pages if you haven't
npm install -g gh-pages

# Deploy dist folder to GitHub Pages
gh-pages -d dist
```

### Step 3 — Register in Forma
1. Your extension is now live at: `https://YOUR_USERNAME.github.io/forma-carbon-extension/`
2. Go to Forma → Extensions → Add Extension → Enter your GitHub Pages URL
3. Share the Extension ID from the Unpublished tab with teammates

---

## 🧮 Carbon Methodology

All carbon intensity factors are based on:
- **EN 15978** — Sustainability of construction works
- **RICS Whole Life Carbon Assessment** (2nd edition, 2023)
- **Carbon Leadership Forum (CLF)** — EC3 database benchmarks
- **LETI Climate Emergency Design Guide** (2020)
- **IStructE How to Calculate Embodied Carbon** (2022)

### Lifecycle Stages Covered
| Stage | Description | Included |
|-------|-------------|---------|
| A1-A3 | Product (material manufacturing) | ✓ |
| A4    | Transport to site | ✓ (approx.) |
| A5    | Construction process | ✓ (approx.) |
| B1-B7 | In use (operational) | ✗ (future) |
| C1-C4 | End of life | ✗ (future) |

### LEED MRc1 Threshold
The 300 kg CO₂e/m² target represents approximately a 10% reduction vs baseline per LEED v4.1 MRc1 Whole Building LCA requirements.

---

## 📁 Project Structure
```
forma-carbon-extension/
├── src/
│   ├── index.html      ← Extension UI (runs inside Forma iframe)
│   └── main.js         ← Carbon logic + Forma SDK integration
├── carbon-scout-demo.html  ← Standalone demo (no build needed)
├── vite.config.js
├── package.json
└── README.md
```

---

## 🗺️ Roadmap
- [ ] Live sync of GFA/geometry directly from Forma elements API
- [ ] Operational carbon overlay (ASHRAE 90.1 baseline comparison)
- [ ] EPD material library integration (EC3 API)
- [ ] Daylight + carbon trade-off analysis (facade WWR optimizer)
- [ ] PDF report export with LEED documentation format
- [ ] Multi-scenario save & compare

---

## 📄 License
MIT — fork it, extend it, make it your own.

---

*Built with [Forma Embedded View SDK](https://aps.autodesk.com/en/docs/forma/v1/) + vibecoding with Claude*
