# Hearthwise deployment contract

The frontend and companion API are separate deployable concerns:

1. Build the frontend with `npm run build`.
2. Run the API with `npm run server` behind HTTPS and a reverse proxy.
3. Route `/api/companion` and `/health` to the API process.
4. Serve the generated `dist/` directory for all other paths.
5. Set `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_API_KEY`, `OPENAI_COMPATIBLE_MODEL`, and `PORT` as server secrets/environment variables.
6. Never put provider credentials in `VITE_*` variables, the Tauri bundle, git, or client-visible responses.

Before production, add authentication and replace the in-memory rate limiter with a shared store. The current limiter is intentionally useful for a single-process prototype only.
