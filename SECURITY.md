# Security Policy

## Supported scope

This repository is maintained as the public source for Ahmed Rehan's portfolio site and related deployment assets.

Security reports are welcome for:

- the public website code in this repository
- Vercel/serverless behavior shipped from this repository
- documented deployment or configuration mistakes that could expose visitors or secrets

Please do not publish working exploit details, secret material, or private account data in a public issue.

## Reporting a vulnerability

Report vulnerabilities privately by emailing admin@ar27111994.dev with:

- a short summary of the issue
- affected URL, file, or feature
- reproduction steps or proof of concept
- impact assessment if known

If email is not practical, open a GitHub issue with only a minimal non-sensitive summary and ask for a private follow-up channel.

## Response expectations

Best effort targets:

- acknowledgement within 5 business days
- status update after triage when the report is valid and reproducible
- coordinated disclosure after a fix is ready or mitigation is in place

## Safe handling rules

- Do not exfiltrate personal data, tokens, or secrets.
- Do not run destructive tests against production services.
- Keep testing proportional to verification needs.

## Out of scope

The following are usually out of scope unless they create a concrete exploitable path in this repository:

- generic best-practice complaints without a reproducible issue
- issues that require access to third-party platforms outside this repo's control
- social engineering, spam, or physical security concerns
- rate-limit or availability complaints without security impact
