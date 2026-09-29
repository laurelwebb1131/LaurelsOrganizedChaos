# Laurel's Organized Chaos Planner

Laurel's Organized Chaos is a local-first life planner served from `public/planner/`. It runs entirely in the browser, stores planner data in localStorage, and can be installed as a PWA.

## Current status

The five-stage cleanup, debugging, and stabilization pass was completed in September 2026.

The planner currently opens on the antique 1800s grimoire cover at `#cover`. **Open the Book** enters the Dashboard.

The cover is the current grimoire design baseline. Interior planner pages still retain the existing scrapbook/witchy compatibility treatments. The future antique Table of Contents, page-marker navigation, and full interior grimoire redesign have **not** been built yet.

## Planner areas

- Dashboard
- Today
- This Week
- Calendar
- School
- Projects
- Home & Family
- Brain Dump
- Goals & Ideas
- Life Scrapbook
- Settings

The planner also includes tasks, timers, routine anchors, school assignments, projects, groceries/home notes, brain dumps, ideas, memories, page personalization, draggable decorations, rearrangeable layouts, JSON backup/import, responsive behavior, reduced-motion support, and install/offline PWA support.

## Data and recovery

The primary browser storage key is `loc_planner_v1`.

Existing version-1 planner data is hydrated and normalized without intentionally resetting the user's stored planner. Unsupported or unreadable stored data is preserved into a recovery value when browser storage permits it, and automatic writes are blocked rather than overwriting the original data.

Use **Settings → Export JSON** before clearing browser storage, changing browsers/devices, or making major changes. Imports validate the planner schema and keep a pre-import recovery copy when browser storage allows it.

Images are compressed before being stored and are bounded by upload, pixel-count, and canvas-dimension limits to reduce localStorage and memory failures.

## PWA and offline behavior

- `manifest.webmanifest` starts at `./#cover` and stays scoped to the planner.
- The installed display mode is `standalone`.
- `sw.js` precaches the planner shell.
- Fetches are network-first with a bounded timeout and cached fallback.
- Offline navigation can fall back to cached `index.html`.
- Cache cleanup is restricted to the planner's own `loc-planner-*` namespace.

## Validation

Planner-specific validation:

```bash
npm run planner:check
```

Repository validation also runs:

```bash
npm ci
npm run typecheck
npm run server:check
npm test
npm run assets:verify
npm run planner:check
npm run build
```

The planner check validates source syntax and structure, routes, DOM hooks, CSS integrity, manifest/PWA invariants, storage/recovery safeguards, keyboard/accessibility hooks, responsive rules, and mocked service-worker runtime behavior.

## Deployment

GitHub Pages deploys `public/planner/` through `.github/workflows/planner-pages.yml`.

The deployment workflow validates the planner before it uploads the Pages artifact.

Public URL:

`https://laurelwebb1131.github.io/LaurelsOrganizedChaos/`

## Repository boundary

This repository also contains the separate Hearthwise React/Three.js/Tauri application under the root `src/`, `server/`, `src-tauri/`, and `public/assets/` areas. The planner and Hearthwise should remain separate systems unless a dependency is deliberately introduced.
