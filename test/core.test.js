import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../src/core.js';

test('independent random policies learn a useful code; frozen policies do not update', () => {
  assert.equal(typeof core.culture, 'function');
  const adaptive = core.culture({seed: 23, rounds: 60000});
  const frozen = core.culture({seed: 23, rounds: 60000, learning: false});
  assert.ok(adaptive.after.intact > adaptive.before.intact + 0.2);
  assert.ok(adaptive.after.intact > adaptive.after.shuffled + 0.2);
  assert.deepEqual(frozen.before, frozen.after);
});

test('assessment is non-mutating and arbitrary consistent symbol permutations preserve behavior', () => {
  assert.equal(typeof core.assess, 'function');
  const rng = new core.RNG(12);
  const a = core.makePolicy(core.randomGenome(rng));
  const b = core.makePolicy(core.randomGenome(rng));
  const before = JSON.stringify([a, b]);
  const score = core.assess([[a, b]]);
  assert.equal(JSON.stringify([a, b]), before);
  const perm = [2, 0, 3, 1];
  const ap = structuredClone(a), bp = structuredClone(b);
  for (let t = 0; t < 3; t++) for (let m = 0; m < 4; m++) ap.send[t * 4 + perm[m]] = a.send[t * 4 + m];
  for (let m = 0; m < 4; m++) for (let t = 0; t < 3; t++) bp.receive[perm[m] * 3 + t] = b.receive[m * 3 + t];
  assert.ok(Math.abs(score.intact - core.assess([[ap, bp]]).intact) < 1e-12);
  assert.ok(Math.abs(score.shuffled - 1/3) < 1e-12);
  assert.equal(core.assess([]).intact, null);
});
