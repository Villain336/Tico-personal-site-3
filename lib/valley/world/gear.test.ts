import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ARMOR_CAP,
  applyDrop,
  bountyCoins,
  emptyGear,
  equipGear,
  grantGear,
  incomingDamage,
  ownsGear,
  rollEnemyDrop,
  unequipSlot,
} from "./gear.ts";

function seq(values: number[]) {
  let i = 0;
  return () => values[i++] ?? 0;
}

describe("gear", () => {
  it("grants into an empty slot, then bags extras", () => {
    const first = grantGear(emptyGear(), "hideWrap");
    assert.equal(first.equipped, true);
    assert.equal(first.gear.wrap, "hideWrap");
    const second = grantGear(first.gear, "goliathMail");
    assert.equal(second.equipped, false);
    assert.deepEqual(second.gear.bag, ["goliathMail"]);
  });

  it("equips from the bag and returns the old piece", () => {
    const start = grantGear(grantGear(emptyGear(), "hideWrap").gear, "goliathMail").gear;
    const next = equipGear(start, "goliathMail");
    assert.ok(next);
    assert.equal(next.wrap, "goliathMail");
    assert.deepEqual(next.bag, ["hideWrap"]);
    const bare = unequipSlot(next, "wrap");
    assert.equal(bare.wrap, null);
    assert.deepEqual(bare.bag, ["hideWrap", "goliathMail"]);
  });

  it("refuses to equip gear the bag does not hold", () => {
    assert.equal(equipGear(emptyGear(), "davidsBlade"), null);
  });

  it("caps armor and applies ward", () => {
    assert.equal(incomingDamage(10, 0, 0), 10);
    assert.equal(incomingDamage(10, 0.15, 0), 8.5);
    assert.equal(incomingDamage(10, 0.35, 2), 4.9);
    assert.equal(incomingDamage(10, 0.35, 5), 10 * (1 - ARMOR_CAP));
    assert.equal(incomingDamage(0, 0.35, 5), 0);
  });

  it("scales bounty with hunter rank", () => {
    assert.equal(bountyCoins(10, 0), 10);
    assert.equal(bountyCoins(10, 2), 12);
    assert.equal(bountyCoins(7, 5), 11);
  });

  it("rolls robber scraps and a hide wrap from the drop table", () => {
    const none = rollEnemyDrop("robber", 0, seq([0.2, 0.9]));
    assert.equal(none.scraps, 0);
    assert.equal(none.gear, null);
    const wrap = rollEnemyDrop("robber", 0, seq([0.9, 0.1]));
    assert.equal(wrap.scraps, 2);
    assert.equal(wrap.gear, "hideWrap");
  });

  it("always drops Goliath's mail and a relic flag", () => {
    const roll = rollEnemyDrop("goliath", 0, seq([0, 0.99]));
    assert.equal(roll.scraps, 8);
    assert.equal(roll.relic, true);
    assert.equal(roll.gear, "goliathMail");
  });

  it("lets hunter rank lift a near-miss gear roll", () => {
    const miss = rollEnemyDrop("robber", 0, seq([0, 0.2]));
    assert.equal(miss.gear, null);
    const hit = rollEnemyDrop("robber", 1, seq([0, 0.2]));
    assert.equal(hit.gear, "hideWrap");
  });

  it("turns a duplicate unique drop into scraps", () => {
    const owned = grantGear(emptyGear(), "goliathMail").gear;
    const applied = applyDrop(owned, { scraps: 8, relic: true, gear: "goliathMail" });
    assert.equal(applied.gained, null);
    assert.equal(applied.gear.scraps, 12);
    assert.equal(ownsGear(applied.gear, "goliathMail"), true);
    assert.equal(applied.gear.bag.includes("goliathMail"), false);
  });

  it("always drops later-boss named gear", () => {
    assert.equal(rollEnemyDrop("raidLeader", 0, seq([0, 0])).gear, "raidBanner");
    assert.equal(rollEnemyDrop("baal", 0, seq([0, 0])).gear, "baalsCenser");
    assert.equal(rollEnemyDrop("moloch", 0, seq([0, 0])).gear, "molochBrand");
    assert.equal(rollEnemyDrop("dragon", 0, seq([0, 0])).gear, "dragonScale");
  });

  it("puts a first unique drop into an empty slot", () => {
    const applied = applyDrop(emptyGear(), { scraps: 3, relic: true, gear: "prophetLamp" });
    assert.equal(applied.gained, "prophetLamp");
    assert.equal(applied.gear.lamp, "prophetLamp");
    assert.equal(applied.gear.scraps, 3);
  });
});
