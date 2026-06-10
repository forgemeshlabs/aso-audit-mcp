# Dogfooded ASO artifacts

The scanner practices what it scans. When this MCP server is hosted (e.g. behind
a Streamable HTTP endpoint), deploy these files so the deployment is itself
fully ASO compliant:

| File | Serve at |
|---|---|
| `ai` | `/.well-known/ai` (content-type: application/json) |
| `agent.json` | `/agent.json` and `/.well-known/agent.json` |
| `agent-card.json` | `/.well-known/agent-card.json` (A2A) |
| `mcp/server-card.json` | `/.well-known/mcp/server-card.json` |
| `llms.txt` | `/llms.txt` |
| `robots.txt` | `/robots.txt` |

Update `url`/`endpoint` fields to the actual deployment origin before serving.
