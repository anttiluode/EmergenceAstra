# Living rules, first experiment

Intent: a visible, persistent world in which initially arbitrary symbols acquire consequences through local interaction. Inherited rules, lifetime learning, and physical development must be distinct and inspectable. This is a substrate to extend, not a claim of artificial life or open-ended evolution.

Implementation choices made by Astra: dependency-free JavaScript, Canvas rendering, CPU simulation, offline after loading. Random byte genomes decode to small policy tables. Unlike a transformer, these tables are cheap enough to give every cell independent mutable rules and make the full mechanism visible. A shared frozen neural interpreter and per-cell trainable networks are possible later alternatives; neither is required to test the feedback loop first.

Each cell can both send and receive. In an encounter the sender senses one of three local resource types; the receiver sees only one of four arbitrary symbols and chooses one of three catalysts. Matching the resource releases energy shared by both. The engineered task creates a reason to communicate; symbol meanings are not supplied. A local reward updates the chosen rows of both cells' policy tables by a softmax policy gradient. There is no population-wide trainer or access to another cell's tables.

Development uses another random inherited table conditioned on energy and the last received symbol: rest, bud into a vacant neighboring site, reinforce a connection, or prune a connection. These table parameters are inherited and mutated, while the changing inputs drive development throughout life. Communication tables also learn during life. Connections affect partner choice and cost maintenance. Resource consumption alters the surroundings. Reproduction costs energy and copies the original genome with mutation; learned weights are NOT inherited by default.

The fixed substrate includes resource categories, action vocabulary, learning rule, neighborhood, reward coupling, energy accounting and population ceiling. Bodies and alphabets do not grow without bound. This boundary must be explicit in the UI and README. Random initial conditions alone are not a theory of life's origin.

Assessment: show continuous expected coordination on a balanced synthetic resource task over local cell pairs, using frozen current policies. Scrambled signals preserve the sender's marginal symbol distribution but remove resource dependence. The assay must not mutate the world or advance its RNG. It measures use of symbols in this task, not syntax or intelligence. A headless fixed-population culture experiment isolates learning from reproduction and ecology, comparing adaptive and frozen tables over multiple seeds. The full ecology may fail to retain its conventions; keep that result rather than replacing it with the culture result.

Interface: dark microscope-like world; resource layer, lineages, signal pulses and functional connections; start/pause, seed reset, speed, plasticity, growth and channel controls; selected-cell genome/learned policy; export/import full state; logged continuous assay. No network dependencies or telemetry.

Validation: deterministic replay, exact checkpoint continuation, learning/frozen controls, causal channel intervention, energy and population bounds, extinction, malformed saves, UI controls on desktop/mobile.
