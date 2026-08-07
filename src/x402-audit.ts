import { httpRequest } from "./http.js";
import { assertResolvableAndPublic, parseScanUrl } from "./safeurl.js";

export const X402_AUDIT_VERSION = "forgemesh-x402-audit/1.0";

const CHECK_WEIGHTS = {
  HTTPS_TLS_AUTHORIZED: 10,
  HTTP_402_STATUS: 20,
  PAYMENT_REQUIRED_HEADER: 15,
  PAYMENT_REQUIRED_BASE64_JSON: 10,
  X402_VERSION_2: 10,
  ACCEPTS_NONEMPTY: 10,
  CAIP2_NETWORK: 10,
  PAYMENT_FIELDS: 10,
  JSON_CONTENT_TYPE: 5,
} as const;

export type X402AuditCheck = keyof typeof CHECK_WEIGHTS;

export interface X402EndpointAudit {
  reportVersion: string;
  observedAt: string;
  requestedUrl: string;
  finalUrl: string;
  method: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  compliant: boolean;
  checkStatus: Record<X402AuditCheck, boolean>;
  failedChecks: X402AuditCheck[];
  warnings: string[];
  observed: {
    status: number;
    contentType: string;
    x402Version?: number;
    schemes: string[];
    networks: string[];
    extensions: string[];
  };
  standard: "x402-v2";
  specUrl: string;
  note: string;
}

function decodePaymentRequired(value: string | undefined): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const decoded = Buffer.from(value.trim(), "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function hasPaymentFields(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  return typeof p.scheme === "string" && p.scheme.length > 0
    && typeof p.network === "string" && p.network.length > 0
    && typeof p.amount === "string" && /^\d+$/.test(p.amount)
    && typeof p.asset === "string" && p.asset.length > 0
    && typeof p.payTo === "string" && p.payTo.length > 0
    && typeof p.maxTimeoutSeconds === "number" && p.maxTimeoutSeconds > 0
    && !!p.extra && typeof p.extra === "object" && !Array.isArray(p.extra);
}

function grade(score: number): X402EndpointAudit["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Deterministic, no-spend x402 v2 endpoint audit. It never supplies a
 * PAYMENT-SIGNATURE and therefore cannot authorize or settle a payment.
 */
export async function auditX402Endpoint(
  inputUrl: string,
  method = "GET",
  body?: string,
  contentType = "application/json",
): Promise<X402EndpointAudit> {
  const initial = parseScanUrl(inputUrl);
  await assertResolvableAndPublic(initial);
  const normalizedMethod = method.toUpperCase();
  const response = await httpRequest(initial.toString(), {
    method: normalizedMethod,
    body,
    headers: body === undefined ? undefined : { "content-type": contentType },
    accept: "application/json",
  });

  const header = response.headers["payment-required"];
  const challenge = decodePaymentRequired(header);
  const accepts = Array.isArray(challenge?.accepts) ? challenge.accepts : [];
  const networks = accepts
    .map((p) => p && typeof p === "object" ? (p as Record<string, unknown>).network : undefined)
    .filter((v): v is string => typeof v === "string");
  const schemes = accepts
    .map((p) => p && typeof p === "object" ? (p as Record<string, unknown>).scheme : undefined)
    .filter((v): v is string => typeof v === "string");
  const extensions = challenge?.extensions && typeof challenge.extensions === "object" && !Array.isArray(challenge.extensions)
    ? Object.keys(challenge.extensions as Record<string, unknown>)
    : [];

  const checks: Record<X402AuditCheck, boolean> = {
    HTTPS_TLS_AUTHORIZED: initial.protocol === "https:" && !response.error,
    HTTP_402_STATUS: response.status === 402,
    PAYMENT_REQUIRED_HEADER: typeof header === "string" && header.length > 0,
    PAYMENT_REQUIRED_BASE64_JSON: challenge !== null,
    X402_VERSION_2: challenge?.x402Version === 2,
    ACCEPTS_NONEMPTY: accepts.length > 0,
    CAIP2_NETWORK: accepts.length > 0 && networks.length === accepts.length && networks.every((n) => /^[-a-z0-9]{3,8}:[-_A-Za-z0-9]{1,32}$/.test(n)),
    PAYMENT_FIELDS: !!challenge?.resource
      && typeof challenge.resource === "object"
      && !Array.isArray(challenge.resource)
      && typeof (challenge.resource as Record<string, unknown>).url === "string"
      && accepts.length > 0
      && accepts.every(hasPaymentFields),
    JSON_CONTENT_TYPE: response.contentType.includes("application/json"),
  };

  const failedChecks = (Object.keys(checks) as X402AuditCheck[]).filter((k) => !checks[k]);
  const score = (Object.keys(checks) as X402AuditCheck[])
    .reduce((sum, key) => sum + (checks[key] ? CHECK_WEIGHTS[key] : 0), 0);
  const warnings: string[] = [];
  if (response.finalUrl !== initial.toString()) warnings.push(`Request redirected to ${response.finalUrl}`);
  if (accepts.some((p) => p && typeof p === "object" && !["exact", "upto", "batch-settlement"].includes(String((p as Record<string, unknown>).scheme)))) {
    warnings.push("Challenge advertises a scheme outside the currently documented exact/upto/batch-settlement set; verify its scheme specification independently.");
  }

  return {
    reportVersion: X402_AUDIT_VERSION,
    observedAt: new Date().toISOString(),
    requestedUrl: initial.toString(),
    finalUrl: response.finalUrl,
    method: normalizedMethod,
    score,
    grade: grade(score),
    compliant: failedChecks.length === 0,
    checkStatus: checks,
    failedChecks,
    warnings,
    observed: {
      status: response.status,
      contentType: response.contentType,
      x402Version: typeof challenge?.x402Version === "number" ? challenge.x402Version : undefined,
      schemes: [...new Set(schemes)],
      networks: [...new Set(networks)],
      extensions,
    },
    standard: "x402-v2",
    specUrl: "https://github.com/x402-foundation/x402/tree/main/specs",
    note: "No-spend challenge audit only. A perfect score does not prove payment verification, settlement, idempotency, or paid-response correctness.",
  };
}
