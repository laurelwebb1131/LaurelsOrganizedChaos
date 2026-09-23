# Hearthwise release checklist

## Completed in this prototype

- [x] Four navigable life realms
- [x] Persistent versioned local world state
- [x] Goals, habits, chores, ideas, and companions in the domain state
- [x] Realm-aware companion context
- [x] Server-side OpenAI-compatible adapter seam
- [x] Licensed CC0 asset manifest and attribution
- [x] URL hash room navigation
- [x] Reduced-motion preference support
- [x] 3D loading states and binary watcher exclusions
- [x] Production build and typecheck

## Before production

- [ ] Add a production server/runtime for `/api/companion`; Vite middleware is development-only.
- [ ] Configure secrets through the deployment platform, never in client variables.
- [ ] Add authentication and per-user persistence.
- [ ] Replace localStorage with a server database and encrypted sensitive fields.
- [ ] Add automated browser tests for realm entry, room actions, persistence, and companion fallback.
- [ ] Add a real error boundary and telemetry that excludes private companion context.
- [ ] Audit every imported asset's license and preserve the manifest when adding files.
- [ ] Run Lighthouse and WebGL performance checks on representative mobile hardware.
- [ ] Review consent, privacy, and data retention copy before inviting real people into the Codex.
