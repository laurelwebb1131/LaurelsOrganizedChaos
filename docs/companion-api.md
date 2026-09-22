# Companion API contract

The browser calls `POST /api/companion`. The API route must keep the provider key server-side.

## Request

```json
{
  "companionName": "Juniper",
  "companionRole": "World guide",
  "companionContext": "A curious crow familiar...",
  "realm": "The Library",
  "userMessage": "Help me choose my next idea"
}
```

## Response

```json
{
  "reply": "Start with the smallest version you can finish today."
}
```

The server adapter should validate the request, constrain the model to the supplied context, and never infer private facts about real people. Set `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_API_KEY`, and `OPENAI_COMPATIBLE_MODEL` on the server. The app intentionally falls back to deterministic local replies when this route is unavailable.
