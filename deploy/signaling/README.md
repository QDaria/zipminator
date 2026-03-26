# Zipminator Signaling Server -- Cloud Deployment

Standalone PQC signaling server for Zipminator Messenger (Pillar 2) and VoIP (Pillar 3).
FastAPI + WebSocket, in-memory state, no database required.

## Local Testing (Docker)

```bash
# From project root
docker build -f Dockerfile.signaling -t zipminator-signaling .
docker run -p 8765:8765 zipminator-signaling

# Or use docker-compose
docker compose -f docker-compose.signaling.yml up
```

Verify:

```bash
curl http://localhost:8765/health
# {"status":"ok","peers":0,"rooms":0}
```

## Deploy to Fly.io

```bash
# Install flyctl: https://fly.io/docs/flyctl/install/
fly auth login

# From project root (Dockerfile.signaling is here)
fly launch --config deploy/signaling/fly.toml --no-deploy
fly deploy --config deploy/signaling/fly.toml

# Check status
fly status --config deploy/signaling/fly.toml
fly logs --config deploy/signaling/fly.toml
```

The fly.toml configures:
- Region: Amsterdam (ams). Change `primary_region` as needed.
- Machine: shared-cpu-1x, 256MB RAM
- Auto-stop when idle, auto-start on traffic
- Health check on `/health` every 15s

## Deploy to Railway

```bash
# Install Railway CLI: https://docs.railway.app/guides/cli
railway login

# From project root
railway init
railway up

# Railway reads Dockerfile.signaling via railway.json
# The $PORT env var is injected automatically by Railway
```

The railway.json configures:
- Build from Dockerfile.signaling
- Start command uses $PORT (injected by Railway at runtime)
- Health check on `/health`
- Auto-restart on failure (max 5 retries)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT     | 8765    | Server port (set automatically by Railway/Fly) |

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (peers/rooms count) |
| `/rooms` | GET | List active rooms |
| `/rooms/{id}` | GET | Room details |
| `/ws/{client_id}` | WS | Main signaling WebSocket |

## WebSocket Protocol

Connect to `wss://your-domain/ws/{client_id}` and send JSON messages:

```json
{"action": "create_room"}
{"action": "join", "room_id": "..."}
{"action": "signal", "target": "peer_id", "type": "offer", ...}
{"action": "message", "target": "peer_id", "ciphertext": "..."}
{"action": "broadcast", "room_id": "...", "ciphertext": "..."}
{"action": "leave"}
{"action": "list_rooms"}
```
