# PokGuy

[English](README.md) · [简体中文](README.zh-CN.md)

**Practice a hand. Review your decisions. Build your poker intuition.**

PokGuy is a local-first Texas Hold’em trainer for solo practice against configurable AI opponents. Play 2–9 seat cash tables, build a hand scenario, and revisit your decisions with hand history and statistics. No account or real-money play is involved.

**For users:** start with the [user README](docs/user/README.md).

**For agents:** read [AGENTS.md](AGENTS.md), then the [agent README](docs/agent/README.md).

## Start locally

Use **Node.js 22.13+ (22.x recommended)** and npm.

```bash
git clone https://github.com/ThineLord/PokGuy.git
cd PokGuy
npm ci
npm run dev
```

Open the local address printed by the terminal, normally **http://localhost:3000**. Keep the server running while you practice.

## Practice, review, repeat

- **Play:** 2–9 players, eight editable AI personalities, legal-action guidance, side pots and showdown explanations.
- **Train:** choose hole cards, position, stack size and starting street; toggle hints as needed.
- **Review:** replay recent hands, add notes, inspect decision feedback and track statistics.
- **Make it yours:** English/Chinese UI, light/dark/system appearance, card backs and animation controls.

Game records stay in the current browser. Export a JSON backup from Settings before clearing site data or changing devices. AI feedback is a training heuristic, not a GTO solver. See [usage and limitations](docs/user/README.md).

## Find your way

```text
app/              page entry points and styles
src/              poker engine, AI, interface and browser storage
public/           application assets
tests/            unit and browser tests
docs/             user, agent, architecture and release documentation
scripts/          repository and release validation
build/ + worker/  build integration and Worker entry point
```

## Versions and documentation

Current version: **0.2.0**. Releases use `vMAJOR.MINOR.PATCH` tags and [GitHub Releases](https://github.com/ThineLord/PokGuy/releases). Application versions and browser storage schema versions are independent.

- [What changed in 0.2.0](docs/releases/0.2.0.md) · [Changelog](CHANGELOG.md)
- [Documentation index](docs/README.md) · [Development and tests](docs/development/README.md)
- [Version and release workflow](docs/releases/README.md)

PokGuy is for learning and personal practice. It has no deposits, withdrawals or real-player matchmaking. A source release does not establish a verified hosted deployment.
