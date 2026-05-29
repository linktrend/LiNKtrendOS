# Devin Session Naming Standard

## Canonical Format

```
UBS-{DOMAIN}-{SUITE}-{SECTION}-W{WAVE}-L{LANE}-S{STAGE}
```

## Field Definitions

| Field   | Values                                                                 | Description                              |
|---------|------------------------------------------------------------------------|------------------------------------------|
| DOMAIN  | LEGAL · ACCOUNTING · OPS · MARKETING · SALES · HR · IT · FINANCE · COMPLIANCE | Business domain of the work              |
| SUITE   | Short code (e.g., LEGAL, LSKILLS, LAIOS, LBRAIN, LBOT, LSITES, LAPPS) | Product suite or system target           |
| SECTION | Short scope code (e.g., INTAKE, EVIDENCE, DRAFTING, LEASE, KERNEL)     | Functional section within suite          |
| WAVE    | 1..N                                                                   | Execution wave number                    |
| LANE    | 01..99                                                                 | Parallel lane within the wave            |
| STAGE   | RSRCH · SYNTH · BUILD · TEST · LOCK                                   | Current lifecycle stage                  |

## Stage Definitions

| Code  | Phase        | Description                                           |
|-------|--------------|-------------------------------------------------------|
| RSRCH | Research     | Discovery, issue analysis, codebase exploration       |
| SYNTH | Synthesis    | Combining findings, architecture decisions            |
| BUILD | Build        | Implementation passes (Pass1–Pass3)                   |
| TEST  | Test         | Verification, CI, proof generation                    |
| LOCK  | Lock/Rework  | Final verification or rework loop before merge        |

## Rules

1. Every active Devin session MUST carry a canonical name matching this format.
2. Session title in the Devin UI is renamed to the canonical name at session start.
3. Each session posts a first-turn status block (see below) before substantive work.
4. The canonical name is referenced in commit messages, PR titles, and agent reports.

## First-Turn Status Block (required)

```
SESSION_NAME: <canonical_name>
MATRIX_ROW: <row_id>
STAGE: <stage>
SCOPE: <one-line scope description>
OUTPUT_GATE: <definition of done>
NEXT_CHECKPOINT_UTC: <ISO 8601 timestamp>
```

## Examples

```
UBS-LEGAL-LEGAL-INTAKE-W1-L01-SBUILD     — Legal suite, intake section, wave 1, lane 1, building
UBS-IT-LSKILLS-LEASE-W1-L01-SRSRCH       — IT domain, LinkSkills suite, lease section, research
UBS-OPS-LAIOS-KERNEL-W2-L03-STEST        — Ops domain, LiNKaios suite, kernel section, testing
UBS-MARKETING-LSITES-LANDING-W1-L02-SSYNTH — Marketing, LinkSites, landing pages, synthesis
```

## Relationship to Workflow Matrix

Each canonical session name corresponds to exactly one row in `WORKFLOW_MATRIX_REGISTRY.md`. The matrix is the single source of truth for active lane status across all Devin sessions.
