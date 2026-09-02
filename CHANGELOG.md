# Changelog

Notable player-facing and engine-facing changes to Sixarata are recorded here. The project uses semantic versioning for tagged releases.

## Unreleased

### Added

- Added documented tests across every engine class, with explicit coverage gates for lines, branches, and functions.
- Added GitHub Actions for Node.js testing, repository linting, CodeQL analysis, and signed-commit verification.
- Added issue forms, pull-request guidance, contribution and support policies, CODEOWNERS, and automated GitHub Actions updates.
- Enabled GitHub private vulnerability reporting with a confidential reporting path documented throughout the repository.

### Changed

- Limited the pre-commit semicolon check to staged JavaScript modules, included `.mjs` tests, and made the lint wrapper honor command-line arguments.
- Centralized simulation timing on the shared `Time` source and made movement independent of refresh rate and device pixel ratio.
- Documented physics units, value objects, mechanics, hooks, audio, drawing, and weather lifecycle contracts.
- Grouped camera defaults under `components.camera.alignment`.

### Fixed

- Prevented projectile vertical motion from also changing its depth coordinate.
- Preserved numeric tile density for future material and force behavior.
- Made enemy shot-interval units explicit and tied idle velocity snapping to the configured base movement speed.

Earlier changes predate this changelog.
