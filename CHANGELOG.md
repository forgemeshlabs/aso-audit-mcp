# Changelog

## 0.2.0

- Added `audit_x402_endpoint`, a deterministic no-spend x402 v2 protocol audit with a 0-100 score, A-F grade, compliance verdict, per-check booleans, and failed-check list.
- Added method/body support so POST, PUT, and PATCH payment gates can be audited without sending a payment signature.
- Validates HTTPS, HTTP 402, `PAYMENT-REQUIRED`, Base64 JSON, `x402Version: 2`, non-empty `accepts`, CAIP-2 networks, required payment fields, and JSON content type.
- Reports observed schemes, networks, and extensions while explicitly distinguishing challenge compliance from paid settlement correctness.
- Updated A2A Agent Card validation for the current `supportedInterfaces[]` contract (`url`, `protocolBinding`, `protocolVersion`) instead of the legacy top-level `url` shape.
- Corrected Commerce scoring so x402 and MPP count as agent-safe purchase paths; UCP/ACP are no longer implicitly required for payment-capable APIs.
- Content Signals now pass when published in the HTTP `Content-Signal` response header, not only as a robots.txt directive.
- OpenAPI checks now require `info.title`, `info.version`, and non-empty `paths`; bare version markers are partial instead of complete.
- Machine-readable pricing inside an x402 manifest now earns pricing credit without requiring a redundant pricing.json file.

## 0.1.4

- Added Glama registry metadata for ForgeMesh maintainer verification.
- Published Google agent-readiness aligned ASO Audit MCP scanner.
