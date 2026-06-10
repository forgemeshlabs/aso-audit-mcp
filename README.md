# aso-mcp — the free Agent Readiness Scanner

**What's your ASO score?**

SEO made you visible to search engines. **ASO (Agent Signal Optimization)** makes you discoverable, trustable, and payable by the AI agents that are becoming the web's next visitors.

`aso-mcp` is the free, open-source **ASO Scanner** — an [MCP](https://modelcontextprotocol.io) server that scans any website and produces an **Agent Readiness Report** scored on the open [ASO framework](https://agentsignaloptimization.com).

```
=== Agent Readiness Report: https://example.com ===
ASO Score: 70/100
Agent Readiness: Ready
Level: ASO-4 Trustable — Agents can verify trust, reputation, and operational signals.

Discoverability  20/20    Identity  15/20    Trust   11/15
Commerce          5/15    Reputation 4/15    Memory  15/15
```

## What it checks — 33 signals across 6 pillars

Find gaps in **discovery, trust, interoperability, and commerce** — every emerging agent standard in one scan:

| Pillar / Category | Checks |
|---|---|
| **Discovery** | robots.txt, sitemap.xml, Link headers, DNS-AID (`_agent.<domain>`), `/.well-known/ai` |
| **Content** | Markdown content negotiation, llms.txt, LLM-readable docs (`/index.md`, `llms-full.txt`) |
| **Bot Access** | Explicit AI crawler rules (GPTBot, ClaudeBot, Google-Extended, PerplexityBot…), Content Signals, Web Bot Auth |
| **Interoperability** | API Catalog (RFC 9727), OAuth discovery (RFC 8414), OAuth Protected Resource (RFC 9728), auth.md, **MCP Server Card** (`/.well-known/mcp/server-card.json`), **Google A2A Agent Card** (`/.well-known/agent-card.json`, required fields validated), Agent Skills, WebMCP |
| **Commerce** | x402, MPP, UCP, ACP, machine-readable pricing |
| **Identity & Trust** | HTTPS enforcement, JSON-LD/schema.org, OpenAPI, agent.json, security.txt, status endpoint, versioning, cross-file identity & signal consistency |

Every check returns **pass / partial / fail** with concrete evidence and a fix recommendation. Results roll up into the six ASO pillars (Discoverability 20, Identity 20, Trust 15, Commerce 15, Reputation 15, Memory 15) → your **ASO Score** and maturity level.

## Install

Requires Node.js ≥ 18.

```bash
git clone https://github.com/forgemesh/aso-mcp
cd aso-mcp
npm install && npm run build
```

### Claude Code

```bash
claude mcp add aso -- node /path/to/aso-mcp/dist/index.js
```

### Claude Desktop / Cursor / Windsurf (any MCP client)

```json
{
  "mcpServers": {
    "aso": {
      "command": "node",
      "args": ["/path/to/aso-mcp/dist/index.js"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `scan_site` | Full ASO scan → Agent Readiness Report: ASO Score, level, pillar breakdown, all 33 checks with evidence + recommendations |
| `get_fix_plan` | Prioritized remediation plan with ready-to-paste templates (robots.txt AI rules, llms.txt, agent.json, A2A agent card, MCP server card, x402 manifest, pricing.json, security.txt, status endpoint) |
| `check_signal` | Run one specific check (e.g. `a2a-agent-card`, `llms-txt`, `x402`) |
| `list_checks` | Catalog of every check with spec links |
| `get_aso_framework` | The ASO rubric: pillars, weights, levels, certification thresholds |

Try it: *"Scan example.com for agent readiness"* · *"What's my ASO score?"* · *"Give me a fix plan to make my site agent-ready."*

### CLI smoke test

```bash
npm run smoke -- https://your-site.com
```

## The ASO framework

> SEO ranks pages for people. ASO prepares services for agent selection, invocation, payment, and repeat use.

| Level | Name | Score |
|---|---|---|
| ASO-0 | Invisible | 0–9 |
| ASO-1 | Discoverable | 10–29 |
| ASO-2 | Understandable | 30–49 |
| ASO-3 | Invocable | 50–69 |
| ASO-4 | Trustable | 70–89 |
| ASO-5 | Autonomous-Commerce-Ready | 90–100 |

Scores from this scanner are directional self-assessments. **ASO Certification** (ASO-3+) requires verified evidence — see the [scoring rubric](https://agentsignaloptimization.com/docs/ASO-SCORE.md) and [agentsignaloptimization.com](https://agentsignaloptimization.com) for audits, certification, and the full framework.

## Notes

- The scanner only performs `GET` requests with an `ASO-Scanner/1.0` user agent, max 6 concurrent, 10s timeout, 512KB body cap. It never authenticates, never POSTs, never crawls beyond well-known paths.
- Reputation signals (citations, reviews, success rates) cannot be auto-verified by a crawler; they are reported as `manual` and scored 0 until verified by audit — so the auto-verifiable maximum is 89/100. That is intentional honesty, not a bug.
- Emerging specs (MCP Server Cards SEP-1649/SEP-2127, DNS-AID, Web Bot Auth, UCP/ACP/MPP) move fast. PRs updating paths welcome.

## License

MIT — free for everyone. If the scanner found gaps, the [ASO framework](https://agentsignaloptimization.com) shows you how to close them.
