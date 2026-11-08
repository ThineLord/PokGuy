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

Settings, statistics, notes, the most recent 100 hands and up to 500 training records are stored in LocalStorage. Storage is separate for each device, browser and site address; changing a port also changes the origin. Clearing site data removes saved records. Reloading starts a new cash session rather than restoring a live hand.

### Backup and restore

1. In **Settings → Import and export**, choose **Export full backup**. Keep the JSON outside the public repository.
2. On the destination browser, choose **Import backup or legacy settings** and select that file (maximum 10 MB).
3. Check the **Restore preview**, including the player, hands, notes and reviews. Cancel leaves the existing data intact.
4. **Confirm restore** replaces saved data and preferences and starts a new hand. Export the destination's current backup first if you want to keep it.

The full backup includes settings, AI profiles/habits, all retained completed hands, cash/scenario/legacy statistics, notes, decision reviews, language and theme. Active hands and the in-memory cash/scenario return snapshot are excluded. The separate **Export hand history** file is for inspecting hand records; it is not a full restorable backup. Older settings exports are explicitly recognized and replace only settings/profiles while preserving the active hand and current records.

If saving fails, a **Changes are not saved** warning stays visible. Use **Retry save** after freeing storage, or **Export full backup** to rescue the current in-memory data before closing. A failed restore keeps the current in-memory data; a rollback problem keeps the rescue warning until a complete retry succeeds. Browser unload warnings are best-effort, so export rather than relying on the warning.

### Statistics, reviews and mobile details

Select **Cash table**, **Scenarios** or **Legacy mixed statistics** on the Statistics page. Old mixed totals cannot be accurately reconstructed from the last 100 hands, so they remain separate and do not feed current cash AI adaptation. VPIP/PFR count hands with actual preflop actions; three-bet/c-bet denominators count actual opportunities. Review counters describe retained hands in the selected mode.

**Not assessed** means the heuristic cannot justify a positive or negative verdict. New reviews show action-time information, including stack, call price and rough equity. Equivalent shoves and bets use the same sizing rules; these warnings still do not establish optimal strategy.

Tap any seat to read its full name, public stack, position and status. Close or press Escape to return focus. Hidden cards remain hidden, and poker keyboard shortcuts pause while details are open.

The application version is separate from storage schema v2. Version 0.3.0 adds compatible statistics fields and preserves old totals. Full backups use a separate format version, currently 1.

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

See [release notes](../releases/0.3.1.md) for the version's scope and [GitHub issues](https://github.com/ThineLord/PokGuy/issues) to report a problem. Include the version, browser, reproduction steps and expected result; do not attach private hand-history exports unless you intend to share them publicly.
