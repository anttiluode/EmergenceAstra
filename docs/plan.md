# Living rules implementation plan

Goal: implement docs/design.md in the provided empty repository.

1. `src/core.js`, `test/core.test.js`: seeded RNG, random byte genomes, independent sender/receiver policies, local learning and intervention assay. Prove adaptive learning in a stationary culture and non-mutating assay before adding the ecology.
2. `src/world.js`, `test/world.test.js`: spatial resource world, energetic development, functional bonds, reproduction/mutation, deterministic checkpoints. Test continuation, no sharing of mutable weights, frozen controls, extinction and malformed input.
3. `index.html`, `style.css`, `src/app.js`, `scripts/serve.mjs`: Canvas viewer, live policies, controls and downloads. Exercise in a browser including mobile and save/reload.
4. `scripts/experiment.mjs`, `README.md`, `docs/research.md`: run multiple seeds, keep stationary and ecological results separate, write measured findings with reproducible commands and primary-source references.

Review focus: information leakage into receivers; assay altering training; learned weights mistaken for inherited genome; nonsensical imports; learning claims exceeding measurements. Review the implementation before pushing to the supplied repository.
