# Initial measurements — 2026-10-28

Command:

```sh
node scripts/experiment.mjs --seeds 5 --rounds 60000 --ticks 3000 > results.json
```

Node v24.22.1. Seeds 1–5. Exact frozen-policy expected coordination, not sampled task accuracy. No confidence interval is claimed from five exploratory seeds. [Raw trajectories](results.json).

| Seed | Culture adaptive | Culture frozen | Ecology adaptive | Ecology frozen |
|---|---:|---:|---:|---:|
| 1 | 89.94% | 33.13% | 38.39% | 33.36% |
| 2 | 90.66% | 32.94% | 38.11% | 33.34% |
| 3 | 87.74% | 33.55% | 38.29% | 33.35% |
| 4 | 90.09% | 33.04% | 37.77% | 33.41% |
| 5 | 85.93% | 33.19% | 38.54% | 33.37% |

Culture: 12 fixed agents, ring neighbors, 60,000 encounters, no resource world or evolution. Ecology: 96 founders on 48×32 sites, 3,000 ticks, growth enabled. The shuffled/muted balanced assay equals 33.33% by construction in both settings.

All ecological arms reached the imposed 550-cell ceiling. There were zero or one deaths per arm by 3,000 ticks. Consequently these runs do not demonstrate substantial natural selection or that learning is required for ecological persistence. They do show a measured learning advantage on the diagnostic within the full growing simulation.

The next experiment should increase ecological consequences of coordination and examine turnover beyond 6,000 ticks (the fixed maximum cell age). Retain this first baseline rather than interpreting its population plateau as an evolved equilibrium.

Validation: 8 automated tests passed after review fixes, including exact checkpoint continuation and malformed-checkpoint rejection. Local HTTP serving and JavaScript syntax checked. Browser visual verification was unavailable in this environment: Playwright was installed, but no browser executable was present and the browser download returned invalid content.
