# Sixarata implementation requirements

This file is the canonical implementation and review contract for humans and coding agents working in this repository. Apply these requirements to every change unless the user explicitly requests a narrower exception.

## Project boundaries

- Keep the playable engine in `scripts/`, `styles/`, and `index.html` browser-native and dependency-free.
- Do not add a runtime framework, package manager requirement, transpiler, bundler, generated runtime, or server-side dependency without explicit approval.
- Tests, repository automation, and contributor tooling may use the standard capabilities already available in Node.js, the shell, C compiler, browser, and GitHub Actions; they must not become runtime requirements.
- Keep reusable engine behavior under `scripts/core/` and game-specific rooms, settings, startup wiring, and optional effects under `scripts/content/`.
- Prefer the smallest cohesive class or module that fits the existing architecture. Do not add a generic abstraction before more than one concrete consumer needs it.

## Class and file structure

- Use one primary class per implementation file and export it as the default export.
- Name classes and constructor-like value objects with `PascalCase`. Name methods, properties, variables, folders, and files with concise `camelCase` or lowercase names consistent with the surrounding directory.
- Keep classes grouped by responsibility: abstractions, components, controls, inputs, interfaces, mechanics, physics, sound, tiles, utilities, and weather.
- Re-export public classes from the nearest `exports.js` barrel and preserve the established grouping and column alignment there.
- Use `static defaults` for meaningful class defaults. Keep configurable game defaults in `scripts/content/settings.js`; do not scatter duplicate magic values across consumers.
- Prefer instance arrow methods for consistency with existing hook callbacks and stable callback identity.
- Follow the common lifecycle shape when it applies:
  1. `constructor()` delegates to `set()`;
  2. `set()` delegates to or coordinates `reset()`;
  3. `reset()` restores a complete, reusable default state;
  4. `hooks()` registers global callbacks;
  5. `unhooks()` removes callbacks owned by the instance;
  6. `listen()`, `tick()`, `update()`, and `render()` perform their named phase only; and
  7. `destroy()` releases hooks, listeners, group membership, and owned references.
- Return `this` from constructors through `set()` or `reset()` and from chainable mutators. Return explicit booleans, values, or `undefined` when those semantics are more meaningful.
- A class that registers a global hook or browser listener must have an explicit, tested ownership and cleanup path unless it is a process-lifetime singleton.
- Do not remove or bypass `Point`, `Vector`, or another public value type merely because current code could use a plain object. Preserve semantic types where they clarify contracts and extension points.

## Naming and API contracts

- Prefer short, concrete names that describe observable behavior. Avoid unexplained abbreviations and redundant prefixes such as `get` when a noun or predicate is clearer.
- Boolean queries use readable predicates such as `can()`, `doing()`, `active()`, `viewable()`, `grounded()`, `maxed()`, `full()`, or `depleted()`.
- Mutating verbs should describe the mutation: `set`, `reset`, `add`, `remove`, `clear`, `resize`, `rescale`, `integrate`, `reposition`, or `destroy`.
- Hook names use the `Class.method` form with the owning class and lifecycle event capitalized exactly, for example `Player.jump` or `Room.loaded`.
- Keep units visible in names or documentation whenever a number could be ambiguous. Durations are milliseconds unless explicitly converted to seconds; velocity is logical pixels per second; acceleration is logical pixels per second squared.
- Preserve backward-compatible room tokens and public method behavior unless a deliberate breaking change is approved, documented in `CHANGELOG.md`, and covered by migration or compatibility tests.

## Time, physics, and rendering

- Use `Time.now` as the shared monotonic engine clock.
- Use `Time.step` as the bounded gameplay timestep and `Time.seconds()` when physics requires elapsed seconds.
- Do not read `performance.now()`, `Date.now()`, animation-frame timestamps, or device pixel ratio directly inside gameplay mechanics. Clock ownership belongs to `Time` and `Frame`; `Time.epoch()` is only for explicit wall-clock needs.
- Keep physics independent of refresh rate. Test timing-sensitive behavior at 30, 60, and 120 Hz when practical.
- Gameplay coordinates use logical pixels. Device pixel ratio belongs only to `Screen` and `Buffer` backing-store rendering and must not affect gameplay speed, forces, collision, camera bounds, or room dimensions.
- Keep motion two-dimensional unless a feature explicitly introduces depth mechanics. Do not apply X or Y velocity to Z as a convenience.
- Preserve numeric density and mass values. Collision may currently treat nonzero density as solid, but material magnitudes remain part of the data model.
- Use `Kinematics.displacement()` for a scalar velocity-to-distance conversion and `Kinematics.integrate()` to apply a velocity vector to a position over elapsed seconds.
- Camera defaults belong under `Settings.components.camera`; axis placement for undersized rooms belongs under the `alignment` object.

## JavaScript formatting

- Use tabs for indentation and spaces for visual alignment within an indentation level.
- Use tabs or spaces to column-align adjacent assignments, object values, imports, arguments, and operators when the surrounding code follows that pattern.
- Put spaces inside parentheses, brackets, and inline object braces: `method( value )`, `[ value ]`, and `{ key: value }`.
- Put a space before an opening brace and keep `else` on the same line as the preceding closing brace.
- Use single quotes for JavaScript strings and template literals only when interpolation or multiline content is useful.
- Terminate statements and `return` expressions with semicolons. Run the repository linter rather than guessing about edge cases.
- Include trailing commas in multiline arrays, objects, argument lists, and parameter lists where the existing style permits them.
- Break multiline method parameters and logical expressions in the established vertical style; prioritize scanability over minimizing line count.
- Keep comments concise, grammatical, and current. Delete misleading comments when behavior changes, but do not delete useful documentation merely to reduce noise.
- Do not reformat unrelated code. Preserve intentional alignment and the user's unrelated work.

## Documentation requirements

- Document every class, public property, constructor, and method with JSDoc.
- Every method document must state its purpose, all parameters, return type and meaning, relevant units, defaults that affect callers, and important side effects or lifecycle constraints.
- Document private or internal helpers when their invariants are not obvious from the implementation.
- Describe what a method means in the engine, not merely restate its name. For example, explain that integration mutates position by velocity multiplied by elapsed seconds.
- Preserve useful historical or conceptual documentation when refactoring. Update it to match the new model instead of removing it wholesale.
- Keep `README.md`, `CHANGELOG.md`, settings comments, and API documentation synchronized with behavior and terminology.
- Add user-visible and engine-visible behavior changes to the `Unreleased` section of `CHANGELOG.md` in the same change.

## Testing requirements

- Every class and every public method must have a focused automated test.
- Cover success, inert/default, boundary, invalid-input, and cleanup behavior where those branches exist.
- Every fixed bug requires a regression test that fails for the original behavior.
- Prefix each test with a one-line JSDoc contract in the form `/** Contract: … */`.
- Prefer observable state and return values over implementation-only assertions. Test hook registration and removal when lifecycle ownership matters.
- Use the shared browser environment in `tests/helpers/browser.mjs`; extend its spies narrowly when a browser interaction needs observation.
- Keep tests deterministic. Control `Time.now` and `Time.step` directly instead of sleeping or relying on wall-clock timing.
- Restore mutated singleton methods and state within a test when later tests in the same file could observe them.
- Run `sh tools/test.sh` and `sh tools/lint.sh` after code changes. Run the coverage command used by CI for broad changes.
- Do not lower coverage floors, skip tests, weaken assertions, or expand exclusions merely to make a change pass.

## Git, review, and repository hygiene

- Start by inspecting the current branch, worktree, and relevant history. Treat existing changes as user-owned; do not overwrite, stash, reset, or commit unrelated work.
- Keep one coherent effort per commit and branch. Use clear, imperative commit subjects consistent with the repository history.
- Name branches for their intent with `feature/`, `fix/`, `maintenance/`, `docs/`, `tests/`, or `release/`, followed by a concise kebab-case topic. Do not encode the author, agent, editor, or tool identity in branch names; prefixes such as `codex/` are not used for new work.
- Cryptographically sign every commit. Verify the resulting signature before reporting completion.
- Never commit regenerated `tools/lint` changes unless the linter implementation itself intentionally changed. The lint and pre-commit scripts rebuild that tracked binary, so restore incidental binary changes after checks and commits.
- Keep the worktree clean at handoff unless the user asked to leave a draft uncommitted.
- Do not push, open or merge pull requests, change repository settings, or mutate GitHub issues without explicit user authorization.
- CI must remain green, but automated success is not a substitute for reviewing gameplay behavior, public API compatibility, documentation, and the actual diff.
- Update tests and documentation atomically with implementation changes.
