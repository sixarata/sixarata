```
  ■  □  ■   ■    ■    ■ ■      ■    ■ ■ ■    ■
■    ■    ■    ■   ■  ■   ■  ■   ■    ■    ■   ■
  ■  ■    ■    ■ ■ ■  ■ ■    ■ ■ ■    ■    ■ ■ ■
■    ■  ■   ■  ■   ■  ■   ■  ■   ■    ■    ■   ■
```

sixarata is an open-source 2D adventure game engine.

[![CI](https://github.com/sixarata/sixarata/actions/workflows/ci.yml/badge.svg)](https://github.com/sixarata/sixarata/actions/workflows/ci.yml)

It is MIT licensed, coded entirely in vanilla JavaScript, and uses no external libraries or dependencies.

Fork it as a head-start for your own ideas, to educate others, or just to boop around for a bit.

## run it

```bash
git clone git@github.com:sixarata/sixarata.git
cd sixarata
npm install -g http-server
http-server -c-1
```

Visit: http://127.0.0.1:8080

## test it

Sixarata's unit tests use Node's built-in test runner and have no dependencies.

```bash
sh tools/test.sh
```

Profile Room parsing, cached-layout reconstruction, complete Layer redraws,
production fixed-camera Layer caching, and moving-Camera invalidation using the
same deterministic workload before and after an engine change:

```bash
node tools/profile.mjs
```

Reported durations are diagnostic and intentionally have no machine-dependent
pass threshold. The test suite verifies the workload and operation counts.

For real Canvas timings, open `/?profile=renderer`. The result is logged and
retained as `globalThis.SixarataProfile`; use `frames` to change the default 300
recorded frames per strategy.

## physics units

Game settings express spatial design values in tiles, tiles per second, and
tiles per second squared. `Screen.unit()` converts them to the logical pixels,
pixels per second, and pixels per second squared used by runtime physics.
Device pixel ratio is confined to canvas rendering and does not affect world
scale or simulation speed.

## engine objects

`Entity` provides non-spatial state and collection lifecycle. Renderable,
physical `Tile` objects extend it with geometry, visibility, collision, and
camera-relative drawing; players, enemies, projectiles, and room fixtures then
specialize `Tile`.

## contribute

Fork. Jam. Discuss. Merge. Repeat.

All are welcome. Intolerance is not tolerated.

Read the [implementation requirements](AGENTS.md), [contribution guide](CONTRIBUTING.md), and [code of conduct](CODE_OF_CONDUCT.md) before submitting a change.

## inspiration

Roguelikes. Metroidvanias. Megas. Contras. Guacs. Plumbers. Knights. Dragons. Fighters. Fantasies.

Double jumps. Wall jumps. Speed boosters. Frying pans. Portals. Time control. Grappling hooks. Whips. Turkey dinners. Boss fights. Doors. Keys. Health. Lives. Dungeons. Biomes.

Ups. Downs. Lefts. Rights.

Killer tracks. Bloopy effects. Challenging puzzles. Saving frames. Saving animals.

Your favorite platforming games are our favorites, too.

## principles

Simplicity. Fun. Learning. Experimentation. Growth.

Consideration. Compassion. Collaboration.

## goals

* Enable everyone to see their name in the credits of an iconic video game.
* Provide open source versions of every cool platform game mechanic that has made you think differently about the world.
* A million project forks, recommending changes back into it, forging a monolithic platforming masterpiece & encyclopedia.
* Share the success of these achievements with the entire world.

## why

We love games.
Games that start simple but are exquisitely robust and easily enjoyed by all audiences without barriers.
Sharing, learning, teaching, experimenting, and the freedom to do these things freely forever.
JavaScript (and the Web) are currently the simplest & most accessible to the widest audience.

## what

"sixarata" backwards is "ataraxis": the absence of mental stress or anxiety.
The best games balance thrills with chills, and that is a design priority in this project.
