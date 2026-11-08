# PokGuy user README

[English](README.md) · [简体中文](README.zh-CN.md) · [Project home](../../README.md)

PokGuy helps you practice Texas Hold’em and review how you played. It runs through a local web server; gameplay and saved records are handled in your browser.

## Start a practice session

1. Follow the [local setup](../../README.md#start-locally).
2. On the table, choose 2–9 seats and start a new table. Changing the selector alone does not interrupt the current hand; starting a new table resets its stacks.
3. Use Fold, Check, Call, Bet, Raise or All-in when available. The trainer validates legal sizes and explains settlement after the hand.
4. Open the scenario builder to practice a chosen position, stack, hole cards and starting street. Returning to cash play restores the cash table kept in memory for that session.
5. Open history to replay recent hands, add notes and filter decisions for review. Statistics summarize your practice; small samples can be misleading.

On desktop, `F/K/C/R/A` activate Fold/Check/Call/Raise/All-in when the corresponding action is available and you are not editing a field.

## Settings and data

Settings include AI personalities, training hints, language, light/dark/system appearance, card backs and animation speed. Eight AI personalities provide different playing tendencies; their feedback and Monte Carlo estimates are approximate, not solver recommendations.

Settings, statistics, notes and the most recent 100 hands are stored in browser LocalStorage. Export JSON in Settings for backup and import it on another browser when needed. Storage is separate for each device, browser and site address; changing a port can also change the storage origin. Clearing site data removes saved records. Reloading starts a new cash session rather than restoring a live hand.

The application version is separate from storage schema v2. Upgrading to 0.2.0 does not require a data migration. Export before upgrades as a routine backup, and keep exports outside the public repository.

## Phone or tablet on the same Wi-Fi

On your computer, run:

```bash
npm run dev:lan
```

Connect both devices to a trusted Wi-Fi network and open the terminal's network address on the mobile browser. This exposes the development server to that network until you stop it. Records do not sync automatically; transfer an export if needed.

## Limits

- Cash-table and single-hand practice only; no full tournament management, real-player matchmaking or real-money functions.
- AI estimates use sampled unknown cards and training heuristics, not opponent-range solving, GTO or guaranteed profit.
- No automatic cloud sync, installable offline PWA or sound assets. The sound setting is reserved for future work.
- Browser storage can fail and multiple tabs can overwrite each other's latest saved data. Use one active tab and keep backups.
- Responsive browser tests do not certify behavior on physical iPhone/iPad hardware. Hosted deployment has a separate verification boundary.

See [release notes](../releases/0.2.0.md) for the version's scope and [GitHub issues](https://github.com/ThineLord/PokGuy/issues) to report a problem. Include the version, browser, reproduction steps and expected result; do not attach private hand-history exports unless you intend to share them publicly.
