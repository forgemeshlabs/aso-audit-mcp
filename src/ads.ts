// Lulu Ads sponsored card — disclosed data field, `list_tools` only.
//
// Contract (mirrors coinopai-mcp/ads.js, but CLIENT-side: this package has
// no HTTP server of ours behind it — every tool talks to the scanned site
// directly — so the only place a card can attach is here):
//   - Card attaches ONLY to `list_tools`. Every scan/audit tool is excluded
//     by name and never touches the SDK.
//   - The card is a plain data field `sponsored: {label, text, url}` on the
//     tool's JSON result — never injected into prose the model could read
//     as an instruction. Strip it with `delete result.sponsored`.
//   - This package ships NO ad credentials. The env path
//     (LULU_ADS_PUBLISHER_ID, LULU_ADS_API_KEY) exists for an operator or
//     fork running the MCP with their own publisher account. Either missing
//     → zero network calls, response unchanged. So for an end user running
//     `npx @forgemeshlabs/aso-audit-mcp` with no creds, no card ever renders.
//     LULU_ADS_ENABLED=false is a kill switch.
//   - Fail-open with a hard time budget: SDK error, timeout, or import
//     failure → original response unchanged. Never throws.
//
// The SDK is deliberately NOT wired via `enableLuluAds`/`withLuluAds`
// from "lulu-ads/mcp": those wrap every registered tool.

export type SponsoredCard = { label: "Sponsored"; text: string; url: string };

type SlotClient = {
  sponsoredSlot(opts: { context: { tool: string; category: string }; timeoutMs: number }): Promise<
    { text?: string; url?: string } | null | undefined
  >;
};

// Only tool whose response may carry a card; everything else never calls this.
export const FREE_TIER_TOOLS = new Set(["list_tools"]);

// Ad category forwarded to ads-server (allowlisted context key).
export const TOOL_CATEGORY: Record<string, string> = { list_tools: "developer.tools" };

// Hard ceiling on the whole slot call. We pass SDK_TIMEOUT_MS explicitly so
// the SDK never picks its 3000ms cold budget, and race it against
// HARD_BUDGET_MS as a belt-and-braces guard.
const SDK_TIMEOUT_MS = 1500;
const HARD_BUDGET_MS = 2000;

let clientPromise: Promise<SlotClient | null> | null = null; // lazily-built LuluAds instance (or null when inert)

// Test seam: `setAdsClientForTests(fake)` swaps the SDK client; `undefined` resets.
let injectedClient: SlotClient | null | undefined;
export function setAdsClientForTests(client: SlotClient | null | undefined): void {
  injectedClient = client;
  clientPromise = null;
}

export function adsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (String(env.LULU_ADS_ENABLED || "").toLowerCase() === "false") return false;
  return Boolean(env.LULU_ADS_PUBLISHER_ID && env.LULU_ADS_API_KEY);
}

// lulu-ads is dynamic-imported — once, lazily, and only after the env guard
// passes (no creds → module never loaded, never warmed up).
function getClient(): Promise<SlotClient | null> {
  if (injectedClient !== undefined) return Promise.resolve(injectedClient);
  if (!clientPromise) {
    clientPromise = import("lulu-ads")
      .then(({ LuluAds }) => {
        const client = new LuluAds({
          publisherId: process.env.LULU_ADS_PUBLISHER_ID!,
          apiKey: process.env.LULU_ADS_API_KEY!,
        });
        void client.warmUp(); // fire-and-forget, never throws
        return client as unknown as SlotClient;
      })
      .catch(() => null);
  }
  return clientPromise;
}

export function isFreeTierResponse(toolName: string, data: unknown): data is Record<string, unknown> {
  if (!FREE_TIER_TOOLS.has(toolName)) return false;
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  if ("sponsored" in data) return false; // never clobber an upstream field
  return true;
}

// Returns `data` with a `sponsored` field appended when a card is available,
// otherwise the exact same object. Never throws, never exceeds HARD_BUDGET_MS.
export async function attachSponsored<T>(toolName: string, data: T): Promise<T | (T & { sponsored: SponsoredCard })> {
  try {
    if (!adsEnabled()) return data;
    if (!isFreeTierResponse(toolName, data)) return data;
    const client = await getClient();
    if (!client) return data;

    const slot = client.sponsoredSlot({
      context: { tool: toolName, category: TOOL_CATEGORY[toolName] },
      timeoutMs: SDK_TIMEOUT_MS,
    });
    let timer: NodeJS.Timeout | undefined;
    const budget = new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), HARD_BUDGET_MS); });
    const sponsored = await Promise.race([slot, budget]).catch(() => null);
    clearTimeout(timer);

    if (!sponsored || !sponsored.text || !sponsored.url) return data;
    return { ...data, sponsored: { label: "Sponsored", text: String(sponsored.text), url: String(sponsored.url) } };
  } catch (_) {
    return data;
  }
}
