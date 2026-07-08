# Deployment

Neural Brain ships as a **single service** in production: the Dockerfile builds the
React client, compiles the server, and one Node process serves both — static files,
REST API, and the `/ws` WebSocket — on the same port. The client connects to
`ws(s)://<same-origin>/ws`, so no extra configuration is needed.

## The one thing that makes Claude think for real

Set the **`ANTHROPIC_API_KEY`** environment variable on your host. Without it the app
runs in simulation mode (status bar shows `◌ SIMULATION MODE`); with it every prompt
streams live reasoning from `claude-opus-4-8` (status bar shows `⚡ claude-opus-4-8`).

Get a key at **https://platform.claude.com** → API Keys. Never commit it — set it as a
secret in your hosting dashboard.

## Option A — Render (blueprint included)

1. Push this repo to GitHub (already done if you merged the PR).
2. In Render: **New → Blueprint**, pick the repo. Render reads `neural-brain/render.yaml`.
3. When prompted, paste your `ANTHROPIC_API_KEY` (it's marked `sync: false`, so the
   blueprint never stores it).
4. Deploy. The service gets a URL like `https://neural-brain.onrender.com`.

The blueprint provisions a **1 GB persistent disk** mounted at `/app/data`, so
long-term memory survives restarts and deploys. WebSockets and disks require a paid
instance type (`starter`); on the free tier remove the `disk:` block — memory then
resets on each deploy.

## Option B — Railway

1. In Railway: **New Project → Deploy from GitHub repo**, pick the repo.
2. Settings → **Root Directory**: `neural-brain` (Railway auto-detects the Dockerfile).
3. Variables → add `ANTHROPIC_API_KEY`.
4. (Recommended) Add a **Volume** mounted at `/app/data` so memory persists.
5. Settings → Networking → **Generate Domain**.

## Option C — any Docker host (VPS, Fly.io, …)

```bash
cd neural-brain
docker build -t neural-brain .
docker run -d --name brain \
  -p 8787:8787 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -v brain-memory:/app/data \
  neural-brain
# → http://your-host:8787
```

## Environment variables (production)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | for live Claude reasoning | *(empty ⇒ simulation)* | set as a secret |
| `BRAIN_MODEL` | no | `claude-opus-4-8` | any current Claude model ID |
| `PORT` | no | `8787` | Render/Railway inject their own; the server reads it |
| `MEMORY_FILE` | no | `/app/data/memory.json` (in Docker) | point at the mounted volume |

## Post-deploy checklist

- `GET /api/health` returns `{"ok":true,"mode":"claude","model":"claude-opus-4-8"}` —
  if `mode` is `"simulation"`, the API key env var isn't reaching the process.
- Open the app, ask a question, and confirm the status bar shows `⚡ claude-opus-4-8`.
- Ask a follow-up ("and what about …?") to confirm multi-turn context, then check the
  Memory panel gains an engram (and survives a service restart if you mounted a disk).

## Notes & limits

- **One brain, shared memory:** all visitors share the same long-term memory store and
  the same API key budget. For a public deployment, add auth or per-user memory
  namespaces (see `docs/ARCHITECTURE.md` → extension points).
- **Costs:** each prompt is one streaming `claude-opus-4-8` request (max 16K output
  tokens). Set spend limits in the Claude Console if you share the URL.
- **Scaling:** conversation history lives in process memory per WebSocket; running
  multiple instances needs sticky sessions (or move history to Redis).
