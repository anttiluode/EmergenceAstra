import test from 'node:test';
import assert from 'node:assert/strict';
import * as worldModule from '../src/world.js';

test('world checkpoints resume exactly, including learning, random state and genealogy', () => {
  assert.equal(typeof worldModule.World, 'function');
  const world = new worldModule.World({seed: 123, width: 24, height: 18, initial: 40});
  world.step(200);
  const snapshot = world.snapshot();
  const resumed = worldModule.World.restore(JSON.parse(JSON.stringify(snapshot)));
  world.step(200); resumed.step(200);
  assert.deepEqual(resumed.snapshot(), world.snapshot());
  assert.ok(world.births > 0);
  assert.ok(world.cells.size <= world.config.cap);
  for (const c of world.cells.values()) {
    assert.ok(Number.isFinite(c.energy) && c.energy > 0);
    assert.ok(c.policy.send.every(Number.isFinite));
  }
});

test('assays do not alter the world; frozen learning preserves every policy', () => {
  assert.equal(typeof worldModule.World, 'function');
  const w = new worldModule.World({seed: 5, initial: 30, growth: false, learning: false});
  const before = w.snapshot();
  w.assay();
  assert.deepEqual(w.snapshot(), before);
  w.step(100);
  for (const c of w.cells.values()) assert.deepEqual(c.policy, before.cells.find(x => x.id === c.id).policy);
});

test('genetic children do not inherit learned tables, and cannot mutate parent storage', () => {
  assert.equal(typeof worldModule.World, 'function');
  const w = new worldModule.World({seed: 7, width: 16, height: 16, initial: 1});
  const parent = [...w.cells.values()][0];
  parent.energy = 10;
  parent.policy.send[0] = 8;
  const child = w.bud(parent);
  assert.ok(child);
  assert.notEqual(child.policy.send[0], 8);
  const gene = parent.genome[0];
  child.genome[0] = (gene + 1) % 256;
  assert.equal(parent.genome[0], gene);
});

test('empty worlds and invalid checkpoint input are handled explicitly', () => {
  assert.equal(typeof worldModule.World, 'function');
  const w = new worldModule.World({initial: 0});
  w.step(10);
  assert.equal(w.assay().intact, null);
  assert.throws(() => worldModule.World.restore({version: 999}), /checkpoint/i);
  const valid = w.snapshot();
  valid.nutrient[0] = Infinity;
  assert.throws(() => worldModule.World.restore(valid), /checkpoint/i);
});

test('checkpoint rejects inconsistent ancestry counters and immutable genome parameters', () => {
  const w = new worldModule.World({seed: 4, initial: 20});
  w.step(200);
  for (const mutate of [
    s => { s.successes = s.attempts + 1; },
    s => { s.births += 1; },
    s => { s.cells[0].policy.develop.fill(9); },
    s => { s.cells[0].policy.rate = 0.035; }
  ]) {
    const s = w.snapshot(); mutate(s);
    assert.throws(() => worldModule.World.restore(s), /checkpoint/i);
  }
});
