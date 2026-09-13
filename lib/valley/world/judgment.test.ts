import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applySign,
  canCallJudgment,
  emptyJudgment,
  growScale,
  pickSign,
  quoteBook,
  recordSoul,
  signSpawnDelta,
  thirstScale,
  verdictEffects,
  weighValley,
} from "./judgment.ts";

const base = {
  day: 6,
  population: 3,
  sin: 20,
  loyalty: 60,
  idols: 0,
  mercyGiven: 0,
  lastSign: "none" as const,
  forceSign: null,
  alreadyJudged: false,
  rng: () => 0,
};

describe("judgment", () => {
  it("starts empty with no sign", () => {
    const j = emptyJudgment();
    assert.equal(j.activeSign, "none");
    assert.equal(j.verdict, "none");
    assert.equal(j.souls.length, 0);
  });

  it("holds signs until day 4 and never stacks two in a row", () => {
    assert.equal(pickSign({ ...base, day: 2, rng: () => 0 }), "none");
    assert.equal(pickSign({ ...base, lastSign: "drought", idols: 2, rng: () => 0 }), "none");
  });

  it("honors a forced sign and skips a finished valley", () => {
    assert.equal(pickSign({ ...base, forceSign: "quietDawn", lastSign: "drought" }), "quietDawn");
    assert.equal(pickSign({ ...base, alreadyJudged: true, forceSign: "drought" }), "none");
  });

  it("prefers a long night when idols stand", () => {
    assert.equal(pickSign({ ...base, idols: 1, rng: () => 0 }), "longNight");
  });

  it("can hush a merciful valley", () => {
    assert.equal(pickSign({ ...base, mercyGiven: 2, sin: 10, loyalty: 70, rng: () => 0 }), "quietDawn");
  });

  it("scales drought and long nights", () => {
    assert.equal(growScale("drought"), 1.55);
    assert.equal(thirstScale("drought"), 1.35);
    assert.equal(signSpawnDelta("longNight"), 6);
    assert.equal(signSpawnDelta("quietDawn"), -4);
    assert.equal(growScale("none"), 1);
  });

  it("weighs blessing, exile, and a dark tear-back", () => {
    assert.equal(
      weighValley({ sin: 10, loyalty: 80, mercyGiven: 3, exileGiven: 0, idols: 0, blessing: true, jesus: true }),
      "blessing",
    );
    assert.equal(
      weighValley({ sin: 40, loyalty: 50, mercyGiven: 1, exileGiven: 1, idols: 0, blessing: false, jesus: false }),
      "exile",
    );
    assert.equal(
      weighValley({ sin: 80, loyalty: 20, mercyGiven: 0, exileGiven: 3, idols: 2, blessing: false, jesus: false }),
      "darkReset",
    );
  });

  it("names verdict effects without inventing a god-unit", () => {
    assert.equal(verdictEffects("blessing").bless, true);
    assert.equal(verdictEffects("exile").exileFallen, true);
    assert.equal(verdictEffects("darkReset").clearDark, true);
    assert.equal(verdictEffects("darkReset").bless, false);
  });

  it("blocks a second weighing", () => {
    assert.equal(canCallJudgment({ jesusDone: false, verdict: "none", verdictNext: false }).ok, false);
    assert.equal(canCallJudgment({ jesusDone: true, verdict: "none", verdictNext: false }).ok, true);
    assert.match(canCallJudgment({ jesusDone: true, verdict: "blessing", verdictNext: false }).reason, /already/);
    assert.match(canCallJudgment({ jesusDone: false, verdict: "blessing", verdictNext: false }).reason, /already/);
  });

  it("keeps a Book of named souls and quotes the last line", () => {
    const book = emptyJudgment();
    recordSoul(book, { name: "Miriam", seed: 1, kind: "arrived", day: 2, note: "moved in" });
    recordSoul(book, { name: "Miriam", seed: 1, kind: "fallen", day: 3, note: "fell" });
    const q = quoteBook(book.souls);
    assert.equal(q?.name, "Miriam");
    assert.match(q?.line ?? "", /fell/);
    applySign(book, "drought");
    assert.equal(book.activeSign, "drought");
    assert.equal(book.signsSeen, 1);
  });
});
