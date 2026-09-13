import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LINEN_OUTFIT, wearTunic, weave } from "./craft.ts";

describe("craft", () => {
  it("refuses a short recipe", () => {
    const r = weave({ wool: 1, flax: 2, cloth: 0 });
    assert.equal(r.ok, false);
    assert.equal(r.bag.cloth, 0);
  });

  it("weaves a tunic from wool and flax", () => {
    const r = weave({ wool: 3, flax: 2, cloth: 0 });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.bag.wool, 1);
    assert.equal(r.bag.flax, 0);
    assert.equal(r.bag.cloth, 1);
  });

  it("wears linen and spends cloth", () => {
    const r = wearTunic({ wool: 0, flax: 0, cloth: 1 }, 0);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.outfit, LINEN_OUTFIT);
    assert.equal(r.bag.cloth, 0);
  });
});
