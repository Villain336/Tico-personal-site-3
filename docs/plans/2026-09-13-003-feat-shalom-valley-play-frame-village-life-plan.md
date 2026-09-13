---
title: Shalom Valley Play Frame and Village Life - Plan
type: feat
date: 2026-09-13
topic: shalom-valley-play-frame-village-life
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# Shalom Valley Play Frame and Village Life - Plan

## Goal Capsule

- **Objective:** Make `/shalom-valley` a full-viewport play surface with no page scroll to see the game, then add one village-life loop: temple sacrifice, a loom that makes clothes, and a richer sky.
- **Product authority:** This plan owns the play frame and the first Village Life slice. It does not own Combat & Wars, Divine Judgment, or a second pass of shops.
- **Open blockers:** None.
- **Execution profile:** Two PRs. Slice A (U1) ships the play frame first and is immediately playable. Slice B (U2–U4) ships Village Life on a save bump.
- **Tail ownership:** U1 owns site chrome on this route. U2 owns sin-for-gift math. U3 owns cloth and outfit. U4 owns sky art only.

## Product Contract

### Summary

While a session is open, the valley fills the browser. Site header collapses. Marketing, how-to, enemy list, and FAQ leave the play viewport. The player then gets a temple that can take a gift to lower sin, a loom that turns wool and flax into a wearable tunic, and a sky with more cloud layers.

### Problem Frame

The Phaser view is 960×600. The page still stacks a sticky site nav, a `PageHeader`, a `max-w-5xl` frame, instruction copy, three marketing sections, and a tall footer. Seeing the HUD means scrolling. After the living-covenant slice, the next fun gap is daily village life, not Goliath.

### Product Contract preservation

Product Contract written here. No upstream requirements-only plan. Roadmap context: `docs/plans/2026-09-13-002-feat-shalom-valley-next-era-roadmap.md`. This plan inserts Village Life after Society & Law and before Combat & Wars.

### Key Decisions

- **Collapse chrome while a session is open.** (session-settled: user-directed — chosen over keeping the marketing page under the game: the playtest failed on scroll, not on missing FAQ.) Governs R1, R2, R3.
- **Strip the visible "is" and how-to chrome from play.** (session-settled: user-directed — chosen over leaving FAQ under the canvas: that copy includes "Is this a religious game?" and forces scroll.) Governs R4.
- **Fill the remaining viewport so the whole frame is on screen.** (session-settled: user-directed — chosen over the current `max-w-5xl` card: FIT scale cannot show 960×600 if the parent is short.) Governs R5, R6.
- **Village Life after the frame, not Combat.** Governs R7–R14.
- **One temple, one loom, sky polish.** Chosen over a full shop district and a fashion system so Slice B stays one playable loop. Governs R8–R14.

### Actors

- A1. Player in a session — creator or live valley.
- A2. Returning visitor on `/shalom-valley` — same URL, play-first chrome.
- A3. Search crawler — still receives VideoGame + FAQ JSON-LD.

### Requirements

**Play frame**

- R1. When `ValleyApp` is in creator or game, the site nav is a single compact bar. Other site links live behind that bar.
- R2. The compact bar height stays small enough that a 1366×768 desktop can still fit an 8:5 game plus HUD without a document scroll.
- R3. The site footer and the Ask Tico launcher are hidden for the duration of a `/shalom-valley` session.
- R4. `PageHeader`, instruction paragraph, How the valley works, Who's out there, and FAQ are not in the play viewport. Copy stays in `content/valley.ts` for JSON-LD and an About drawer on the compact bar.
- R5. The Phaser parent is the largest 8:5 rectangle that fits in the remaining viewport. `max-w-5xl` and `pb-20` do not wrap the live game.
- R6. On a desktop viewport at or above 1280×720, the canvas, overlaid HUD, and dawn/pause chrome are visible without scrolling the document.

**Village Life**

- R7. Village Life does not add bosses, named gear, raids, or Goliath.
- R8. The player can build a Temple (altar level 3, 2×2, enterable). The standing altar stays the pray / light / upgrade building.
- R9. At the Temple, the player may offer a listed gift. Each accepted gift lowers `sin` and cannot drop it below 0.
- R10. Gifts are capped at two accepted offerings per dawn so sacrifice cannot erase the sin meter.
- R11. God is never a unit. Jesus is not added. Copy is "a gift at the temple," not atonement by a character.
- R12. The player can build a Loom (altar level 2, enterable). One recipe: 2 wool + 2 flax → 1 tunic.
- R13. Wearing a tunic sets `character.outfit` to a new linen index and rebuilds the player texture. Extra villager looks may use the new palette rows.
- R14. The sky gains a third cloud map, more drifting sprites, and two depth bands. No rain, seasons, or 3D camera.

### Flows

- F1. Open `/shalom-valley` with a save → compact chrome, full play frame, no marketing stack. Covers R1–R6.
- F2. Compact bar → About → FAQ answers, including the religious-game line, without leaving the route. Covers R4.
- F3. Build Temple → enter → hold E → pick a gift → sin falls, toast names the gift. Covers R8–R11.
- F4. Gather wool and flax → Loom → craft tunic → wear → player sprite changes and persists. Covers R12, R13.

### Acceptance Examples

- AE1. Desktop 1366×768, save present: `document.documentElement.scrollHeight` is within 8px of `window.innerHeight`. The HUD meters stay on screen. Covers R2, R5, R6.
- AE2. About drawer closed: no visible node contains "Is this a religious game?" or "How the valley works." JSON-LD in the page source still lists those FAQ strings. Covers R4.
- AE3. Sin 12, first wheat gift of the day: sin becomes 9. Third gift the same day is refused with a toast. Covers R9, R10.
- AE4. New game, wear a crafted tunic, refresh: the linen outfit is still on the player. Covers R13.

### Success Criteria

- A 1366×768 playtest of a live save shows the full game without scrolling.
- A player can lower sin at a Temple and put on a crafted tunic in one session.
- Clouds read as layered weather, not five identical sprites.

### Scope Boundaries

**In**

- Compact site chrome and play-sized Phaser parent on `/shalom-valley`.
- About drawer for the existing marketing/FAQ copy.
- Temple, sacrifice table, loom recipe, two new outfit color rows plus one linen `outfitStyle`, sky cloud pass.

**Deferred**

- Oven, inn, second shop, wardrobe UI, weather simulation, walk-cycle frames.
- Era 4 Combat & Wars and Era 5 Divine Judgment.

**Outside this product's identity**

- True 3D camera rotation.
- God as a player or enemy.
- Jesus as a recruit.

### Dependencies

- Living-covenant work on interiors, flocks, wool/flax inventory, and Civic must stay in the stack Slice B builds on.
- Slice A may land on the same stack or on Society & Law if interiors are not required for layout.

## Planning Contract

### Assumptions

- "Remove the text about is" means hide How / Enemies / FAQ (including "Is this a religious game?") from the play viewport, not delete SEO copy.
- Compact chrome applies to creator and game, not only after the first step in-world.
- The repo has no test runner. Slice B proves gift and craft math with small Node built-in tests if the runtime supports them; otherwise production playtest plus `tsc` is the gate.
- Portrait phones will letterbox an 8:5 frame. That is acceptable. Touch controls stay deferred.

### Key Technical Decisions

- KTD1. Stay on `/shalom-valley`. Do not add `/shalom-valley/play`. (session-settled: user-directed — chosen over a second URL: the live game is the page.) Governs R1–R6.
- KTD2. `ValleyPlayShell` sets `document.documentElement.dataset.valleyPlay` while creator or game is up, and clears it on unmount. `app/globals.css` hides footer and Ask Tico and shortens the sticky header under `html[data-valley-play]`. `Nav` may still read the flag for the Site / About controls. Do not wrap `app/layout.tsx` in a client provider. Governs R1, R3.
- KTD3. Size the Phaser parent with `min(100vw, remainingHeight * 8/5)` by `min(remainingHeight, 100vw * 5/8)`, where `remainingHeight` is `100dvh` minus the compact bar. Keep Phaser `Scale.FIT` and `VIEW_W`/`VIEW_H` at 960×600. Governs R5, R6.
- KTD4. Temple is a new `BuildingType`, not an altar skin. Altar keep pray, light, and upgrade. Governs R8, R11.
- KTD5. Sacrifice is a pure helper in `lib/valley/world/worship.ts` with a fixed gift table and a per-dawn counter on save. Governs R9, R10.
- KTD6. Clothes are one new `outfit` index plus two `OUTFITS` rows. Do not add a wardrobe array. Governs R13.
- KTD7. Slice B bumps `SAVE_VERSION` to 8. Missing `cloth`, `templeOffersToday`, and unknown building types drop the save the same way prior bumps do. Slice A does not bump. Governs R12, R13.

### High-Level Technical Design

```
Root layout stays a server tree. Shell sets html[data-valley-play].
CSS shortens Nav and hides Footer + AskTico. JSON-LD stays on the page.
ValleyPlayShell: dataset flag + About drawer + ValleyApp
  ValleyApp: creator | game
    ValleyGame: largest 8:5 parent + overlay HUD

Slice B world:
  BUILDINGS.temple / BUILDINGS.loom
  Interiors ENTERABLE += temple, loom
  worship.offer(save, gift) -> sin, stores, toast
  craft.weave(save) -> cloth; wear -> character.outfit + texture
  Sky: 2 bands, 8-10 clouds, sky_cloud_c
```

Phaser still owns the world. React still owns panels and chrome. `bridge.ts` grows offer / weave / wear commands.

### Implementation Constraints

- Do not change `MAP_SEED`.
- Do not replace `Landmarks` / `LANDMARKS`.
- Keep 16×16 (or existing 32×32 building) text pixel maps.
- Unused build hotkeys after `,` and `.` : `'` for temple, `/` for loom.
- Verify Slice A on production `next start`, not automated Chrome against `next dev` (HMR has hung the opening-save frame).

### Sequencing

1. U1 play frame. Ship and playtest. No save bump.
2. U2 temple + sacrifice.
3. U3 loom + clothes. Same save bump as U2.
4. U4 sky. No new save fields. May merge into the Slice B PR.

U3 may start after U2's types land. U4 may run in parallel with U2.

## Implementation Units

### U1. Play frame

- **Goal:** The live valley fills the viewport. Marketing chrome is gone from play.
- **Requirements:** R1–R6, F1, F2, AE1, AE2
- **Files:**
  - `app/shalom-valley/page.tsx`
  - `app/globals.css`
  - `components/valley/valley-play-shell.tsx` (new)
  - `components/valley/valley-app.tsx`
  - `components/valley/valley-game.tsx`
  - `components/valley/character-creator.tsx` (only if the creator still assumes a card width)
  - `components/nav.tsx`
  - `content/valley.ts` (About drawer reuses existing strings)
- **Approach:**
  - Replace the page body with json-ld + `ValleyPlayShell`.
  - Shell reports play (creator or game) and hosts the About drawer.
  - Compact nav: logo, RadioDock, About, a Site menu. CSS under `html[data-valley-play]` drops header padding to a ~40px bar.
  - Same selector hides footer and Ask Tico. Do not edit those components unless the CSS hook is missing.
  - `ValleyGame` wrapper drops `rounded-3xl` / `max-w` card chrome. Parent uses the KTD3 box. Overlay HUD stays absolute.
  - Do not change Phaser config except parent size.
- **Dependencies:** None.
- **Test scenarios:**
  - T1. 1366×768, existing save: no document scroll; HUD visible. AE1.
  - T2. About open shows FAQ; About closed hides "Is this a religious game?" AE2.
  - T3. Creator mode uses the same compact chrome. R1.
  - T4. Home and other routes keep full nav and footer.
  - T5. Resize from 1920×1080 to 1280×720: game stays 8:5 and inside the viewport.
- **Verification:** Headed `next start`. `npx tsc --noEmit`. `npm run lint`. `npm run build`.

### U2. Temple and sacrifice

- **Goal:** A Temple takes a capped gift and lowers sin.
- **Requirements:** R7–R11, F3, AE3
- **Files:**
  - `lib/valley/config.ts`
  - `lib/valley/types.ts`
  - `lib/valley/save.ts`
  - `lib/valley/world/worship.ts` (new)
  - `lib/valley/world/interiors.ts`
  - `lib/valley/sprites/buildings.ts`
  - `lib/valley/textures.ts`
  - `lib/valley/scenes/WorldScene.ts`
  - `lib/valley/world/player.ts`
  - `lib/valley/bridge.ts`
  - `components/valley/build-menu.tsx`
  - `components/valley/hud.tsx` (near-prompt if needed)
- **Approach:**
  - Add `temple` to `BuildingType` and `BUILDINGS` (cost ~90, altar 3, light 4, size 2, hotkey `'`).
  - Enterable pocket room titled "the temple."
  - Gift table in `worship.ts`: wheat 4 → −3 sin; 8 coins → −3; 1 meat or 2 wool → −6; 20 coins + 2 wheat → −10.
  - Persist `templeOffersToday`. Reset at dawn next to other dawn ledgers.
  - Hold E inside the temple or at its outdoor door to offer. Reuse the altar hold pattern. Prompt lists affordable gifts.
- **Dependencies:** Living-covenant interiors and inventory. Prefer U1 shipped so playtest is honest.
- **Test scenarios:**
  - T6. Cannot build temple before altar 3.
  - T7. Enter / leave temple with E. G still opens Civic.
  - T8. Wheat gift: stores fall, sin falls, toast. AE3.
  - T9. Third gift same day refused. AE3.
  - T10. Gift never sets sin below 0.
  - T11. No new character named God or Jesus appears.
- **Verification:** Playtest on `next start`. Typecheck. If Node strip-types tests are available, add `lib/valley/world/worship.test.ts` for T8–T10.

### U3. Loom and clothes

- **Goal:** Wool and flax become a tunic the player can wear.
- **Requirements:** R12, R13, F4, AE4
- **Files:**
  - `lib/valley/config.ts`
  - `lib/valley/types.ts`
  - `lib/valley/save.ts`
  - `lib/valley/palette.ts`
  - `lib/valley/sprites/chars.ts`
  - `lib/valley/textures.ts`
  - `lib/valley/world/craft.ts` (new)
  - `lib/valley/world/interiors.ts`
  - `lib/valley/sprites/buildings.ts`
  - `lib/valley/scenes/WorldScene.ts`
  - `components/valley/character-creator.tsx` (optional linen swatch)
  - `components/valley/hud.tsx`
- **Approach:**
  - Add `loom` (cost ~40, altar 2, size 2, hotkey `/`). Enterable.
  - `cloth` count on save. Recipe 2 wool + 2 flax → 1 tunic (`cloth += 1`).
  - Wear consumes 1 cloth and sets `outfit` to linen (index 3). Register a fourth `OUTFITS` row and an `outfitStyle` 3 map (longer hem, no warrior trim).
  - Rebuild player canvas after wear the same way creator start registers textures.
  - HUD shows cloth next to wool.
- **Dependencies:** U2 save-version bump (share v8). Fold wool already on the living-covenant save.
- **Test scenarios:**
  - T12. Recipe refuses when wool or flax is short.
  - T13. Wear changes the player sprite in-session. AE4.
  - T14. Refresh keeps the linen outfit. AE4.
  - T15. Creator can still pick shepherd / merchant / warrior. Linen may stay loom-only.
- **Verification:** Playtest. Typecheck. Optional `lib/valley/world/craft.test.ts` for T12.

### U4. Sky and clouds

- **Goal:** The horizon looks thicker without a weather sim.
- **Requirements:** R14
- **Files:**
  - `lib/valley/sprites/sky.ts`
  - `lib/valley/world/sky.ts`
  - `lib/valley/textures.ts`
- **Approach:**
  - Add `sky_cloud_c`. Spawn 8–10 clouds in two depth bands with different speeds and alpha.
  - Tint clouds toward dusk/night using the existing sky color lerp.
  - Do not add rain, wind gameplay, or extra hill rows unless a one-line gap remains after the cloud pass.
- **Dependencies:** None. Safe to merge with Slice B.
- **Test scenarios:**
  - T16. Walk east/west: nearer clouds slide faster than far clouds.
  - T17. Dusk and night change cloud tint. Day still reads as day.
- **Verification:** Visual playtest on `next start` at day, dusk, and night.

## Verification Contract

Repo scripts: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

Playtest host: `npm run build && npm run start`. Do not treat a hung "Opening your save…" on `next dev` under automated Chrome as a product bug.

Browser cases that must pass before Slice A is done: T1–T5.

Browser cases that must pass before Slice B is done: T6–T17.

Optional: `node --experimental-strip-types --test lib/valley/world/worship.test.ts lib/valley/world/craft.test.ts` when the environment's Node supports it. Do not add Vitest or Jest for this work.

There is no `release:validate` script.

## Definition of Done

**Global**

- Slice A: AE1 and AE2 pass on desktop. Other site pages still show full nav and footer.
- Slice B: AE3 and AE4 pass. R7 and R11 hold.
- Abandoned experiments (extra shops, rain, second URLs) are not in the diff.
- Each slice is committed, pushed, and on its PR before the next playtest loop.

**Per unit**

- U1: T1–T5 pass on `next start`.
- U2: T6–T11 pass.
- U3: T12–T15 pass.
- U4: T16–T17 pass.

## Risks

- Compact nav that is still ~72px tall will fail AE1 on 1366×768. Measure the bar; keep it near 40px.
- Hiding Footer via pathname only can flash the footer on first paint. Prefer the play flag plus a CSS `data-valley-play` rule in `app/globals.css`.
- Adding `temple` / `loom` to `BuildingType` without a save bump will crash old saves if the loader assumes a closed union. KTD7 owns the bump.
- New hotkeys `'` and `/` must not fire while Civic or other text fields are focused. Reuse the existing INPUT/TEXTAREA guard in `valley-game.tsx`.

## Sources

- Play-frame complaint and "remove the is text" from the living-covenant playtest.
- Current page stack: `app/shalom-valley/page.tsx`, `components/nav.tsx`, `components/footer.tsx`, `app/layout.tsx`.
- Game box: `components/valley/valley-game.tsx` (`aspect-[8/5]`, Phaser FIT, `VIEW_W`/`VIEW_H` in `lib/valley/config.ts`).
- Enterables: `lib/valley/world/interiors.ts`.
- Sin and altar: `SIN`, `ALTAR` in `lib/valley/config.ts`; pray hold in `lib/valley/scenes/WorldScene.ts`.
- Outfits: `lib/valley/palette.ts` `OUTFITS`, `lib/valley/sprites/chars.ts` `outfitStyle`.
- Sky: `lib/valley/world/sky.ts` (five clouds, two maps).
- Era order: `docs/plans/2026-09-13-002-feat-shalom-valley-next-era-roadmap.md`.
