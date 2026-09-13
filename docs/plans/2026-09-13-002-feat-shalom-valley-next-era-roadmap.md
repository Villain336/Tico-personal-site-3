---
title: Shalom Valley Next Era - Roadmap
type: feat
date: 2026-09-13
topic: shalom-valley-next-era
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: conversation
execution: code
---

# Shalom Valley Next Era — Roadmap

## Goal Capsule

- **Objective:** Grow Shalom Valley from a first-playable tycoon-defense into a modern top-down pixel game whose daily loop can later carry a realistic biblical society: resources, survival, money, law, war, and judgment.
- **Product authority:** This document sequences the remaining work. Each era is its own plan and PR. The first era shipped alongside this doc is Feel + first Survival (cinematic camera, parallax sky, thirst, flax, olives).
- **Open blockers:** None. Later eras stay deferred until the era before them is playable.

## Why this order

The last playtest still felt like a board: a locked zoom, a flat follow-cam, two crops, and hunger as the only body meter. Adding banks or a judgment engine on that presentation would still play like a prototype. Modern 2D pixel games (Stardew, Eastward, CrossCode) earn their weight from camera, parallax, and a daily survival loop first. Government and judgment then have something real to govern and judge.

True 3D camera rotation is out of scope. Every sprite is a 16×16 text pixel map; rotating the world would break the art contract. "Camera angles" here means look-ahead, cinematic zoom, elevation-aware framing, and parallax layers that shift with movement and time of day — the same trick those games use.

```
Feel + Survival  →  Village Economy  →  Society & Law  →  Combat & Wars  →  Divine Judgment
     (now)            (money, bank)      (laws, offices)    (bosses, drops)    (God, verdict)
```

Each era produces a playable valley. None of them require rewriting the Phaser ↔ React bridge.

## How This Work Fits Together

Existing plans already named these areas. This roadmap does not replace them; it sequences them and names what "done" means.

| Era | Owns | Already in the repo | This slice ships |
| --- | --- | --- | --- |
| 0. Cast & map | Recruits, quests, terrain, landmarks, prologue | Characters & Story; World & Arrival | done |
| 1. Feel + Survival | Camera, sky, thirst, more crops | Daily Bread listed "Feel" as independent | **this PR** |
| 2. Village Economy | Coin ledger, tithe, storehouse, bank, wages | Phase 1 coins + market + rent | **this PR** |
| 3. Society & Law | Town hall, edicts, courts, offices | Sin meter is the seed | **this PR** |
| 4. Combat & Wars | Gear, drops, Goliath, raids, banners | Enemy roster + unlock hooks | later |
| 5. Divine Judgment | The Judge, signs, verdicts, Exodus | Sin, blessing, Holy Ghost | later |

Jesus remains a reserved capstone recruit, not part of any era until Judgment.

---

## Era 1 — Feel & first Survival (this PR)

The valley should feel like a place you walk through, not a grid you pan over, and the body should need more than wheat.

### Camera (Feel)

- Replace `cameras.main.startFollow(player)` with a `CameraDirector` that follows a hidden focus point.
- Look-ahead: the focus leads the player in the current move direction (~38 px), decaying when idle.
- Cinematic zoom (lerped, pixel-rounded):
  - explore ~2.15
  - highland viewpoint slightly wider
  - landmark / quest talk / prayer tighter
  - dusk / night / dawn slightly wider
- Mouse wheel multiplies zoom (clamped). Scroll is persistent for the session.
- Dawn pulses a brief pull-back, then settles.
- Framing a quest-giver for a few seconds after E.

No camera roll. Pixel art + `roundPixels` plus rotation reads as shimmer.

### Sky (Feel)

- Screen-space sky behind the map (scroll factor 0) that shifts day → dusk → night.
- Sun and moon arc with the clock.
- Cloud layers and distant hill silhouettes with lower scroll factors so walking changes the background.
- Camera bounds open a little past the map so the northern horizon is visible.

### Survival (first resources)

- **Thirst** (0–100). Drains a little faster than hunger. Fortitude slows both. At 0, health ticks down. Eat does not refill it.
- Drink: tap E at a well, the Broken Cistern, or while standing in shallows. Shallows also sip slowly just by standing in them.
- **Flax** plot (altar 1): a third crop, sells well, eaten only as a last resort.
- **Olive grove** (altar 2): slower, restores hunger *and* a little thirst when eaten.
- Inventory, sell-all, auto-sell, granary bonus, offline growth, and villager harvest all treat the new crops as first-class.
- Ancient Olive landmark now caches olives.

Save schema becomes v4 (`thirst`, `olives`, `flax`). v3 saves discard, same as the last bump.

### Out of Era 1

Walk-cycle frames, screenshot mode, livestock, seasons, cooking, a waterskin item, banks, laws, Goliath as a fight, any judgment UI.

---

## Era 2 — Village Economy

The coin pile becomes a ledger.

- **Storehouse / granary books:** crops can be reserved (seed, tithe, sale, rations) instead of one number.
- **Bank (money changer):** deposit, withdraw, a small dawn interest, and a run on the bank if sin is high and a raid hits.
- **Wages & tithe:** villagers cost upkeep; the altar takes a tithe of sales. Charity lowers sin; hoarding while villagers hunger raises it.
- **Prices move:** night raids, drought (later), and market glut nudge wheat/grape/olive/flax prices.
- **Distribution:** a simple "share the bread" edict — feed the village from stores or watch rent and loyalty fall.

This era is what "money distribution" actually is. A bank with nothing behind it is a button.

## Era 3 — Society & Law

The village becomes a polity.

- **Town hall** building. Appoint a steward (or station a Big Recruit).
- **Edicts:** curfew, tithe rate, open gates, sanctuary, conscription. Each has a sin / loyalty / income tradeoff.
- **Laws as data:** a small table of statutes the player ratifies. Breaking them (player or villager) is a recorded offense.
- **Court:** at dawn, outstanding offenses are judged. Mercy, fine, exile. Moses' unlock later weights this.
- **Offices:** watchman, scribe, treasurer — jobs beyond wander/pray/fight.
- Government is local and visible. No nation-state sim. Wars in Era 4 read these edicts (open gates, conscription).

## Era 4 — Combat, Gear, Wars

The unlock hooks become real.

- **Drops:** robbers drop coins and scraps; prophets drop relics; bosses drop named gear.
- **Gear slots:** blade, wrap, lamp. David's blade stays the first named weapon.
- **Goliath:** a real world encounter after David's quest, not a flag. One arena, one pattern, one drop.
- **Raids:** a night can be a bannered raid (more enemies, a leader) instead of a trickle. Watchtowers and stationed recruits matter.
- **Wars:** later, a neighboring camp or idol city. The player musters (conscription edict), pays (bank), and either marches a short set-piece or defends a siege night.
- Baal / Moloch / the dragon stay on the boss list behind Goliath.

## Era 5 — Divine Judgment & Mysticism

The Judge arrives only after there is a society to judge.

- **Signs:** drought, extra night, a quiet dawn — keyed off sin, broken edicts, idols, and mercy.
- **The Book:** a persistent record of named souls (replaces visit-first-names). The Daily Bread letter starts quoting it.
- **Verdict:** a rare, telegraphed event. The valley is weighed. Outcomes: blessing (Era 1 Holy Ghost already hints at this), exile of the wicked, or a hard reset of the outer dark.
- **God** is never a player character and never an enemy. Presence is weather, voice, and verdict.
- Jesus, if recruited, is the capstone of this era — not a companion with a sword.

---

## Architecture (Era 1)

```
lib/valley/world/camera.ts     CameraDirector — look-ahead, zoom modes, wheel
lib/valley/world/sky.ts        Sky — parallax backdrop, sun/moon, clouds, hills
lib/valley/sprites/sky.ts      Pixel maps for sun, moon, cloud, hill
lib/valley/sprites/buildings.ts  FLAX + GROVE growth stages
lib/valley/config.ts           ZOOM_MODES, PLAYER.thirst*, CROPS.flax/olives
lib/valley/types.ts            CropKind, thirst, olives, flax, nearDrink
```

React HUD grows a thirst meter and two inventory icons. Phaser still owns the world; React still owns panels.

## Success Criteria (Era 1)

- Walking changes what the background is doing. Standing still, then holding a direction, visibly leads the camera.
- Approaching a landmark or holding E at the altar tightens the shot; night widens it.
- A new valley has a thirst bar. Ignoring wells and the river weakens the player. Drinking recovers them.
- Flax and olive grove appear in the build menu, grow, harvest, sell, and persist across a save.

## Outstanding Questions (later eras)

- Exact bank interest and tithe rates (Era 2).
- Which Big Recruits may hold offices (Era 3). Moses as law-weight is the current leaning.
- Whether a "war" is a single siege night or a short away-mission (Era 4).
- How loud the Judge's voice is allowed to be (Era 5).
