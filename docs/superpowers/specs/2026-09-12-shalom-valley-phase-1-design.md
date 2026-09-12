# Shalom Valley — Phase 1 design ("first playable")

_Status: approved by Tico 2026-09-12 (with additions). Route: `/shalom-valley`._

## Premise

A top-down pixel-art tycoon / defense game set in biblical times. Build a
village, grow and sell crops, house and protect villagers, pray, and push
the outer darkness off the map. Sin rises when you fail to protect the weak;
light (altar, houses, wells) pushes the darkness back.

## Decisions

| Topic | Decision |
| --- | --- |
| Art | Top-down pixel art, 16×16 tiles, 16×24 characters. Every sprite is a text pixel map in code, palette-swapped at load. No binary assets. |
| Engine | Phaser 3 (3.90), loaded only on the game route. React handles all menus/HUD as overlays; Phaser handles world, entities, in-world speech bubbles, input. |
| Saves | Browser (localStorage), versioned, autosave every 30 s + on tab-hide. Cloud saves are Phase 2. |
| Offline | Elapsed time on return (cap 8 h) grows crops and accrues rent at 50 %. No raids while away. "While you were away" summary. |
| Platform | Desktop first (keyboard + mouse). Touch controls Phase 2. |
| Identity | Skin tone (6) + hair style (3) × color (4) instead of labeled races. |
| Theme safety | Antagonists are in-world: idols, false prophets, spirits. Nothing that reads as a real modern religion. |

## Character creator

Man / Woman · 6 skin tones · 3 hair styles × 4 colors · 3 faces · 3 bodies
(slim / average / broad) · 3 outfits (shepherd tunic, merchant robe, warrior
leather) · name. React UI with a live 4× canvas preview using the same pixel
layers the game composites.

## Controls

WASD / arrows move · Space or click: sword swing (facing direction) · **E**:
pray — hold near the altar to refill; tap elsewhere to *cast out* (spends
prayer, banishes spirits in a radius, redeems fallen villagers) · **F** eat ·
**B** build menu · **K** skills · **Esc** pause.

## Meters (HUD)

Health · Hunger · Prayer · Coins · Population / capacity · Sin (0–100,
village-wide) · Day + clock · Darkness pushed back % · Player level + XP +
unspent skill points.

## Day / night

Day ≈ 4 min, night ≈ 2 min. Day: farm, build, sell, eat, pray, smash idols.
Night: waves spawn at the fog edge. Wave size scales with day and population;
sin ≥ 50 adds extra enemies.

## Economy & buildings

| Building | Altar lvl | Effect |
| --- | --- | --- |
| Farm plot | 1 | Wheat, 3 growth stages, harvest → inventory |
| House | 1 | +2 capacity, spawns villagers, rent each dawn, small light |
| Wall | 1 | Blocks walkers (not spirits) |
| Market stall | 1 | Sell inventory; auto-sell toggle |
| Vineyard | 2 | Grapes, slower, worth more |
| Well | 2 | Small light, villagers recover, hunger relief |
| Watchtower | 2 | Auto-arrows at enemies in range |
| Lamp post | 3 | Cheap light only — pushes darkness |
| Altar upgrades | — | Lvl 1→4: bigger light, faster prayer regen, villager XP ×1 / ×1.5 / ×2 / ×3, unlocks above; lvl 4 lets lvl-5 villagers banish spirits |

Income: crop sales · rent · **protection bounty** per enemy defeated within
range of a villager · **idol destruction reward** · **false prophet bounty**.
Sin > 50 halves rent.

## Villagers

Spawn from houses; wander; walk to the altar by day to pray → XP (× altar
multiplier). Levels 1–5: earn more each level; lvl 3+ carry a staff and
fight robbers/tempters; lvl 5 banishes spirits (needs altar 4). Recover at
wells. Speech bubbles: greetings when the player passes, joy at dawn/harvest,
distress when enemies are near, anger at robbers, thanks when saved, grief
when someone falls.

**Falling:** a lvl-1 villager caught by an enemy falls — sin +8, they walk
toward the darkness for 6 s. Cast out (E) near them redeems them.
**Hypnosis:** a Deceiver within range for 3 s converts any villager (any
level) into a Deceiver. Kill the Deceiver first or cast out to break the
trance (partial progress resets).

## Enemies (gated so the player can win)

| Enemy | Unlock (day AND player lvl) | Behaviour | Counter |
| --- | --- | --- | --- |
| Robber | 1 / 1 | Melee, steals coins from player; damages villagers | Sword |
| Tempter | 2 / 2 | **No weapon, very fast.** Lures the lowest-level villager toward the fog; 4 s of luring = fall | Sword (fragile) |
| Deceiver | 4 / 3 | **No weapon.** Disguised as a villager (revealed in your light). Hypnotizes nearby villagers → converts them | Sword; cast out breaks trance |
| Spirit | 6 / 4 (+ altar 2) | Phases through walls, translucent, drains villager XP, hurts player. **Immune to sword** | Cast out only |
| False Prophet | 8 / 5 (+ altar 3) | Slow. Preaches (hate/deceit lines), plants an idol shrine that spawns tempters | Smash idol (8 hits); kill prophet |

## Player progression

XP from kills, harvests, sales, prayer, redemptions. Level up → +1 skill
point, small heal. Skills (3 ranks each): Swordsmanship (+damage),
Fleetfoot (+speed), Faith (+prayer max, +cast radius), Fortitude (+health,
slower hunger), Stewardship (+yield, +rent).

## Dialogue

`dialogue.ts` holds lines per speaker × mood: villager (greet, happy,
distress, anger, thanks, grief, pray), robber (taunt, hit, flee), tempter
(lure), deceiver (deceive, converted), spirit (whisper), prophet (preach,
anger), player (level up, low hunger, idol smashed). Bubbles show 2.5 s,
per-entity cooldowns keep it from spamming.

## Light vs darkness

Per-tile darkness = 1 − max light contribution; light sources have radii.
Fog is drawn as a tile overlay; enemies spawn on fog tiles nearest the edge.
Lit-tile ratio = "darkness pushed back %". 100 % → victory screen → endless.

## Architecture

```
app/shalom-valley/page.tsx          metadata, VideoGame JSON-LD, renders <ValleyApp/>
components/valley/
  valley-app.tsx                    creator ↔ game switch, load/save glue
  character-creator.tsx             React creator with canvas preview
  valley-game.tsx                   mounts Phaser (dynamic import), hosts HUD overlays
  hud.tsx  build-menu.tsx  skills-panel.tsx  dawn-summary.tsx  pause-menu.tsx
lib/valley/
  config.ts   types.ts   palette.ts   dialogue.ts   save.ts   bridge.ts
  sprites/{chars,buildings,tiles,enemies}.ts   textures.ts
  scenes/{BootScene,WorldScene}.ts
  world/{map,darkness,player,villager,enemy,building,waves,speech}.ts
```

React ↔ Phaser bridge: the scene pushes a state snapshot ~10×/s; React
sends commands (build, upgrade altar, spend skill, pause/resume, sell).

## Out of scope (Phase 2)

Accounts + cloud saves, touch controls, more ventures (flocks, fishing,
pottery, weaving), cosmetics for the store, live sponsor ads, leaderboards.
