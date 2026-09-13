import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyOffer, firstAffordable } from "./worship.ts";

function bag(partial: Partial<Parameters<typeof applyOffer>[0]> = {}) {
  return {
    sin: 12,
    coins: 30,
    wheat: 6,
    meat: 0,
    wool: 0,
    templeOffersToday: 0,
    ...partial,
  };
}

describe("worship", () => {
  it("takes wheat first and lowers sin", () => {
    const r = applyOffer(bag());
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.bag.wheat, 2);
    assert.equal(r.bag.sin, 9);
    assert.equal(r.bag.templeOffersToday, 1);
  });

  it("refuses a third gift the same day", () => {
    const a = applyOffer(bag({ wheat: 20 }));
    const b = applyOffer(a.bag);
    const c = applyOffer(b.bag);
    assert.equal(c.ok, false);
    assert.match(c.toast, /enough for this dawn/);
  });

  it("never drops sin below 0", () => {
    const r = applyOffer(bag({ sin: 2, wheat: 4 }));
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.bag.sin, 0);
  });

  it("picks the first gift the bag can spare", () => {
    const g = firstAffordable(bag({ wheat: 0, coins: 8 }));
    assert.equal(g?.id, "coins");
  });
});
