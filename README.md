# Emergence Astra

**A graphical world of random genomes, learning cells, and changing connections.**

The question: can arbitrary signals become useful conventions when their consequences feed a growing world?

Each cell begins with an independent random genome. During life it rewrites its communication tables from the outcomes of local encounters. It consumes resources, builds and prunes connections, and can bud a mutated descendant. The browser shows the world, the changing tables, and a continuous test of whether the signals actually help.

This first implementation uses **small trainable policy tables**, not a pretrained LLM or transformer. It runs on the CPU, without dependencies, API keys, telemetry, or a GPU. The tables are the transparent starting point for testing the feedback loop, not a claim that a fixed alphabet is the final architecture.

## Run locally

Install Node.js 20 or newer, then:

```sh
git clone https://github.com/anttiluode/EmergenceAstra.git
cd EmergenceAstra
npm start
```

Open **http://localhost:4173**. No `npm install` is needed. The same commands work in a Windows terminal. The server listens only on the local machine. Opening `index.html` directly as a file will not load ES modules reliably; use the server.

Pause, single-step, change speed, inspect a cell, freeze learning, freeze development, or scramble the communication channel. **Save world** downloads a full checkpoint; **Resume world** restores it paused. Export measures to retain the assay history and the settings at each measurement. The viewer retains the most recent 1,000 measurements; use headless experiments for systematic work. Reset discards the current unsaved world.

## What the cells do

Every cell can act as both sender and receiver; there are no permanently assigned castes.

1. A cell senses a resource at its site: one of three types.
2. Its sender table chooses one of four arbitrary symbols. Symbol 0 does **not** come with a meaning such as “resource 0.”
3. A nearby receiver sees only the symbol and chooses one of three catalysts. It does not receive the resource type, the sender's genome, or its location as policy inputs.
4. A matching catalyst unlocks energy shared between the two cells. Both update their own chosen policy rows using the outcome. They do not exchange weights or receive a global loss.
5. Energy and the last received symbol select a developmental action: rest, bud, connect, or prune. Connections bias subsequent partner selection and cost maintenance. Resource consumption changes the local environment.

This is an **engineered cooperative signalling task embedded in an ecology**. Sensing, catalysts, energy sharing, reinforcement learning, budding, and the action vocabulary are supplied mechanisms. The symbol conventions and trajectories are the things left to the system.

## What changes, and what stays fixed

| Component | Changes during life? | Inheritance |
|---|---|---|
| Sender and receiver policy weights | Yes, local reinforcement learning | Children start from genome, not parent's learned weights |
| Energy, resource stocks, last received symbol | Yes | Child gets a fixed energy endowment paid from parent |
| Connections | Built, strengthened, pruned, and decayed | Children start without connections |
| Developmental table weights | **No**; changing inputs select different actions | Genome copied with independent token mutations |
| Genome | No somatic mutation | 85 byte tokens, copied with 2.5% per-token mutation |
| Interpreter, alphabet, action set, learning algorithm | Fixed | Shared substrate |

Tokens here are byte-valued genes specifying initial weights, not English words or LLM tokens. Twelve genes initialize the sender's 3×4 table, twelve initialize the receiver's 4×3 table, sixty initialize the development table (3 energy bands × 5 last-symbol states × 4 actions), and one sets the learning rate. The fifth last-symbol state means no message yet.

The world is dynamic even though the interpreter is fixed. It does **not yet** evolve arbitrary new instructions, expand its alphabet, create multicellular bodies with a reproductive boundary, or grow an unbounded neural architecture. The population ceiling defaults to 550 cells on 48×32 sites. A cell has at most four maintained bonds, communicates within Manhattan distance three, and has a maximum age of 6,000 ticks.

## What the score means

The viewer measures **expected catalyst correctness** with the current policies frozen. It evaluates every directed pair of physical neighbors on an equal mixture of the three resource types, independent of the resource distribution in the world. It sums exact softmax probabilities; there is no finite-sample noise or training during measurement.

- **Intact:** the receiver gets the sender's symbol for the sampled resource.
- **Shuffled:** symbols retain the sender's marginal frequency but lose dependence on resource type.
- **Muted:** one constant symbol is delivered (included in exported measures).

Shuffled and muted accuracy are mathematically **1/3** on this balanced diagnostic. They are analytical intervention baselines, not independently trained controls or empirical surprise. The assay does not measure food output or prove that language is necessary for population survival. It weights neighboring pairs uniformly, while encounters in the world favor existing bonds.

The live **Scramble signals** control is a different experiment: it replaces each emitted symbol with a uniform random symbol during ongoing learning. The constant-signal control always delivers symbol zero. Both can change future development and ecology. If you want an intervention without adaptation, pause, save a checkpoint, disable learning, then compare continuations from that checkpoint.

## Reproduce the experiments

```sh
npm test
node scripts/experiment.mjs --seeds 5 --rounds 60000 --ticks 3000 > results.json
```

The script separates:

1. **Stationary culture:** 12 cells on a ring, no births/deaths/resources, 60,000 random cooperative encounters. Adaptive and frozen controls start with identical seeds and genomes. This checks whether the learning mechanism can establish a code.
2. **Spatial ecology:** the full world, including growth, mutation and resource costs. Adaptive and frozen starts share seeds; their stochastic trajectories diverge once outcomes differ. This checks how much of the learning survives ecological turnover and mixing.

See [the initial measurements](docs/results.md). These are exploratory runs, not a discovery claim. A successful culture does not establish successful ecology; an ecological plateau does not establish impossibility.

## Where to take this next

The current ecology often reaches its explicit population ceiling, so apparent stabilization can be an artifact of that limit. Strong growth is possible even with random signalling. Those are useful design findings, not evidence of open-ended evolution.

The next substantive question is whether **locally compatible codes can sustain and reproduce their own physical neighborhoods**. Useful extensions include resource scarcity that makes coordination matter for persistence, inheritance of developmental learning rates, adjustable receptor neighborhoods, and variable-length genomes. Compare these against the current saved baseline rather than quietly changing the meaning of the score. A transformer or neural cellular automaton becomes useful when it buys a larger space of learnable developmental programs; size alone would not supply that pressure.

## Project map

- `src/core.js`: random genomes, policies, local learning, exact communication assay.
- `src/world.js`: resource world, connections, reproduction, checkpoints.
- `src/app.js`: graphical viewer and controls.
- `scripts/experiment.mjs`: reproducible headless comparisons.
- `test/`: deterministic replay, inheritance isolation, intervention and learning checks.
- [Research lineage](docs/research.md): original emergent-language experiments and their limitations.
- [Design](docs/design.md): what this first experiment is trying to establish.

MIT license. Built for Antti Luode's EmergenceAstra experiments.
