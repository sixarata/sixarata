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

Layers present one ordered list of child Layers and live collection references.
The shared `Draw` service exposes the active `buffer` and logical `viewpoint`
while each synchronous rendering pass runs; other data is ignored by rendering. `visible` controls presentation only. `buffered: false` (the fifth
constructor argument) draws directly without allocating a canvas; buffered Layers
allocate on resize or first render.
Room preserves collection identities when clearing and loading rooms.
Room lifecycle and Layer rendering passes snapshot each group when reached:
surviving starting members run once, removed members are skipped, and additions
wait until that group's next pass. Membership changes during rendering keep the
Layer cache stale. `Tile.removed` invalidates the previous group's Room layer on
removal, reassignment, or destruction; `Tile.destroy` remains a destruction event.
Direct collection edits outside rendering still require explicit invalidation.
An optional drawing host can override the inherited `viewpoint`.

Build a presentation tree through `add()` and `remove()`. Each Layer has one
managed parent and ordered children. `add()` accepts a Layer or a collection,
appends it once by identity, and invalidates the composition. Layer children move
from their previous parent with cycle checks; collections remain shared references:

```javascript
const scene = new Layer( view, 'scene', [], false, false );
const actors = new Layer( null, 'actors', [ players, enemies ], false, false );
scene.add( backgrounds ).add( actors ).add( foregrounds );
scene.render();
scene.remove( actors );
```

Root Layers may receive a drawing host such as View through the constructor or
`set()`, or inherit the current Draw scope when their host is null. Initial `children` (the third argument) use the same attachment rules as
`add()`. `parent` is read-only; `children` returns an ordered snapshot whose
collection references remain live. Layers and collections render in insertion
order, so they can be interleaved without additional wrappers.

`groups` has been removed. Read `children` to inspect presentation entries, and
replace `groups.push( collection )` with `add( collection )`; remove entries through
`remove()`. Existing constructor lists of collections remain valid. Invalid initial
entries now throw before reconfiguration instead of being silently filtered.
Collections retain their simulation membership and may be referenced by multiple
Layers. Collection members with render methods draw normally; data, nested arrays,
and unmanaged Layer references are ignored. Attach Layers directly to establish
presentation parentage. This is a tree of Layers with collections as leaves, not
recursive traversal of arbitrary arrays.

Direct Layers borrow the active destination during rendering and allocate no
canvas. Buffered Layers compose their own surfaces into that destination.
Tiles and the optional Debug renderer use `Draw.buffer` and `Draw.viewpoint`;
they have no permanent Layer reference and need no Buffer argument. Drawing a
Tile outside a Draw scope is inert. `Draw.use( buffer, viewpoint, callback )`
selects a synchronous scope and restores the previous state even after failure.
Draw is a shared instance, like Time; replace `new Draw()` with the imported Draw.

Room parses layouts and owns simulation collections plus its ordered presentation
Layers. It owns no Buffer: `Room.render()` scopes the View destination and Camera
viewpoint, then composites each Layer directly into View from back to front.
Each buffered Layer owns an independent surface. View clears its own destination
during update. Replace custom `Room.buffer` drawing with scoped `Draw.buffer`
drawing; the former Room buffer lifecycle hooks have been removed.

Scoped viewpoints separate rendering from the simulation Camera and provide the
basis for future per-Layer parallax. Parallax factors and room-layout declarations
for them are not implemented yet.
Invalidation bubbles through managed Layer parents. Cached ancestors check visible
children before reusing pixels, so live or direct descendants require ancestor
redraws. Hiding a child invalidates the old composition, then allows reuse while
that child stays hidden. Nested Layers inherit the host's logical viewpoint.

Removing a Layer detaches it without destroying its buffer or descendants.
Removing a collection releases only that reference; its members remain untouched. Reset, reconfiguration, and destruction detach the Layer from
its parent and detach its children without destroying them; call these outside
rendering. Child traversal snapshots at pass start, skips detached children, and
defers new children until the next pass. Direct edits to content collections still
require explicit invalidation of each affected cached Layer.

`Settings.debug` enables the content-level `Debug` renderer at startup. It owns
one `Tile.render` listener and draws each rendered Tile's Collide envelope in the
active Layer scope. Collide owns no rendering hooks, color, opacity, Camera, or
Draw dependency. `Collide.bounds()` returns world-space diagnostic geometry;
its padded envelope is not the exact candidate-dependent rejection region.
Replace `collide.debug`, `render()`, and `visualize()` calls with Debug controls;
`debug.set( false )`, `reset()`, and `destroy()` remove its listener. Changing
Settings.debug after startup does not reconfigure an existing Debug instance.

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
