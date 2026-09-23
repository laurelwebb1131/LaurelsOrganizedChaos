# Hearthwise

Hearthwise is becoming a 3D Life Operating System: a personal planet where locations represent life realms, habits and goals become visible progress, and familiar characters help turn real context into thoughtful next steps.

## Run locally

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

The current prototype includes a navigable 3D planet and four selectable locations:

- **The Library** for personal goals, ideas, saved prompts, and Juniper chat.
- **Hearth House** for family responsibilities and daily habits.
- **The University** for education goals and focused study sessions.
- **The Love Doctor** for consent-aware relationship practices and connection goals.

World state is versioned and persisted locally. Goals, habits, chores, saved ideas, companions, room/realm hashes, and companion context are available to the local AI seam. The provider remains optional and falls back to deterministic local replies until a server-side API key is configured.

## AI provider

Copy `.env.example` to the server environment and set the three `OPENAI_COMPATIBLE_*` values. Never expose the API key through a `VITE_*` variable. The development Vite middleware implements the documented `/api/companion` contract in `docs/companion-api.md`.

## Stack

React, TypeScript, Vite, Three.js, React Three Fiber, and Drei. Styling remains plain CSS so the visual system stays easy to extend.
