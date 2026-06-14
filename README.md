# Scene3D Answer MVP

This MVP renders structured `scene3d.v1` answer blocks as interactive 3D knowledge cards.

## Run

```bash
npm install
copy .env.example .env
npm run dev
```

Set `AI_PROVIDER=deepseek` and `DEEPSEEK_API_KEY` in `.env` to enable live model-generated scenes. Without a working model provider, the app falls back to the local mock scenes.

## Verify

```bash
npm test
npm run build
npm run lint
```

## Manual Prompts

- `Explain a binary search tree` renders the `tree` template.
- `解释一次 HTTP 请求流程` renders the `flow` template.
- `人活着为了什么` renders the `radial` template.

The 3D card supports orbit drag, mouse-wheel zoom, and node click inspection.

## Scope

The app calls a same-origin `/api/scene-answer` dev-server endpoint, which uses DeepSeek Chat Completions by default and validates every returned scene with Zod before rendering. The browser never receives the API key and never executes model-generated code.
