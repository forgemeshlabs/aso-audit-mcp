import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { auditX402Endpoint } from "./x402-audit.js";

process.env.ASO_SCANNER_TEST_ALLOW_LOOPBACK = "1";

function fixture(challenge: unknown): Promise<{ server: Server; url: string }> {
  const encoded = Buffer.from(JSON.stringify(challenge)).toString("base64");
  const server = createServer((_req, res) => {
    res.writeHead(402, {
      "content-type": "application/json",
      "payment-required": encoded,
    });
    res.end(JSON.stringify({ error: "Payment Required" }));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, url: `http://127.0.0.1:${port}/paid` });
    });
  });
}

test("x402 endpoint audit validates a complete v2 challenge without paying", async (t) => {
  const { server, url } = await fixture({
    x402Version: 2,
    resource: { url: "https://example.com/paid", description: "test", mimeType: "application/json" },
    accepts: [{
      scheme: "exact",
      network: "eip155:8453",
      amount: "1000",
      asset: "0x0000000000000000000000000000000000000001",
      payTo: "0x0000000000000000000000000000000000000002",
      maxTimeoutSeconds: 300,
      extra: {},
    }],
    extensions: { bazaar: {} },
  });
  t.after(() => server.close());

  const report = await auditX402Endpoint(url);
  assert.equal(report.checkStatus.HTTP_402_STATUS, true);
  assert.equal(report.checkStatus.PAYMENT_REQUIRED_BASE64_JSON, true);
  assert.equal(report.checkStatus.PAYMENT_FIELDS, true);
  assert.equal(report.checkStatus.HTTPS_TLS_AUTHORIZED, false);
  assert.equal(report.score, 90);
  assert.equal(report.compliant, false);
  assert.deepEqual(report.failedChecks, ["HTTPS_TLS_AUTHORIZED"]);
});

test("x402 endpoint audit reports malformed challenges deterministically", async (t) => {
  const { server, url } = await fixture({ x402Version: 1, accepts: [] });
  t.after(() => server.close());

  const report = await auditX402Endpoint(url);
  assert.equal(report.score, 50);
  assert.deepEqual(report.failedChecks, [
    "HTTPS_TLS_AUTHORIZED",
    "X402_VERSION_2",
    "ACCEPTS_NONEMPTY",
    "CAIP2_NETWORK",
    "PAYMENT_FIELDS",
  ]);
});
