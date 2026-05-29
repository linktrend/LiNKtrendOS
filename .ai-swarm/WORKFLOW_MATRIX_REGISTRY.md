# Workflow Matrix Registry

> Single source of truth for all active Devin session lanes.
> Updated by each session at start and at stage transitions.

## Active Lanes

| row_id | canonical_session_name              | domain | suite    | section | wave | lane | stage | owner | github_issue | status      | checkpoint_utc       |
|--------|-------------------------------------|--------|----------|---------|------|------|-------|-------|--------------|-------------|----------------------|
| R001   | UBS-IT-LSKILLS-LEASE-W1-L01-SRSRCH | IT     | LSKILLS  | LEASE   | 1    | 01   | RSRCH | devin | —            | in_progress | 2026-05-29T15:30:00Z |

## Column Definitions

| Column                | Description                                                    |
|-----------------------|----------------------------------------------------------------|
| row_id                | Unique row identifier (R001, R002, …)                          |
| canonical_session_name| Full UBS naming standard identifier                            |
| domain                | Business domain (LEGAL, IT, OPS, etc.)                         |
| suite                 | Product suite short code                                       |
| section               | Functional section within suite                                |
| wave                  | Execution wave number                                          |
| lane                  | Parallel lane within wave                                      |
| stage                 | Current stage (RSRCH, SYNTH, BUILD, TEST, LOCK)                |
| owner                 | Agent or developer owning the lane (devin, cursor, codex, etc.)|
| github_issue          | Linked GitHub issue number or "—" if none                      |
| status                | in_progress · blocked · completed · parked                     |
| checkpoint_utc        | Next expected checkpoint (ISO 8601)                            |

## Stage Transition Protocol

1. When a session advances stage, update `stage` and `checkpoint_utc` in this file.
2. When a session completes, set `status` to `completed` and clear `checkpoint_utc`.
3. When blocked, set `status` to `blocked` and note the blocker in the session's agent report.
4. Parked lanes retain their last stage for resumption context.

## Completed Lanes (archive)

| row_id | canonical_session_name | domain | suite | section | completed_utc | outcome |
|--------|------------------------|--------|-------|---------|---------------|---------|
| —      | —                      | —      | —     | —       | —             | —       |
