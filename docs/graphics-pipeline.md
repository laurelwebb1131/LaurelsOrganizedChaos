# Hearthwise graphics pipeline

## Current runtime

- Three.js + React Three Fiber + Drei for the interactive world.
- Tauri 2 for the packaged desktop shell.
- Local GLB assets under `public/assets/`.
- `ASSET_MANIFEST.json` and `ATTRIBUTION.md` record license provenance.
- Vite excludes binary asset files from file watching to avoid Windows `EBUSY` watcher failures.
- Three.js is isolated into a separate production chunk.

## Quality path

1. Prefer authored `.glb` assets with PBR materials, LODs, and animation clips.
2. Keep original licenses and source URLs in the manifest before wiring an asset into a scene.
3. Use 2K textures for desktop hero assets and 1K variants for secondary/mobile assets.
4. Add compressed KTX2 textures and Draco/Meshopt geometry after the asset set stabilizes.
5. Profile on representative hardware before increasing shadow map sizes or particle counts.
6. Keep the fallback procedural silhouette for every important character and location.

## Realm assignments

- **The Library:** bench, deer, crystal cluster. Quiet study and idea-garden atmosphere.
- **Hearth House:** bench, tree, bush. Familiar domestic space with living-world edges.
- **The University:** regular column, crystal base. Structured study and observatory language.
- **The Love Doctor:** crystal cluster, food booth. Shared space and ritual hospitality.
- **Mythic Earth encounter layer:** Triangulon, Hexabear, Whormbus, and the Quaternius spider remain encounter candidates, not UI decoration.

Credentials are never part of the graphics pipeline. Paid asset stores, model-generation services, or hosted AI providers must be configured by the operator through private environment variables or local tooling.
