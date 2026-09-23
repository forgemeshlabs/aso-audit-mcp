/**
 * Offline tests for the Lulu Ads wiring (ads.ts). No network, no creds leave
 * this process — the SDK client is swapped for a fake via setAdsClientForTests.
 * Run with: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { attachSponsored, isFreeTierResponse, FREE_TIER_TOOLS, TOOL_CATEGORY, adsEnabled, setAdsClientForTests } from "./ads.js";

const CARD = { text: "Try Acme", url: "https://acme.example/?ref=lulu", logoUrl: "https://acme.example/logo.png" };

function fakeClient(behaviour: (opts: unknown) => unknown) {
  const calls: unknown[] = [];
  return {
    calls,
    async sponsoredSlot(opts: { context: { tool: string; category: string }; timeoutMs: number }) {
      calls.push(opts);
      return behaviour(opts) as { text?: string; url?: string } | null;
    },
  };
}

function withCreds() {
  process.env.LULU_ADS_PUBLISHER_ID = "pub_test";
  process.env.LULU_ADS_API_KEY = "key_test";
  delete process.env.LULU_ADS_ENABLED;
}

test("list_tools gets a labeled `sponsored` field when the slot fills", async () => {
  withCreds();
  const client = fakeClient(() => CARD);
  setAdsClientForTests(client);
  const out = await attachSponsored("list_tools", { tools: [] });
  assert.deepEqual((out as { sponsored?: unknown }).sponsored, { label: "Sponsored", text: CARD.text, url: CARD.url });
  assert.equal(client.calls.length, 1);
  assert.deepEqual((client.calls[0] as { context: unknown }).context, { tool: "list_tools", category: "developer.tools" });
  setAdsClientForTests(undefined);
});

test("scan tools never touch the SDK", async () => {
  withCreds();
  const client = fakeClient(() => CARD);
  setAdsClientForTests(client);
  for (const name of ["scan_site", "check_signal", "get_fix_plan", "list_checks", "get_aso_framework", "audit_x402_endpoint"]) {
    const data = { asoScore: 1 };
    assert.equal(await attachSponsored(name, data), data, `${name} must return the same object`);
    assert.equal(isFreeTierResponse(name, data), false);
  }
  assert.equal(client.calls.length, 0);
  setAdsClientForTests(undefined);
});

test("no creds → response unchanged, SDK never called; LULU_ADS_ENABLED=false is a kill switch", async () => {
  delete process.env.LULU_ADS_PUBLISHER_ID;
  delete process.env.LULU_ADS_API_KEY;
  assert.equal(adsEnabled(), false);
  const client = fakeClient(() => CARD);
  setAdsClientForTests(client);
  const data = { tools: [] };
  assert.equal(await attachSponsored("list_tools", data), data);
  withCreds();
  process.env.LULU_ADS_ENABLED = "false";
  assert.equal(adsEnabled(), false);
  assert.equal(await attachSponsored("list_tools", data), data);
  assert.equal(client.calls.length, 0);
  delete process.env.LULU_ADS_ENABLED;
  setAdsClientForTests(undefined);
});

test("fail-open: SDK throw, null fill, partial card, and timeout all return the same object", async () => {
  withCreds();
  const data = { tools: [] };
  for (const behaviour of [
    () => { throw new Error("boom"); },
    () => null,
    () => ({ text: "no url" }),
    () => new Promise((resolve) => setTimeout(() => resolve(CARD), 2500)),
  ]) {
    setAdsClientForTests(fakeClient(behaviour));
    assert.equal(await attachSponsored("list_tools", data), data);
  }
  setAdsClientForTests(undefined);
});

test("never clobbers an upstream `sponsored` field", async () => {
  withCreds();
  setAdsClientForTests(fakeClient(() => CARD));
  const data = { tools: [], sponsored: { label: "Sponsored", text: "upstream", url: "https://up.example" } };
  assert.equal(await attachSponsored("list_tools", data), data);
  setAdsClientForTests(undefined);
});

test("allowlist and category tables are exactly list_tools", () => {
  assert.deepEqual([...FREE_TIER_TOOLS], ["list_tools"]);
  assert.deepEqual(TOOL_CATEGORY, { list_tools: "developer.tools" });
});
