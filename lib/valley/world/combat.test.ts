import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ENEMIES, PLAYER, UNLOCK_FX } from "../config.ts";
import { meleeReaches } from "./combat.ts";

describe("combat reach", () => {
  it("lets a staff answer Goliath's slam", () => {
    const pad = ENEMIES.goliath.hitRadius ?? 0;
    assert.equal(meleeReaches(PLAYER.swordRange, pad, pad), true);
  });

  it("lets David's blade reach farther than a slam", () => {
    const pad = ENEMIES.goliath.hitRadius ?? 0;
    const range = PLAYER.swordRange + UNLOCK_FX.weaponRangeBonus;
    assert.equal(meleeReaches(range, pad, pad), true);
  });

  it("rejects the old 10px pad against a 44px slam", () => {
    assert.equal(meleeReaches(PLAYER.swordRange + UNLOCK_FX.weaponRangeBonus, 10, 44), false);
  });
});
