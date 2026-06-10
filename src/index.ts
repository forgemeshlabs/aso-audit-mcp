#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { scan, scanSingle, CHECK_DEFS } from "./scanner.js";
import { ASO_LEVELS, SIGNALS } from "./scoring.js";
import { buildFixPlan } from "./fixes.js";
import type { CloudflareCategory } from "./types.js";

const CATEGORIES = [
  "Discoverability",
  "Content Accessibility",
  "Bot Access Control",
  "API / Auth / MCP",
  "Commerce",
  "Identity & Trust (ASO)",
] as const;

const server = new McpServer({
  name: "aso-scanner",
  version: "1.0.0",
});

function json(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

function errorResult(err: unknown) {
  return {
    content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    isError: true,
  };
}

server.registerTool(
  "scan_site",
  {
    title: "ASO Scan — measure your ASO Score",
    description:
      "Scan a website for Agent Readiness using the ASO (Agent Signal Optimization) framework and return an Agent Readiness Report. " +
      "Runs 33 checks across discoverability (robots.txt, sitemap, llms.txt, DNS-AID, Link headers), " +
      "content accessibility (markdown negotiation), bot access control (AI bot rules, Content Signals, Web Bot Auth), " +
      "invocation (API catalog, OAuth discovery, OAuth protected resource, auth.md, MCP Server Card, Google A2A Agent Card, Agent Skills, WebMCP), " +
      "commerce (x402, MPP, UCP, ACP, pricing) and identity/trust signals. " +
      "Returns the ASO Score (0-100, formally the Agent Readiness Index), ASO maturity level (ASO-0 Invisible … ASO-5 Autonomous-Commerce-Ready), " +
      "an agent-readiness verdict, per-pillar scores, per-check evidence, and prioritized recommendations.",
    inputSchema: {
      url: z.string().describe("Website URL or domain to scan, e.g. https://example.com or example.com"),
      categories: z
        .array(z.enum(CATEGORIES))
        .optional()
        .describe("Optional: limit the scan to specific check categories. Default: all."),
    },
  },
  async ({ url, categories }) => {
    try {
      return json(await scan(url, categories as CloudflareCategory[] | undefined));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "check_signal",
  {
    title: "Run a single agent-readiness check",
    description:
      "Run one specific agent-readiness check against a site (e.g. 'a2a-agent-card', 'llms-txt', 'mcp-server-card', 'x402'). " +
      "Use list_checks for valid check ids. Returns status, evidence, and a fix recommendation.",
    inputSchema: {
      url: z.string().describe("Website URL or domain"),
      check_id: z.string().describe("Check id from list_checks, e.g. 'a2a-agent-card'"),
    },
  },
  async ({ url, check_id }) => {
    try {
      return json(await scanSingle(url, check_id));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "list_checks",
  {
    title: "List all agent-readiness checks",
    description:
      "List the full catalog of checks the scanner runs: id, name, category (Cloudflare isitagentready-style), description, and spec link.",
    inputSchema: {},
  },
  async () => json({ totalChecks: CHECK_DEFS.length, checks: CHECK_DEFS })
);

server.registerTool(
  "get_fix_plan",
  {
    title: "Get a prioritized ASO fix plan",
    description:
      "Scan a site and return a prioritized remediation plan: which signals to add first, the ASO Score points each fix is worth, " +
      "and ready-to-paste artifact templates (robots.txt AI rules, llms.txt, agent.json, A2A agent-card.json, MCP server card, x402 manifest, pricing.json, security.txt, status endpoint).",
    inputSchema: {
      url: z.string().describe("Website URL or domain to plan fixes for"),
    },
  },
  async ({ url }) => {
    try {
      const report = await scan(url);
      return json(buildFixPlan(report));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "get_aso_framework",
  {
    title: "ASO framework reference",
    description:
      "Return the ASO (Agent Signal Optimization) framework reference: the six signal pillars with point weights, " +
      "the Agent Readiness Index maturity levels (ASO-0 through ASO-5), certification thresholds, and the scoring rubric. " +
      "Source: https://agentsignaloptimization.com",
    inputSchema: {},
  },
  async () =>
    json({
      framework: "Agent Signal Optimization (ASO)",
      definition:
        "ASO is the practice of optimizing for agent discovery, trust, invocation, commerce, and memory, so AI shoppers, browser agents, research assistants, and buying bots know what to find, cite, recommend, invoke, pay for, and return to. SEO ranks pages for people; ASO prepares services for agent selection.",
      site: "https://agentsignaloptimization.com",
      rubric: "https://agentsignaloptimization.com/docs/ASO-SCORE.md",
      levels: ASO_LEVELS,
      pillars: [
        { pillar: "Discoverability", maxPoints: 20 },
        { pillar: "Identity", maxPoints: 20 },
        { pillar: "Trust", maxPoints: 15 },
        { pillar: "Commerce", maxPoints: 15 },
        { pillar: "Reputation (emerging)", maxPoints: 15 },
        { pillar: "Memory", maxPoints: 15 },
      ],
      signals: SIGNALS,
      certification: {
        "ASO Certified Invocable": "ASO-3, score 50-69, verified OpenAPI or equivalent invocation path.",
        "ASO Certified Trustable": "ASO-4, score 70-89, verified trust, reputation, and operational signals.",
        "ASO Certified Autonomous-Commerce-Ready": "ASO-5, score 90-100, verified payment and returnability signals.",
      },
    })
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("aso-mcp: ASO Scanner running on stdio");
