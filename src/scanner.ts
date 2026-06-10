import { ScanContext } from "./http.js";
import { runChecks, CHECK_DEFS } from "./checks.js";
import { score } from "./scoring.js";
import type { CloudflareCategory, ScanReport } from "./types.js";

export { CHECK_DEFS };

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withScheme).toString();
}

export async function scan(inputUrl: string, categories?: CloudflareCategory[]): Promise<ScanReport> {
  const url = normalizeUrl(inputUrl);
  const ctx = new ScanContext(url);
  const only = categories?.length
    ? CHECK_DEFS.filter((d) => categories.includes(d.category)).map((d) => d.id)
    : undefined;
  const checks = await runChecks(ctx, only);
  return score(url, ctx.origin, checks);
}

export async function scanSingle(inputUrl: string, checkId: string) {
  const url = normalizeUrl(inputUrl);
  const ctx = new ScanContext(url);
  const ids = checkId === "identity-consistency" || checkId === "signal-consistency" || checkId === "versioning"
    ? undefined // dependent checks need the full run
    : [checkId];
  const checks = await runChecks(ctx, ids);
  const hit = checks.find((c) => c.id === checkId);
  if (!hit) throw new Error(`Unknown check id: ${checkId}. Use list_checks to see valid ids.`);
  return hit;
}
