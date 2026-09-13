---
title: Shalom Valley Characters & Story - Plan
type: feat
date: 2026-09-13
topic: shalom-valley-characters-story
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
---

# Shalom Valley Characters & Story - Plan

## Goal Capsule

- **Objective:** Give Shalom Valley a quest-driven cast — five named Big Recruits with their own biblical-story questlines, a roster the player can deploy (follow or station), and a lighter paid tier of scattered NPCs that unlocks as the player levels.
- **Product authority:** This plan owns the Characters & Story area only. Village Sim & Economy, Society & Government, Combat/Gear & Wars, and Divine Judgment & Mysticism — all raised in the same conversation — are not active scope here; see How This Work Fits Together.
- **Open blockers:** None. Every fork raised during dialogue was resolved; remaining open items are tuning-level and listed under Outstanding Questions as Deferred to Planning.

## Product Contract

### Summary

Five named characters — Moses, David, Paul, Noah, and the Holy Ghost — each stand in the world as a one-time quest-giver whose own hand-written questline echoes their biblical story. Completing a questline recruits that character permanently and flips one unlock hook (a weapon, building, ability, or — for David, whose questline is Goliath — the game's first boss-fight hook). Recruited Big Recruits join a roster panel where the player sends them to follow or to hold a station, and they can never fall, be lured, or convert. A separate, lighter tier of paid "scattered" NPCs unlocks as the player's own level rises, sharing the same roster mechanics but staying as vulnerable as ordinary villagers. Quest progress tracks in its own journal panel, kept apart from the existing daily ribbon.

### Problem Frame

Every villager today is anonymous: a `seed`, a `gender`, a `level` (`lib/valley/world/villager.ts:24-32`), and even the name shown in the away-letter is picked fresh from a shared pool each visit and never persisted (`pickVisitName`, `lib/valley/dialogue.ts:172-174`). Nothing in the game currently gives a character a fixed identity, a personal storyline, or a reason for the player to seek them out by name. There is also no quest system of any kind — no quest-giver, no objective tracking, no reward hook. The valley has buildings, crops, and combat, but no cast.

### Key Decisions

- **Hybrid character identity** — a small curated roster of named Big Recruits exists alongside a wider pool of promotable/payable scattered NPCs, rather than picking one model exclusively (session-settled: user-directed — chosen over named-roster-only or promoted-villagers-only: the user wants both a curated hero cast and a path for the general population to gain identity). Governs R1, R10.
- **Big Recruits are quest-gated and permanently exempt from harm; scattered NPCs are paid and stay vulnerable** (session-settled: user-directed — chosen over making both tiers behave identically: mirrors the original framing of "assemble a team by doing sidequest or paying"). Governs R2, R3, R6, R11, R12.
- **Unlock rewards are hooks only, not built content** — recruiting a Big Recruit flips a flag; the actual weapon, building, boss encounter, or ability is separate future work (session-settled: user-approved — chosen over designing the full payoff content now: keeps this plan inside Characters & Story; the deferred Combat/Gear and Village Sim areas own the real content). Governs R4, R5.
- **Roster deployment supports both Follow and Station** for every recruit except the Holy Ghost (session-settled: user-directed — chosen over a follow-only or station-only model). Governs R7, R8, R9.
- **The Holy Ghost has no companion form** — it applies its blessing directly on recruitment with no Follow/Station choice, distinguishing a spiritual unlock from a physical companion (session-settled: user-approved — the agent surfaced this fork in the scoping synthesis and the user did not redirect it). Governs R9.
- **David's questline is Goliath, and Goliath is added to the future boss roster** (session-settled: user-directed — the user named this explicitly when reviewing the unlock mapping, extending the boss list beyond the previously-named Satan/dragon/Baal/Moloch). Governs R4.
- **Quest tracking lives in its own journal, separate from the daily ribbon** (session-settled: user-directed — chosen over folding quest objectives into the existing ribbon: keeps the daily-rhythm surface from Daily Bread focused, and keeps multi-day quest state out of a UI built for single-day jobs). Governs R13, R14.

### How This Work Fits Together
<!-- ce-section: work-relationships -->

This plan owns Characters & Story: the five Big Recruits, their questlines, the roster, and scattered NPCs. The breakdown below is the current understanding of adjacent work from the same conversation, not a committed roadmap — a later brainstorm may revise, split, merge, or discard any of it.

- Combat, Threats & Gear — Enables: the actual weapon content and the Goliath boss encounter this plan's unlock hooks point to (R4, R5) land there.
- Village Sim & Economy — Enables: the building content Noah's unlock hook points to (R4, R5) lands there. Can proceed independently of this plan otherwise — crops, a town hall, and job assignment for ordinary villagers don't depend on recruits existing.
- Society & Government — Can proceed independently of this plan. Still to decide: whether recruited Big Recruits ever participate in law/government mechanics.
- Divine Judgment & Mysticism — Can proceed independently of this plan. Shares: the same biblical-figure theming this plan establishes for the roster.

### Actors

- A1. **Player** — controls the avatar; discovers Big Recruit quest-givers, completes their questlines, pays to recruit scattered NPCs, and manages the roster panel.
- A2. **Big Recruit** — one of Moses, David, Paul, Noah, or the Holy Ghost. Exists in the world (except the Holy Ghost) as a single named NPC with a visible quest marker, offering exactly one questline themed on their own biblical story; becomes a permanent roster member on completion.
- A3. **Scattered NPC candidate** — a named character that becomes payable once the player's level crosses that candidate's threshold; joins the roster on payment, no questline required.

### Requirements

**Big Recruits & Questlines**

- R1. The game ships exactly five named Big Recruits for this slice — Moses, David, Paul, Noah, and the Holy Ghost. Jesus is explicitly excluded from this batch, reserved for a later, likely capstone recruit.
- R2. Each Big Recruit except the Holy Ghost exists in the world as a single named NPC with a visible quest marker, personally offering their own one-time questline themed on their biblical story.
- R3. Completing a Big Recruit's questline recruits that same NPC into the player's roster permanently — the quest-giver and the recruited character are the same entity, not a separate reward character.
- R4. Completing a Big Recruit's questline flips exactly one unlock hook: David → a weapon and the game's first boss-fight encounter node (Goliath); Noah → a building; Moses → an ability; Paul → an ability; Holy Ghost → a passive blessing (applied directly, see R9).
- R5. Unlock hooks recorded by R4 are flags/state only. This plan does not implement the weapon, building, boss encounter, or ability content itself — that is separate future work under the deferred areas in How This Work Fits Together.
- R6. A recruited Big Recruit can never fall, be lured, be hypnotized, or convert — permanently exempt from every affliction state that applies to a regular villager.

**Roster & Deployment**

- R7. A roster panel lists every recruited character — Big Recruit or scattered NPC — and lets the player set each one to Follow (travels with the player) or Station (holds a player-chosen spot in the village).
- R8. A followed character travels with the player and acts according to their role (for example, a combat-capable recruit fights nearby threats); a stationed character acts autonomously at its assigned spot.
- R9. The Holy Ghost has no walking companion form. It never appears as a following or stationed sprite, has no Follow/Station toggle in the roster panel, and its blessing (R4) applies immediately on recruitment.

**Scattered NPCs**

- R10. Beyond the five Big Recruits, a wider pool of named scattered NPC candidates becomes available to recruit as the player's own level increases.
- R11. The player recruits a scattered NPC by paying a coin cost. No questline is required.
- R12. A recruited scattered NPC joins the same roster panel (R7) with the same Follow/Station choice and a small role-appropriate perk, but remains vulnerable to falling, luring, hypnosis, and conversion exactly like a regular villager.

**Quest Tracking**

- R13. A quest journal panel, separate from the existing daily job ribbon, lists in-progress and available Big Recruit questlines and each one's current objective.
- R14. The daily job ribbon (Daily Bread) is unaffected by this feature: it continues to show only ambient daily jobs and never surfaces a Big Recruit questline objective.

### Key Flows

- F1. **Recruiting a Big Recruit**
  - **Trigger:** Player approaches a Big Recruit's quest-marker NPC before that recruit has joined.
  - **Steps:** Player accepts the questline → completes its objective(s) in the world → returns to the same NPC to turn in → the NPC joins the roster with a Follow/Station choice (except the Holy Ghost, per R9) → the mapped unlock hook flips.
  - **Covers:** R2, R3, R4, R6.
- F2. **Recruiting a scattered NPC**
  - **Trigger:** Player's level crosses a candidate's unlock threshold and they open the recruit view.
  - **Steps:** Player pays the coin cost → the NPC joins the roster with a small perk → the NPC remains vulnerable per R12.
  - **Covers:** R10, R11, R12.
- F3. **Assigning Follow or Station**
  - **Trigger:** Player opens the roster panel and selects a recruited character.
  - **Steps:** Player picks Follow or Station (choosing a world spot for Station) → the character's behavior updates immediately.
  - **Covers:** R7, R8, R9.
- F4. **Tracking an in-progress questline**
  - **Trigger:** Player has accepted at least one Big Recruit questline.
  - **Steps:** Player opens the quest journal panel → sees each active questline's current objective, distinct from the daily ribbon.
  - **Covers:** R13, R14.

### Acceptance Examples

- AE1. **Given** the player has not yet talked to David's quest-giver NPC, **when** they approach David in the village, **then** a quest marker is visible and starting dialogue offers the Goliath questline. Covers R2.
- AE2. **Given** the player has completed David's questline, **when** the roster panel is opened, **then** David appears as a Follow/Station option, a weapon-unlock flag and the Goliath boss-encounter hook are both set, and no actual Goliath fight or weapon exists in-world yet. Covers R3, R4, R5.
- AE3. **Given** David has been recruited, **when** a tempter or deceiver targets a villager near David, **then** David is unaffected regardless of proximity — only regular villagers and scattered NPCs can fall. Covers R6.
- AE4. **Given** the Holy Ghost has been recruited, **when** the player opens the roster panel, **then** the Holy Ghost's entry shows no Follow/Station toggle and its blessing is already active. Covers R9.
- AE5. **Given** the player's level has just crossed a scattered-NPC unlock threshold, **when** they open the recruit view, **then** the newly available candidate is listed with its coin cost, and paying it immediately adds them to the roster. Covers R10, R11.
- AE6. **Given** a scattered NPC is stationed at the wall, **when** a robber or tempter attacks nearby, **then** the scattered NPC can be lured, hypnotized, or fall exactly like a regular villager stationed there would. Covers R12.
- AE7. **Given** two Big Recruit questlines are active at once, **when** the player opens the quest journal, **then** both show their current objective, and the daily ribbon at the top still shows only the ambient daily jobs, unaffected. Covers R13, R14.

### Success Criteria

- A player can recruit at least one Big Recruit through natural play — find the NPC, complete the questline, return — without needing external instructions.
- A player can tell, from the roster panel alone, which recruited characters are permanently safe from falling and which are not.
- The existing Daily Bread ribbon shows no observable change in behavior after this feature ships.

### Scope Boundaries

**Deferred for later:**
- The other four breakdown areas from the same conversation: Village Sim & Economy, Society & Government, Combat/Gear & Wars, and Divine Judgment & Mysticism.
- The actual weapon, building, boss-encounter, and ability content behind each unlock hook (R5).
- Jesus as a sixth Big Recruit (R1).
- The full roster size, names, and perks for the scattered NPC pool beyond a first small set.

### Dependencies / Assumptions

- Assumes the existing actor architecture (`lib/valley/world/actor.ts`, `lib/valley/world/villager.ts`) can support a new companion-actor type distinct from `Villager`, since Big Recruits and scattered NPCs need follow/station behavior that ordinary villagers don't have.
- Assumes the roster panel and quest journal panel follow the existing React-overlay-over-Phaser-bridge pattern already used for the build/skill panels and the Daily Bread ribbon (`components/valley/ribbon.tsx`, `components/valley/hud.tsx`).
- Assumes exact coin costs, player-level thresholds, and quest objective difficulty are numeric tuning decided during planning, not fixed by this plan.

### Outstanding Questions

**Deferred to Planning:**
- Exact in-world objectives for Moses's, Paul's, and Noah's questlines (David's is settled as a Goliath encounter). The unlock category for each is settled (R4); the specific quest steps are not.
- Exact roster size, names, and perks for the scattered NPC pool (R10), and the coin cost / level-threshold curve.
- Visual treatment for the Holy Ghost's presence in the world and roster panel, given it has no companion sprite (R9).

### Sources / Research

- `lib/valley/world/villager.ts:9-21,180-274` — the existing affliction states (fallen, lured, hypno, converted) that R6 and R12 reference.
- `lib/valley/dialogue.ts:165-174` — the existing transient name-pool convention (`pickVisitName`) that this plan's persistent named recruits depart from.
- `lib/valley/types.ts`, `lib/valley/config.ts` — current `SaveData`/`HudState` shapes and tuning tables (`BUILDINGS`, `ENEMIES`, `SKILLS`) that a roster/quest data shape will need to extend.
- `components/valley/ribbon.tsx`, `components/valley/hud.tsx` — the current UI-overlay pattern the roster and quest journal panels are assumed to follow (R13, R14 dependency).
- `docs/plans/2026-09-12-001-feat-shalom-valley-daily-bread-plan.md` — sibling plan establishing the Daily Bread ribbon this feature must not disturb.
