# Before LLMs: agents inventing shared codes

The user's recollection has several plausible matches. They are related, but different experiments.

## Talking Heads — Luc Steels and colleagues, 1990s–2001

Embodied agents viewed scenes and repeatedly played language games. They developed categories and a shared lexicon through local interaction. The 1999 paper describes agents taking turns as speaker and hearer, without centralized coordination or access to one another's internal state. This is the closest early precedent for a visible world where conventions are built through encounters.

Primary sources:

- [Steels, The Origins of Syntax in Visually Grounded Robotic Agents, IJCAI 1997](https://ijcai.org/proceedings/1997/236)
- [Steels and Kaplan, Situated Grounded Word Semantics, IJCAI 1999](https://ijcai.org/proceedings/1999/123)
- [Steels, The Talking Heads Experiment: Origins of Words and Meanings](https://langsci-press.org/catalog/book/49), open-access retrospective covering 1999–2001.

## Neural referential games — Lazaridou, Peysakhovich and Baroni, 2017

A sender was told which image was the target. A receiver used a message from an arbitrary vocabulary to choose it. Small networks learned to coordinate. The game and what participants could observe substantially shaped the resulting code.

- [Original paper and authors' summary](https://ai.meta.com/research/publications/multi-agent-cooperation-and-the-emergence-of-natural-language/)
- [ICLR paper](https://openreview.net/pdf?id=Hk8N3Sclg)

## Grounded communication in a 2D world — Mordatch and Abbeel, 2017/2018

Cooperative agents learned communication while performing spatial tasks. Their abstract symbols could acquire grounded, compositional uses. The authors explicitly attribute success to careful task design, reinforcement learning, and a differentiable communication channel. Nobody provided the final dictionary, but researchers did provide the communication machinery and incentives.

- [OpenAI, Learning to Communicate, March 2017](https://openai.com/index/learning-to-communicate/)
- [Emergence of Grounded Compositional Language in Multi-Agent Populations](https://arxiv.org/abs/1703.04908)

## The Facebook negotiation story — 2017

The widely reported bots that drifted away from English began with human dialogue training and were then optimized for negotiation. This was not language arising from wholly random agents, nor evidence that researchers discovered uncontrollable artificial life.

- [Meta's original report, Deal or No Deal?](https://engineering.fb.com/2017/06/14/ml-applications/deal-or-no-deal-training-ai-bots-to-negotiate/)

## What we borrow

Arbitrary initial signalling policies; repeated local interaction; asymmetric information; feedback from a shared consequence; continuous evaluation; and intervention on the communication channel.

What we add experimentally is a graphical resource world in which the same cells learn, develop connections and bud descendants. This combination is an implementation choice, **not an established novelty claim**. Signalling games, learning agents and artificial-life ecosystems have extensive prior art. This repository is not a replication of any one paper.

## The frozen/dynamic distinction

Fixed rules can generate changing structures; learned weights can also remain fixed at deployment. These are different senses of dynamism. Here communication weights change during simulation, while development weights change genetically at birth. That makes local lifetime adaptation real and inspectable without pretending every rule is self-modifying.

Related work for a richer next substrate:

- [Growing Neural Cellular Automata](https://distill.pub/2020/growing-ca/): local neural update rules trained to grow and repair structures. Training for a supplied target image is not open-ended organism evolution.
- [Neural Developmental Programs](https://arxiv.org/abs/2307.08197): local developmental processes for growing neural networks.
- [HyperNCA](https://arxiv.org/abs/2204.11674): cellular automata developing neural-network parameters.

Randomness alone neither explains the origin of life nor makes a simulation alive. For this project the productive question is concrete: **which locally learned changes survive, alter what the world can do, and become available to further development?**
