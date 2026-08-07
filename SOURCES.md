# Scanner Standards Sources

Last reviewed: 2026-08-07

The ASO Scanner is part of a living framework. Its checks follow upstream
standards and protocol sources that are changing quickly. Stable requirements,
optional capabilities, drafts, and vendor conventions are not treated as the
same thing, and a signal only applies when the target claims the corresponding
service role.

The canonical, maintained registry is
[agentsignaloptimization.com/SOURCES.md](https://agentsignaloptimization.com/SOURCES.md).

Sources used for version 0.2.0:

- [x402 documentation](https://docs.x402.org/) and
  [canonical specifications](https://github.com/x402-foundation/x402/tree/main/specs)
- [A2A specification](https://a2a-protocol.org/latest/specification/)
- [MCP specification](https://modelcontextprotocol.io/specification/) and the
  [2026-07-28 release candidate](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)
- [RFC 9727 API Catalog](https://www.rfc-editor.org/rfc/rfc9727.html)
- [RFC 8414 OAuth Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414.html)
- [RFC 9728 OAuth Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728.html)
- [RFC 9116 security.txt](https://www.rfc-editor.org/rfc/rfc9116.html)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Google generative AI Search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)
- [llms.txt](https://llmstxt.org/), an optional community convention that
  Google Search explicitly does not use
- [DNS-AID](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/)
  and the [Payment HTTP Authentication Scheme](https://datatracker.ietf.org/doc/draft-ryan-httpauth-payment/),
  both Internet-Drafts and therefore advisory

Each scanner release must update this review date when its standards assumptions
are revalidated.
