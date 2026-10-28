export const TYPES = 3, SYMBOLS = 4, GENOME_SIZE = 85;
export const ACTIONS = ['rest', 'bud', 'connect', 'prune'];

export class RNG {
  constructor(seed = 1) { this.state = seed >>> 0; }
  next() {
    this.state = (this.state + 0x6D2B79F5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n) { return Math.floor(this.next() * n); }
}

export function randomGenome(rng) {
  return Array.from({length: GENOME_SIZE}, () => rng.int(256));
}

export function mutateGenome(genome, rng, rate = 0.025) {
  return genome.map(token => rng.next() < rate ? rng.int(256) : token);
}

export function makePolicy(genome) {
  const decode = (start, end) => genome.slice(start, end).map(x => (x / 255 - 0.5) * 1.5);
  return {send: decode(0, 12), receive: decode(12, 24), develop: decode(24, 84),
    rate: 0.035 + genome[84] / 255 * 0.13,
    sendBaseline: [0, 0, 0], receiveBaseline: [0, 0, 0, 0]};
}

export function probabilities(table, row, width) {
  const values = table.slice(row * width, (row + 1) * width);
  const max = Math.max(...values);
  const exps = values.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

export function sample(probs, rng) {
  let u = rng.next();
  for (let i = 0; i < probs.length; i++) if ((u -= probs[i]) <= 0) return i;
  return probs.length - 1;
}

function reinforce(table, row, width, chosen, reward, baselines, rate) {
  const p = probabilities(table, row, width);
  const advantage = reward - baselines[row];
  for (let j = 0; j < width; j++) {
    const index = row * width + j;
    table[index] = Math.max(-9, Math.min(9, table[index] + rate * advantage * ((j === chosen ? 1 : 0) - p[j])));
  }
  baselines[row] += 0.035 * advantage;
}

// The receiver gets ONLY the symbol: never resource type or sender policy.
export function encounter(sender, receiver, type, rng, {learning = true, channel = 'intact'} = {}) {
  const emitted = sample(probabilities(sender.send, type, SYMBOLS), rng);
  const symbol = channel === 'muted' ? 0 : channel === 'shuffled' ? rng.int(SYMBOLS) : emitted;
  const action = sample(probabilities(receiver.receive, symbol, TYPES), rng);
  const success = action === type;
  if (learning) {
    reinforce(sender.send, type, SYMBOLS, emitted, Number(success), sender.sendBaseline, sender.rate);
    reinforce(receiver.receive, symbol, TYPES, action, Number(success), receiver.receiveBaseline, receiver.rate);
  }
  return {emitted, symbol, action, success};
}

// Exact expectation, balanced novel resource samples, frozen current policies.
// Shuffle preserves each sender's marginal symbol frequency, removes type information.
export function assess(pairs) {
  if (!pairs.length) return {intact: null, shuffled: null, muted: null, pairs: 0};
  let intact = 0, shuffled = 0, muted = 0;
  for (const [sender, receiver] of pairs) {
    const sends = Array.from({length: TYPES}, (_, t) => probabilities(sender.send, t, SYMBOLS));
    const reads = Array.from({length: SYMBOLS}, (_, m) => probabilities(receiver.receive, m, TYPES));
    const marginal = Array.from({length: SYMBOLS}, (_, m) => sends.reduce((s, p) => s + p[m], 0) / TYPES);
    for (let t = 0; t < TYPES; t++) {
      muted += reads[0][t] / TYPES;
      for (let m = 0; m < SYMBOLS; m++) {
        intact += sends[t][m] * reads[m][t] / TYPES;
        shuffled += marginal[m] * reads[m][t] / TYPES;
      }
    }
  }
  return {intact: intact / pairs.length, shuffled: shuffled / pairs.length, muted: muted / pairs.length, pairs: pairs.length};
}

// A deliberately separate diagnostic: no births, death, energy or selection.
export function culture({seed = 1, rounds = 60000, learning = true, count = 12} = {}) {
  const rng = new RNG(seed);
  const policies = Array.from({length: count}, () => makePolicy(randomGenome(rng)));
  const pairs = policies.flatMap((p, i) => [[p, policies[(i + 1) % count]], [p, policies[(i + count - 1) % count]]]);
  const before = assess(pairs);
  for (let i = 0; i < rounds; i++) {
    const a = rng.int(count), b = (a + (rng.next() < 0.5 ? 1 : count - 1)) % count;
    encounter(policies[a], policies[b], rng.int(TYPES), rng, {learning});
  }
  return {seed, rounds, learning, before, after: assess(pairs)};
}
