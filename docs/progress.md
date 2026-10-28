# Implementation record

2026-10-28. Initial repository contained the MIT license only.

- Implemented seeded independent random policy tables, local policy-gradient updates and a non-mutating exact intervention assay. The initial two tests failed for missing features, then passed after implementation.
- Implemented spatial resource dynamics, energetic development, functional bonds, mutated genetic offspring, and full simulation checkpoints. Four ecology tests failed before implementation, then passed.
- Implemented Canvas viewer, controls, policy inspection, measurement history and checkpoint download/import. Syntax checked. Real browser rendering could not be verified because a browser executable was unavailable and the attempted download returned invalid content.
- Ran five paired seeds for both the stationary culture and spatial ecology; preserved all outputs in results.json. Results and limitations are in results.md.
- Independent code review found four issues: live scrambling differed from assay shuffling; invalid histories/immutable parameters were accepted in checkpoints; UI overstated learning attribution; finite limits were not exposed. Added regression tests before fixes. All eight tests passed afterward.
- Kept live uniform scrambling and exact marginal-preserving assay shuffling as distinct, explicitly documented experiments. The UI calls the live control “Scramble signals”; README explains both distributions. Neither is evidence of an independent empirical one-third result.
- Chose byte genomes and mutable local tables instead of a transformer for this first experiment. Developmental weights evolve at birth; communication weights learn during life. This distinction is explicit, and a neural developmental substrate remains a future extension rather than a concealed claim.
- Local HTTP check: HTML, JavaScript and CSS served with correct types; missing paths returned 404; hidden git paths returned 403. Core test suite: 8 passed, 0 failed. No third-party runtime dependencies.

Remaining research limitations: a small fixed repertoire, imposed population ceiling and maximum age, weak selection in the initial runs, and no claim of novel artificial life, natural-language syntax, or open-ended evolution. No unfinished code-review fixes remain; visual browser testing remains outstanding.
