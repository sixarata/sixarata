## What changed

<!-- Describe the player-visible outcome and the implementation at a useful review level. -->

## Why

<!-- Link the issue and explain the problem this solves. -->

Closes #

## Contract

- [ ] I reviewed and followed `AGENTS.md`.

## Verification

- [ ] `sh tools/test.sh` passes.
- [ ] `sh tools/lint.sh` passes.
- [ ] I added or updated tests for changed behavior.
- [ ] I manually exercised player-visible behavior, or documented what remains untested.
- [ ] I updated `CHANGELOG.md` and other documentation when behavior or terminology changed.
- [ ] Every commit has a GitHub-verified signature.

## Engine safety

- [ ] Physics behavior remains independent of refresh rate and device pixel ratio.
- [ ] Timing uses the shared `Time` source rather than a new clock.
- [ ] New global hooks and browser listeners have bounded ownership and cleanup.
- [ ] New settings use documented units and preserve existing room compatibility.

## Visual evidence

<!-- Add before/after screenshots or a short recording for visible changes. Remove this section when not applicable. -->
