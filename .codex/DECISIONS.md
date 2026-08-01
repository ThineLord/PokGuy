# Maintenance Decisions

Architecture and poker-rule decisions remain authoritative in `ARCHITECTURE.md` and `POKER_RULES.md`. This file records only maintenance-loop decisions.

## 2026-08-01 — Preserve the existing Phase 8.0 worktree

- Treat all files present at startup as user-owned work.
- Audit and validate them as one coherent Review Lab checkpoint instead of replacing or splitting them blindly.
- Allow only directly related, independently verified repairs before checkpointing.

## 2026-08-01 — Keep product state and recovery state separate

- `docs/IMPLEMENTATION_STATUS.md` and `docs/NEXT_STEPS.md` describe product capabilities and roadmap.
- `.codex/` records exact branch, SHA, dirty state, validation evidence, risks, and resume commands.
- State files must never contain credentials, user data, or private machine paths.

## 2026-08-01 — Preserve compatibility boundaries

- Do not change the poker engine, public behavior, LocalStorage key, or v2 schema during PKG-001.
- Do not infer a new license, product rebrand, or tournament behavior.
- Do not begin the proposed v3 decision-snapshot migration without a separate design checkpoint because it changes stored data.

## 2026-08-02 — Recover fields without rewriting the storage contract

- Keep `riverlab-poker-v2` and schema version 2 unchanged.
- Preserve any complete, unique pool of at least eight valid AI profiles, including custom-only pools; repair only malformed entries and only pad damaged short pools to eight.
- Treat an explicit empty AI selection as “use the complete profile pool,” matching existing behavior.
- Drop incomplete AI habit observations rather than passing unsafe partial objects to the UI or silently inventing statistics.
- Keep repaired startup data in memory until the next normal save. Do not immediately overwrite the raw record because an unknown future schema could otherwise be destructively downgraded.
