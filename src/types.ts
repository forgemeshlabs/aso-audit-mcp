export type CheckStatus = "pass" | "partial" | "fail" | "manual" | "error";

export type CloudflareCategory =
  | "Discoverability"
  | "Content Accessibility"
  | "Bot Access Control"
  | "API / Auth / MCP"
  | "Commerce"
  | "Identity & Trust (ASO)";

export type Pillar =
  | "Discoverability"
  | "Identity"
  | "Trust"
  | "Commerce"
  | "Reputation"
  | "Memory";

export interface CheckResult {
  id: string;
  name: string;
  category: CloudflareCategory;
  status: CheckStatus;
  evidence: string;
  recommendation?: string;
  specUrl?: string;
  /** Parsed artifact (manifest JSON, etc.) for cross-check consumers */
  data?: unknown;
}

export interface CheckDef {
  id: string;
  name: string;
  category: CloudflareCategory;
  description: string;
  specUrl?: string;
}

/** One scored line of the ASO rubric (agentsignaloptimization.com/docs/ASO-SCORE.md) */
export interface SignalScore {
  id: string;
  name: string;
  pillar: Pillar;
  maxPoints: number;
  points: number;
  status: CheckStatus;
  /** check ids that fed this signal */
  sources: string[];
  note: string;
}

export interface PillarScore {
  pillar: Pillar;
  points: number;
  maxPoints: number;
  signals: SignalScore[];
}

export interface ScanReport {
  url: string;
  scannedOrigin: string;
  framework: "ASO (Agent Signal Optimization)";
  ariScore: number;
  ariMax: 100;
  autoVerifiableMax: number;
  level: { id: string; name: string; range: string; meaning: string };
  certification: {
    eligible: boolean;
    tier: string | null;
    note: string;
  };
  pillars: PillarScore[];
  checks: CheckResult[];
  summary: {
    pass: number;
    partial: number;
    fail: number;
    manual: number;
    error: number;
  };
  topRecommendations: string[];
}
