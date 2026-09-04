# Changelog

Notable player-facing and engine-facing changes to Sixarata are recorded here. The project uses semantic versioning for tagged releases.

## Unreleased

### Added

- Added Room-owned presentation Layers with intrinsic off-screen Buffers, explicit Cache invalidation, preserved draw ordering, and live actor isolation.
- Added repeatable Node and opt-in browser Room profilers with compiled-layout and static-layer experiments, deterministic workload tests, and operation counts.
- Added a reusable Cache lifecycle with explicit invalidation, revision-safe validation, shared-clock diagnostics, and stale asynchronous-result protection.
- Added documented tests across every engine class, with explicit coverage gates for lines, branches, and functions.
- Added GitHub Actions for Node.js testing, repository linting, CodeQL analysis, and signed-commit verification.
- Added automatic merge queuing for every non-draft pull request after required checks and review gates pass.
- Added issue forms, pull-request guidance, contribution and support policies, CODEOWNERS, and automated GitHub Actions updates.
- Enabled GitHub private vulnerability reporting with a confidential reporting path documented throughout the repository.

### Changed

- Generalized Layer to reference collections and a compositing parent, with optional buffering and presentation-only visibility. Layer constructors now take collection arrays instead of Room group names; Room retains those arrays across loads.
- Standardized monotonic timestamp properties on the established `*At` naming convention while preserving legacy Particle and Timer aliases.
- Restored Room as the intrinsic rendering surface for world Tiles and collision-debug drawing before Room composites into View.
- Reduced per-frame allocations by retaining Frame history, scanning collision groups directly with one reusable detector, and caching Hook priority order until registration changes.
- Cached gamepad mappings, reused Tile visibility objects, and traversed Room groups without allocating intermediate arrays during each frame.
- Replaced Hook execution-history shifting with a fixed-size circular history.
- Added a non-spatial `Entity` lifecycle base and made `Tile` its renderable, physical specialization.
- Restored tile-relative spatial settings and routed motion through `Screen.unit()` so tile-size changes scale geometry and gameplay together.
- Standardized enemy shot intervals on the engine's default millisecond duration unit.
- Limited the pre-commit semicolon check to staged JavaScript modules, included `.mjs` tests, and made the lint wrapper honor command-line arguments.
- Centralized simulation timing on the shared `Time` source and made movement independent of refresh rate and device pixel ratio.
- Documented physics units, value objects, mechanics, hooks, audio, drawing, and weather lifecycle contracts.
- Grouped camera defaults under `components.camera.alignment`.

### Fixed

- Simplified Orient's facing debounce state and removed an unused pending timestamp.
- Normalized Hook execution-history limits so disabled, invalid, fractional, and changed capacities remain bounded and chronological.
- Kept Room tile traversal compatible with browser engines that do not provide `Object.hasOwn()`.
- Avoided duplicate collection scans during Entity destruction while preserving its lifecycle callback order and reusable collection association.
- Prevented projectile vertical motion from also changing its depth coordinate.
- Preserved numeric tile density for future material and force behavior.
- Made enemy shot-interval units explicit and tied idle velocity snapping to the configured base movement speed.

Earlier changes predate this changelog.
