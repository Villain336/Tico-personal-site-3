---
title: Shalom Valley Combat, Gear, and Goliath
type: feat
date: 2026-09-13
topic: shalom-valley-combat-gear
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: conversation
execution: code
---

# Shalom Valley — Combat, Gear, Goliath

## Goal Capsule

- **Objective:** Make Era 4's first combat loop playable: gear slots, enemy drops, armor, deeper skills, David's blade as a real weapon, and Goliath as a world boss.
- **Out of scope:** Wars, sieges, raid banners, Baal / Moloch / the dragon, scrap-crafting shops.

## Locked slice

1. Gear slots: blade, wrap, lamp. Bag holds extras. Scraps and relics are counts.
2. Drops on kill. Robbers drop scraps and occasional wraps/blades. Prophets drop a relic and sometimes a lamp. Goliath always drops his mail.
3. David's quest equips `davidsBlade`. Sword math reads the blade, not only the unlock flag.
4. After that quest, the next night (or the current night) spawns Goliath once. He stays through dawn until defeated.
5. Skills cap at 5. New skills: Ward (damage reduction) and Hunter (bounty / drops).
6. Gear panel on `I`. HUD shows equipped names, scraps, relics, and a Goliath health bar.

Save schema becomes v9.
