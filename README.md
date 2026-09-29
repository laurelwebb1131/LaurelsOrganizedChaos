# Hearthwise

Hearthwise is becoming a 3D Life Operating System: a personal planet where locations represent life realms, habits and goals become visible progress, and familiar characters help turn real context into thoughtful next steps.

## Repository layout

This repository currently contains two separate application areas:

- **Hearthwise** is the root React/TypeScript/Three.js application. Its main code lives in `src/`, `server/`, `src-tauri/`, `docs/`, and `public/assets/`.
- **Laurel's Organized Chaos Planner** is the separate local-first browser planner in `public/planner/`. GitHub Pages deploys only that directory through `.github/workflows/planner-pages.yml`.

These applications share the repository but should not be merged or have files deleted across their boundary unless an explicit dependency is introduced.

Planner documentation: `public/planner/README.md`

Planner site: `https://laurelwebb1131.github.io/LaurelsOrganizedChaos/`

## Run Hearthwise locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal. The production build can be checked with:

```bash
npm run build
```

## Desktop app

The project also includes a Tauri 2 desktop shell for Windows, macOS, and Linux. Install Rust through `rustup`, then run:

```bash
npm run tauri:dev
```

To produce an installable desktop bundle:

```bash
npm run tauri:build
```

The desktop shell bundles the frontend and local licensed assets. The optional companion API remains a server-side integration; do not put provider keys in the desktop bundle. Configure a hosted `/api/companion` endpoint before enabling production AI.

## Prototype scope

The current Hearthwise prototype includes a navigable 3D planet and four selectable locations:

- **The Library** for personal goals, ideas, saved prompts, and Juniper chat.
- **Hearth House** for family responsibilities and daily habits.
- **The University** for education goals and focused study sessions.
- **The Love Doctor** for consent-aware relationship practices and connection goals.

World state is versioned and persisted locally. Goals, habits, chores, saved ideas, companions, room/realm hashes, and companion context are available to the local AI seam. The provider remains optional and falls back to deterministic local replies until a server-side API key is configured.

## AI provider

Copy `.env.example` to the server environment and set the documented `OPENAI_COMPATIBLE_*` values. Never expose the API key through a `VITE_*` variable. Real `.env` files are ignored by Git and must not be committed.

The development Vite middleware implements the documented `/api/companion` contract in `docs/companion-api.md`.

## Validation

The repository validation workflow runs the main checks below:

```bash
npm ci
npm run typecheck
npm run server:check
npm test
npm run assets:verify
npm run planner:check
npm run build
```

The planner deployment workflow performs its planner-specific validation again before publishing `public/planner/` to GitHub Pages.

## Stack

React, TypeScript, Vite, Three.js, React Three Fiber, and Drei. Styling remains plain CSS so the visual system stays easy to extend.
