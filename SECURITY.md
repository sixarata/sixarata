# Security Policy

## Supported versions

Until Sixarata publishes a stable release line, security fixes are applied to the current `main` branch. Old development snapshots are not maintained separately.

## Report a vulnerability privately

Do not publish vulnerability details in a public issue. Use [GitHub private vulnerability reporting](https://github.com/sixarata/sixarata/security/advisories/new) when the repository enables it. Until then, open a public issue containing no vulnerability details and ask a maintainer to arrange private contact.

Include as much of the following as is safe:

- the affected version or commit and browser;
- the security impact and who could be affected;
- minimal, reproducible steps;
- whether the issue requires a particular room, input device, browser permission, or deployment configuration;
- sanitized console output; and
- any suggested mitigation.

Never send credentials, signing material, private source code, or another person's data.

## What belongs here

Examples include script injection through room or content data, unsafe browser API use, unintended network or storage access, credential exposure, compromised release automation, and vulnerable dependencies with a credible impact on players or hosted copies.

Ordinary gameplay bugs, crashes without a security consequence, feature requests, and documentation corrections belong in [GitHub Issues](https://github.com/sixarata/sixarata/issues).

## Safe research

Good-faith research is welcome when you test only systems you own or are authorized to use, avoid privacy violations and service disruption, stop after demonstrating the minimum necessary impact, and allow a reasonable opportunity to investigate before public disclosure.
