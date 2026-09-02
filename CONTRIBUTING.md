# Contributing to Sixarata

Thank you for helping Sixarata become a playful, understandable platform-game engine.

## Before changing code

Read [AGENTS.md](AGENTS.md). It is the canonical implementation contract for humans and coding agents, including architecture, class shape, naming, formatting, documentation, testing, physics, timing, Git, and review requirements.

For substantial work, open or comment on an issue with the problem, observable outcome, and acceptance criteria. Small fixes and documentation improvements can go directly to a pull request. Security vulnerabilities must follow [SECURITY.md](SECURITY.md), and support questions belong in the channels described by [SUPPORT.md](SUPPORT.md).

## Run Sixarata

Sixarata has no runtime package dependencies. Use Node.js 24 for tests and any static HTTP server for the game:

```sh
http-server -c-1 -a 127.0.0.1
```

Then visit `http://127.0.0.1:8080`.

## Verify a change

Enable the repository's pre-commit hook once per clone. It checks only staged `.js` and `.mjs` files for the project's semicolon policy:

```sh
git config core.hooksPath .githooks
```

```sh
sh tools/test.sh
sh tools/lint.sh
```

Add or update tests and documentation with the implementation. Exercise player-visible changes in a browser, include visual evidence when useful, update `CHANGELOG.md`, and sign every commit.

Keep pull requests focused and wait for all required checks before merge. AI-assisted contributions are welcome, but contributors remain responsible for understanding and reviewing the resulting code.

By contributing, you agree that your contribution is licensed under the repository's [MIT License](LICENSE).
