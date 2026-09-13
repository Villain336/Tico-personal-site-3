import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MUSTER_COST,
  canMuster,
  emptyWar,
  nextNamedBoss,
  nightCount,
  payMuster,
  pickNightKind,
  unlockAfterCaptain,
} from "./war.ts";

const ready = {
  hasHall: true,
  conscription: true,
  coins: 10,
  bank: 40,
  dragonDefeated: false,
  goliathDefeated: true,
  raidsCleared: 1,
  siegeNext: false,
};

describe("war", () => {
  it("starts empty on a quiet night", () => {
    assert.deepEqual(emptyWar().lastNight, "night");
    assert.equal(emptyWar().raidsCleared, 0);
  });

  it("lets a booked siege win over a raid roll", () => {
    const kind = pickNightKind({
      goliathDefeated: true,
      siegeNext: true,
      forceKind: null,
      lastNight: "night",
      raidsCleared: 1,
      day: 8,
      rng: () => 0,
    });
    assert.equal(kind, "siege");
  });

  it("never raids before Goliath falls", () => {
    const kind = pickNightKind({
      goliathDefeated: false,
      siegeNext: false,
      forceKind: null,
      lastNight: "night",
      raidsCleared: 0,
      day: 20,
      rng: () => 0,
    });
    assert.equal(kind, "night");
  });

  it("refuses a raid the night after a raid", () => {
    const kind = pickNightKind({
      goliathDefeated: true,
      siegeNext: false,
      forceKind: null,
      lastNight: "raid",
      raidsCleared: 2,
      day: 10,
      rng: () => 0,
    });
    assert.equal(kind, "night");
  });

  it("honors a forced kind", () => {
    assert.equal(
      pickNightKind({
        goliathDefeated: false,
        siegeNext: false,
        forceKind: "raid",
        lastNight: "raid",
        raidsCleared: 0,
        day: 1,
        rng: () => 1,
      }),
      "raid",
    );
  });

  it("adds bodies on raid and siege nights", () => {
    assert.equal(nightCount(10, "night"), 10);
    assert.equal(nightCount(10, "raid"), 16);
    assert.equal(nightCount(10, "siege"), 20);
    assert.equal(nightCount(30, "siege"), 28);
  });

  it("blocks a muster until the valley is ready", () => {
    assert.match(canMuster({ ...ready, goliathDefeated: false }).ok ? "" : canMuster({ ...ready, goliathDefeated: false }).reason, /Goliath/);
    assert.match(canMuster({ ...ready, raidsCleared: 0 }).ok ? "" : canMuster({ ...ready, raidsCleared: 0 }).reason, /raid/);
    assert.match(canMuster({ ...ready, conscription: false }).ok ? "" : canMuster({ ...ready, conscription: false }).reason, /conscription/);
    assert.match(canMuster({ ...ready, coins: 0, bank: 10 }).ok ? "" : canMuster({ ...ready, coins: 0, bank: 10 }).reason, /40/);
    assert.equal(canMuster(ready).ok, true);
  });

  it("pays the bank before the purse", () => {
    assert.deepEqual(payMuster(20, 30, MUSTER_COST), { coins: 10, bank: 0 });
    assert.deepEqual(payMuster(0, 50, MUSTER_COST), { coins: 0, bank: 10 });
  });

  it("unlocks Baal on the first captain and walks the boss list", () => {
    assert.deepEqual(unlockAfterCaptain(0, false), { raidsCleared: 1, unlockBaal: true });
    assert.deepEqual(unlockAfterCaptain(2, true), { raidsCleared: 3, unlockBaal: false });
    assert.equal(
      nextNamedBoss({
        goliathBoss: true,
        goliathDefeated: true,
        baalBoss: true,
        baalDefeated: false,
        molochBoss: false,
        molochDefeated: false,
        dragonBoss: false,
        dragonDefeated: false,
      }),
      "baal",
    );
    assert.equal(
      nextNamedBoss({
        goliathBoss: true,
        goliathDefeated: true,
        baalBoss: true,
        baalDefeated: true,
        molochBoss: true,
        molochDefeated: true,
        dragonBoss: true,
        dragonDefeated: false,
      }),
      "dragon",
    );
  });
});
