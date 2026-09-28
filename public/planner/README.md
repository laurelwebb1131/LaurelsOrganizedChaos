# Laurel's Organized Chaos Planner

A free, local-first gothic scrapbook life planner.

## Build status

Steps 1, 2, and 3 are complete.

### Personalization
- Planner Edit Mode and normal View Mode
- saved page personalization and layouts
- draggable stickers and scrapbook Polaroids
- page-specific accents and custom backgrounds
- Full Chaos / Quieter Chaos visual modes

### Planner rooms
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

### Final visual system
- layered black-paper scrapbook composition
- crooked tabs, torn paper, tarot cards, taped notes, hot-pink doodles
- crow, owl, moon, stars, and witchy line art
- richer Today and weekly spreads
- seasonal monthly calendar spreads
- academic desk, project lab, home board, panic drawer, idea oracle, and Polaroid-wall treatments
- responsive mobile/tablet layout
- reduced-motion support

### Final hardening
- readable `app.js` and `styles.css`
- installable PWA manifest and icon
- offline service worker
- JSON backup export/import validation and pre-import recovery copy
- localStorage persistence
- no backend, database, paid API, or subscription required
- repository validation workflow passes

## Storage

Planner data stays in browser localStorage. Photos are compressed before storage. Use **Settings → Export JSON** before clearing browser storage or switching devices.

## Deployment

A GitHub Pages workflow is installed. GitHub Pages must be enabled once in repository settings using:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

After Pages is enabled, run **Deploy Organized Chaos Planner to GitHub Pages** from the Actions tab. The expected public URL is:

`https://laurelwebb1131.github.io/LaurelsOrganizedChaos/`
