import {RNG, GENOME_SIZE, randomGenome, mutateGenome, makePolicy, probabilities, sample, encounter, assess} from './core.js';

const DEFAULTS = {seed: 7, width: 48, height: 32, initial: 96, cap: 550, learning: true, growth: true, channel: 'intact', mutation: 0.025};
const integer = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const finite = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;

function configValid(c) {
  return c && integer(c.seed, 0, 4294967295) && integer(c.width, 8, 100) && integer(c.height, 8, 100)
    && integer(c.initial, 0, c.width * c.height) && integer(c.cap, c.initial, c.width * c.height)
    && typeof c.learning === 'boolean' && typeof c.growth === 'boolean'
    && ['intact', 'shuffled', 'muted'].includes(c.channel) && finite(c.mutation, 0, 1);
}

export class World {
  constructor(options = {}) {
    this.config = {...DEFAULTS, ...options};
    this.config.cap = Math.min(this.config.cap, this.config.width * this.config.height);
    if (!configValid(this.config)) throw new Error('Invalid world configuration');
    this.rng = new RNG(this.config.seed);
    this.tick = 0; this.nextId = 1; this.births = 0; this.deaths = 0;
    this.attempts = 0; this.successes = 0; this.harvest = 0;
    this.cells = new Map(); this.bonds = new Map(); this.events = [];
    const n = this.config.width * this.config.height;
    this.occupancy = new Int32Array(n);
    this.nutrient = Array.from({length: n}, () => 0.3 + this.rng.next() * 0.7);
    this.resource = Array.from({length: n}, () => this.rng.int(3));
    // Uniform random placement in a central patch, then fall back to all vacant sites.
    const sites = Array.from({length: n}, (_, i) => i);
    for (let i = sites.length - 1; i > 0; i--) {
      const j = this.rng.int(i + 1); [sites[i], sites[j]] = [sites[j], sites[i]];
    }
    const central = i => Math.abs(i % this.config.width - this.config.width / 2) < this.config.width * 0.29
      && Math.abs(Math.floor(i / this.config.width) - this.config.height / 2) < this.config.height * 0.29;
    const ordered = [...sites.filter(central), ...sites.filter(i => !central(i))];
    for (const site of ordered.slice(0, this.config.initial)) this.addCell(site, randomGenome(this.rng));
  }

  addCell(site, genome, parent = null) {
    const id = this.nextId++;
    const c = {id, site, genome: [...genome], policy: makePolicy(genome), energy: parent ? 2.7 : 4,
      age: 0, parent: parent?.id ?? null, lineage: parent?.lineage ?? id, generation: parent ? parent.generation + 1 : 0,
      lastSymbol: 4, lastAction: 0, sent: 4, successes: 0, attempts: 0};
    this.cells.set(id, c); this.occupancy[site] = id;
    return c;
  }

  nearby(c, radius = 3) {
    const {width, height} = this.config, x = c.site % width, y = Math.floor(c.site / width), list = [];
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      if ((!dx && !dy) || Math.abs(dx) + Math.abs(dy) > radius || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
      const other = this.cells.get(this.occupancy[(y + dy) * width + x + dx]);
      if (other) list.push(other);
    }
    return list;
  }

  key(a, b) { return a < b ? `${a}:${b}` : `${b}:${a}`; }

  degree(id) {
    let count = 0;
    for (const bond of this.bonds.values()) if (bond.a === id || bond.b === id) count++;
    return count;
  }

  bud(parent) {
    if (parent.energy < 6 || this.cells.size >= this.config.cap) return null;
    const {width, height} = this.config, x = parent.site % width, y = Math.floor(parent.site / width);
    const sites = [[x-1,y], [x+1,y], [x,y-1], [x,y+1]]
      .filter(([a,b]) => a >= 0 && a < width && b >= 0 && b < height && !this.occupancy[b*width+a])
      .map(([a,b]) => b*width+a);
    if (!sites.length) return null;
    parent.energy -= 3;
    const child = this.addCell(sites[this.rng.int(sites.length)], mutateGenome(parent.genome, this.rng, this.config.mutation), parent);
    this.births++;
    return child;
  }

  develop(c) {
    const energyState = c.energy < 3 ? 0 : c.energy < 6 ? 1 : 2;
    const row = energyState * 5 + c.lastSymbol;
    const action = sample(probabilities(c.policy.develop, row, 4), this.rng);
    c.lastAction = action;
    if (action === 1) this.bud(c);
    if (action === 2 && c.energy > 1 && this.degree(c.id) < 4) {
      const candidates = this.nearby(c).filter(b => this.degree(b.id) < 4);
      if (candidates.length) {
        const b = candidates[this.rng.int(candidates.length)], key = this.key(c.id, b.id);
        const bond = this.bonds.get(key) ?? {a: c.id, b: b.id, strength: 0};
        bond.strength = Math.min(1, bond.strength + 0.15);
        this.bonds.set(key, bond); c.energy -= 0.06;
      }
    }
    if (action === 3) {
      const bonds = [...this.bonds.entries()].filter(([,b]) => b.a === c.id || b.b === c.id).sort((a,b) => a[1].strength - b[1].strength);
      if (bonds.length) this.bonds.delete(bonds[0][0]);
    }
  }

  step(count = 1) {
    for (let step = 0; step < count; step++) {
      this.tick++;
      this.events = this.events.filter(e => this.tick - e.tick < 8);
      for (let i = 0; i < this.nutrient.length; i++) {
        this.nutrient[i] = Math.min(1, this.nutrient[i] + 0.012);
        if (this.rng.next() < 0.0008) this.resource[i] = this.rng.int(3);
      }
      const live = [...this.cells.values()];
      // Shuffle scheduling so older IDs have no permanent first-mover advantage.
      for (let i = live.length - 1; i > 0; i--) {
        const j = this.rng.int(i + 1); [live[i], live[j]] = [live[j], live[i]];
      }
      for (const c of live) {
        if (!this.cells.has(c.id)) continue;
        c.age++; c.energy -= 0.012 + 0.0004 * this.degree(c.id);
        if (c.energy <= 0 || c.age > 6000) { this.remove(c); continue; }
        if (this.rng.next() < 0.25 && this.nutrient[c.site] >= 0.18) {
          const neighbors = this.nearby(c);
          if (neighbors.length) {
            const weights = neighbors.map(b => 1 + 5 * (this.bonds.get(this.key(c.id, b.id))?.strength ?? 0));
            const sum = weights.reduce((a,b) => a+b, 0);
            const other = neighbors[sample(weights.map(v => v/sum), this.rng)];
            const result = encounter(c.policy, other.policy, this.resource[c.site], this.rng, this.config);
            c.energy -= 0.008; other.energy -= 0.008;
            c.sent = result.emitted; other.lastSymbol = result.symbol;
            c.attempts++; this.attempts++;
            if (result.success) {
              this.nutrient[c.site] -= 0.18;
              c.energy += 0.27; other.energy += 0.27;
              this.harvest += 0.54; c.successes++; this.successes++;
              const bond = this.bonds.get(this.key(c.id, other.id));
              if (bond) bond.strength = Math.min(1, bond.strength + 0.02);
            }
            c.energy = Math.min(12, c.energy); other.energy = Math.min(12, other.energy);
            if (this.events.length < 200) this.events.push({a: c.site, b: other.site, symbol: result.symbol, success: result.success, tick: this.tick});
          }
        }
        if (this.config.growth && this.tick % 8 === c.id % 8) this.develop(c);
      }
      // A receiver may have spent its last energy after its own scheduled turn.
      for (const c of this.cells.values()) if (c.energy <= 0) this.remove(c);
      for (const [key, b] of this.bonds) {
        b.strength *= 0.998;
        if (b.strength < 0.01) this.bonds.delete(key);
      }
    }
  }

  remove(c) {
    this.cells.delete(c.id); this.occupancy[c.site] = 0; this.deaths++;
    for (const [key,b] of this.bonds) if (b.a === c.id || b.b === c.id) this.bonds.delete(key);
  }

  assay() {
    // Uniform over all directed physical neighbors; does not weight by current bonds.
    const pairs = [];
    for (const c of this.cells.values()) for (const b of this.nearby(c)) pairs.push([c.policy, b.policy]);
    return assess(pairs);
  }

  stats() {
    const cells = [...this.cells.values()];
    return {tick: this.tick, population: cells.length, lineages: new Set(cells.map(c => c.lineage)).size,
      generation: cells.reduce((max,c) => Math.max(max,c.generation), 0), bonds: this.bonds.size,
      births: this.births, deaths: this.deaths, attempts: this.attempts, successes: this.successes,
      energy: cells.reduce((s,c) => s+c.energy,0), harvest: this.harvest};
  }

  snapshot() {
    return structuredClone({version: 1, config: this.config, rng: this.rng.state, tick: this.tick,
      nextId: this.nextId, births: this.births, deaths: this.deaths, attempts: this.attempts, successes: this.successes,
      harvest: this.harvest, nutrient: this.nutrient, resource: this.resource,
      cells: [...this.cells.values()], bonds: [...this.bonds.values()]});
  }

  static restore(data) {
    const invalid = () => { throw new Error('Invalid checkpoint: unsupported version or inconsistent state'); };
    if (!data || data.version !== 1 || !configValid(data.config)) invalid();
    const array = (a, n, fn) => Array.isArray(a) && a.length === n && a.every(fn);
    const n = data.config.width * data.config.height;
    if (!array(data.nutrient, n, v => finite(v, 0, 1)) || !array(data.resource, n, v => integer(v,0,2))
      || !integer(data.rng, 0, 4294967295) || !integer(data.nextId, 1, 2147483647)
      || !['tick','births','deaths','attempts','successes'].every(k => integer(data[k],0,Number.MAX_SAFE_INTEGER))
      || !finite(data.harvest, 0, Number.MAX_SAFE_INTEGER) || !Array.isArray(data.cells) || data.cells.length > data.config.cap
      || !Array.isArray(data.bonds) || data.bonds.length > data.config.cap * 2) invalid();
    if (data.successes > data.attempts || data.nextId !== data.config.initial + data.births + 1
      || data.cells.length !== data.config.initial + data.births - data.deaths) invalid();
    const ids = new Set(), sites = new Set();
    for (const c of data.cells) {
      const p = c?.policy;
      if (!c || !integer(c.id,1,data.nextId-1) || ids.has(c.id) || !integer(c.site,0,n-1) || sites.has(c.site)
        || !finite(c.energy,0.000000001,12) || !integer(c.age,0,6000) || !integer(c.lineage,1,c.id)
        || !integer(c.generation,0,data.tick) || !(c.parent === null || integer(c.parent,1,c.id-1))
        || !integer(c.lastSymbol,0,4) || !integer(c.sent,0,4) || !integer(c.lastAction,0,3)
        || !integer(c.successes,0,Number.MAX_SAFE_INTEGER) || !integer(c.attempts,c.successes,Number.MAX_SAFE_INTEGER)
        || !array(c.genome,GENOME_SIZE,v => integer(v,0,255)) || !p
        || !array(p.send,12,v => finite(v,-9,9)) || !array(p.receive,12,v => finite(v,-9,9))
        || !array(p.develop,60,v => finite(v,-9,9)) || !finite(p.rate,0.035,0.165000001)
        || !array(p.sendBaseline,3,v => finite(v,0,1)) || !array(p.receiveBaseline,4,v => finite(v,0,1))) invalid();
      const inherited = makePolicy(c.genome);
      if (p.rate !== inherited.rate || p.develop.some((v,i) => v !== inherited.develop[i])
        || c.lineage > data.config.initial
        || (c.parent === null ? c.generation !== 0 || c.lineage !== c.id || c.id > data.config.initial : c.generation < 1 || c.id <= data.config.initial)) invalid();
      ids.add(c.id); sites.add(c.site);
    }
    const w = new World({...data.config, initial: 0});
    const saved = structuredClone(data);
    w.config = saved.config; w.rng.state = saved.rng;
    for (const k of ['tick','nextId','births','deaths','attempts','successes','harvest','nutrient','resource']) w[k] = saved[k];
    w.cells = new Map(saved.cells.map(c => [c.id,c]));
    w.occupancy.fill(0);
    for (const c of w.cells.values()) w.occupancy[c.site] = c.id;
    for (const b of saved.bonds) {
      if (!b || !ids.has(b.a) || !ids.has(b.b) || b.a === b.b || !finite(b.strength,0.01,1)
        || w.bonds.has(w.key(b.a,b.b)) || !w.nearby(w.cells.get(b.a)).some(c => c.id === b.b)) invalid();
      w.bonds.set(w.key(b.a,b.b), b);
    }
    for (const id of ids) if (w.degree(id) > 4) invalid();
    return w;
  }
}
