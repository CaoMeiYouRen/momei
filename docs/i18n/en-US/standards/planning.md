---
source_branch: master
last_sync: 2026-08-07
translation_tier: summary-sync
---

# Planning & Evaluation Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../../standards/planning.md) shall prevail.
:::

## 1. Overview

This document provides a scientific and actionable methodology for the evolution of the "Momei" project. Through clear constraints and evaluation matrices, we ensure that development resources are focused on core value, preventing the project from losing focus due to "Scope Creep."

## 2. Planning Constraints

When conducting phase planning or introducing major features, the following hard constraints must be followed:

-   **Phase Focus**:
    -   High-level core tasks in a single development iteration (Phase) should be limited to **5-6 items**.
    -   When new requirements cause the count to exceed this limit, a "One In, One Out" principle must be applied to ensure focus.
-   **Decoupling**:
    -   The introduction of new features must not break existing core logic (e.g., Auth, Article display, SEO).
    -   If core architecture changes are involved, technical research must be conducted first, and `docs/design/` documents must be updated.
-   **Test-First Planning**:
    -   Testing plans (unit or E2E) must be formulated alongside task planning.
    -   Any functional planning that does not include a test completion plan is ineligible for admission.
-   **Priority Driven**:
    -   An ROI (Return on Investment) analysis must be conducted during planning. Priority is given to features that directly improve user experience or represent core competitiveness.
-   **Acceptance Specificity**:
    -   Every phase item written into `roadmap.md` or `todo.md` must at least define: execution scope, non-goals, verifiable acceptance criteria, minimal verification matrix / evidence landing point, and rollback boundary when needed.
    -   Vague wording such as "optimize it a bit" or "a round of governance" is forbidden as formal admission text; if the information is insufficient, the item stays in backlog candidate analysis and cannot be promoted to a formal phase task.
-   **Script-First Governance**:
    -   Long-running governance, quality debt, reuse convergence, comment governance, doc governance, and script governance items must explain a repeatable quantitative baseline before being promoted to `roadmap.md` / `todo.md`.
    -   Prefer repository scripts that produce baseline / target / bucket stats / output landing points; if no script exists yet, write the "to-be-added script entry, planned landing point, and temporary manual criteria" into the acceptance criteria. Narrative-only goals are forbidden.
-   **Design-First Gate**:
    -   When an item meets any of the following, a design document must be completed before implementation: new module, cross-module boundary changes, data / interface contract rewrites, standalone governance topic, or impact on multiple subsystem main flows.
    -   Design docs must land in `docs/design/modules/` or `docs/design/governance/` and keep an auditable written artifact before development; do not merge "design + full implementation" into one vague TODO and skip the design artifact.
-   **Phase Transition Gate**:
    -   Even when all TODOs of the current phase are checked, the phase is still **in closing** until `todo.md` cleanup, regression record archiving, phase summary, and `todo-archive.md` archiving are complete.
    -   Before the current phase is archived, it is forbidden to open the next phase's formal planning directly in `roadmap.md`; new requirements default to `backlog.md` until the current phase is archived.
-   **Planning & Documentation Review First**:
    -   Planning docs, TODO docs, archive docs, standards docs, and other Markdown changes are formal changes requiring review; "it's just docs" is not an excuse to skip review.
    -   Every change needs at least one review round before commit; if no clear conclusion or the issue list is not closed, the change must not enter commit.
-   **In-Iteration Intake Gate**:
    -   New issues, ideas, or optimizations discovered during development, testing, auditing, or integration default to **not** automatically merging into the current phase.
    -   Agents must first verify whether the item is already in scope of the current `todo.md`, current acceptance criteria, or `roadmap.md`; only in-scope items may proceed directly.
    -   Out-of-scope items need a quick requirement evaluation first to decide "high-priority item allowed to jump the queue" vs "deferred backlog item"; entering development before this decision is forbidden.
-   **Requirement Interview & Intent Extraction**:
    -   For vague requirements, agents **must** use an "interview" approach to ask the user clarifying questions rather than guessing.
    -   Interview Principles: Structured before detailed; one question at a time; goal is to extract the core, true business need.
    -   Entering the "Do" phase is strictly prohibited before core requirements are aligned.

## 3. Evaluation Methodology: Momei Matrix

To objectively evaluate whether a proposed feature or change should enter "Near-term Planning," the following scoring system is introduced:

### 3.1 Scoring Dimensions

| Dimension | Description | Score (1-5) |
| :--- | :--- | :--- |
| **Value** | Improvement to core user experience or business value. | 1 (Low) - 5 (Very High) |
| **Alignment** | Consistency with long-term goals in the [Roadmap](../plan/roadmap.md). | 1 (Disparate) - 5 (Core) |
| **Complexity** | Technical difficulty, man-hours, and library limitations. | 1 (Very Easy) - 5 (Extreme) |
| **Risk** | Potential for bugs, performance degradation, or maintenance debt. | 1 (Safe) - 5 (High Risk) |

### 3.2 Calculation Formula

$$Score = \frac{Value + Alignment}{Difficulty + Risk}$$

### 3.3 Admission Criteria

-   **Score \> 1.5**: High priority for the current or next Phase.
-   **1.0 \< Score \<= 1.5**: Enters the `Backlog`, allocated based on remaining resources.
-   **Score <= 1.0**: Unless it is a security fix (Hotfix), it should be canceled or shelved indefinitely.

### 3.4 Mid-Iteration Triage

When additional items are discovered while executing the current iteration, handle them in the following order:

1.  **Scope check**: first check whether the item already exists in `docs/plan/todo.md`, the current task's acceptance criteria, `docs/plan/roadmap.md` current phase, or the historical entries of `docs/plan/todo-archive.md`.
2.  **Classification**:
    -   **Class A: in-scope items**. If the item essentially completes the current task's existing acceptance criteria, fixes an omission in the current implementation, or is necessary collateral work for closing the current task, it may proceed, with a note in the task record; do not use it to expand the requirement boundary.
    -   **Class B: queue-jumping items**. Allowed to interrupt the current iteration only when at least one of the following holds: blocking current TODO delivery, causing a clear functional regression, a high-risk security / compliance issue, a high-severity vulnerability in the current dependency chain, or a base defect the current task cannot bypass. Such items must carry a reason note and be added as fix-type or derived tasks in the current phase.
    -   **Class C: deferred items**. New experience optimizations, non-blocking refactors, exploratory ideas, future feature extensions, and non-urgent dependency upgrades are deferred; they must not interrupt the current phase.
3.  **Capacity control**: if Class B items push the core task count beyond 5-6, apply "One In, One Out" and move a lower-priority item to `backlog.md`.
4.  **Record landing points**:
    -   Class A: keep in the current task context, add acceptance notes when needed.
    -   Class B: write into `todo.md` current phase with the queue-jumping reason or blocking background.
    -   Class C: write into `docs/plan/backlog.md`; never disguise them as current-phase tasks.

## 4. Roadmap & TODO Management Workflow

### 4.1 Roadmap Updates
-   `docs/plan/roadmap.md` undergoes a major version review monthly.
-   Completed tasks should be marked with `(Completed)`.
-   A new Phase can only be started after the core metrics of the previous Phase are achieved.
-   **Phase transition prerequisites**: the previous phase may only start the next phase's formal planning in `roadmap.md` after `todo.md` is cleaned, regression records are archived, and content is in `todo-archive.md`; before that, new requirements always go to `backlog.md`.
-   **Backlog dual-track maintenance**: `docs/plan/backlog.md` must distinguish at least "long-term mainline tasks" and "short-term / one-off candidate tasks". Long-term mainlines span multiple phases; short-term candidates are single-evaluation, single-phase, or closable-after-completion items.
-   **Phase promotion de-duplication**:
    -   When a long-term mainline is sliced into a phase, the mainline card must not disappear from `docs/plan/backlog.md`; keep it and record "last promoted phase", "current status", and "next slice direction".
    -   When a short-term / one-off candidate is formally promoted, remove it from `docs/plan/backlog.md` or rewrite it as "promoted to phase X" history.
    -   The full implementation body of the same item must never appear in both the current/new phase planning and the backlog; backlog keeps only mainline summary cards or candidate entries.

### 4.2 TODO Maintenance
-   `docs/plan/todo.md` is the real-time operational manual, containing **specific implementation tasks for the current phase only**.
-   `docs/reports/regression/current.md` is the active regression window; `todo.md` keeps only current-phase context, summaries, and links.
-   The active window keeps only the last 1-2 phases or 6-8 full regression records; older ones rotate to `docs/reports/regression/archive/`.
-   Task status must be clearly marked: `[ ]` (Pending), `[x]` (Completed), `[-]` (Canceled).
-   Task descriptions should include specific "Acceptance Criteria" covering scope, non-goals, verifiable results, verification method / evidence, and rollback boundary when needed.
-   **Anti-Duplication Principle**: Before planning or adding any new feature, **always** check `docs/plan/todo.md`, `docs/plan/roadmap.md`, and `docs/plan/todo-archive.md`. Duplicate designs for tasks that are already archived, in progress, or on the roadmap are forbidden.
-   **Mid-discovery handling**: newly discovered issues must not all be stuffed into `todo.md`; only Class A or B items per section 3.4 enter the current phase's execution surface.
-   **No minimal interpretation when acceptance is insufficient**: if acceptance criteria are insufficient to judge a reasonable scope, return to planning to supplement or clarify the criteria instead of shrinking the implementation by minimal interpretation and claiming completion.
-   **Functional requirement management**:
    -   New features / requirements: must go to `docs/plan/backlog.md`.
    -   New requirements while the phase is not archived: stay in `backlog.md`, not `roadmap.md`.
    -   Current-phase tasks: may be promoted from backlog to roadmap / todo only after evaluation.
    -   Long-term mainlines (coverage governance, test effectiveness, ESLint / type debt, reuse convergence, periodic regression, performance / security baselines) stay in the backlog mainline area with last promoted phase, current baseline, and next slice candidate.
    -   Short-term candidates once promoted: remove from backlog; mainlines keep their card and only drop fully duplicated body text.
    -   Urgent fixes: bug and security fixes may be added to the current phase's todo, clearly labeled as fix type.
    -   Optimizations: evaluate first, then decide backlog vs current-phase todo.
-   **Review-first**: planning changes, archive cleanup, regression record updates, and standards updates need at least one review round before commit; unreviewed planning changes are not formally effective.
-   **Periodic regression tasks**: code optimization and reuse convergence, ESLint warning / type debt, `database/*/init.sql` vs entity / design doc sync, README / deploy / translation doc sync, i18n large-file split initialization field completeness, test completion and coverage governance, performance baseline audits, dependency security audits, stale script cleanup, and `max-lines` overrun / `eslint-disable max-lines` temporary exemption convergence should be planned as standalone governance tasks or phases with explicit timeout budgets and recorded results.
-   **Quantified source of truth first**: for ESLint / type debt, structure reuse, comment governance, doc governance, and script governance mainlines, prefer repeatable scripts outputting progress; if a mainline has only narrative conclusions without baseline / delta source, build the script base first.
-   **Regression isolation**: periodic items default to standalone governance tasks and do not inflate normal feature requirements; queue-jumping is allowed only when blocking delivery, causing functional regression, or posing high-risk issues.
-   **Regression record landing**: periodic regression, phase baselines, re-runs, and Review Gate evidence bodies default to `docs/reports/regression/current.md`; `todo.md` and `roadmap.md` keep only task status, phase summaries, and doc entries.
-   **Regression log rotation**: when `docs/reports/regression/current.md` exceeds 500-700 lines or accumulates more than 6-8 full records, migrate older records to `docs/reports/regression/archive/`; keep enough near-line records for recent baseline comparison and release decisions.

#### Dependency Security Regression Rules

Dependency security audits are mandatory in periodic regression tasks:

1.  **Data source priority**: read Dependabot / Security pages first; fall back to `pnpm audit --registry=https://registry.npmjs.org/` or another reproducible official source when the toolchain cannot access them stably.
2.  **Fixable items first**: if an upgrade, replacement version, or lockfile-override fix exists, fix it and complete `lint`, `typecheck`, targeted tests, or equivalent runtime verification in the same task.
3.  **Unfixable item scope**: record only `high` and above issues when no fix exists or the fix exceeds the current phase scope; `moderate` / `low` may be ignored in the conclusion.
4.  **Deferral or planned-fix judgment**: for recorded unfixable `high+` risks, additionally write the impact scope, temporary mitigation, reasons for temporary shelving, or the trigger conditions and expected window for planned fixes; "risk exists" alone is forbidden.
5.  **Queue-jumping boundary**: `high+` vulnerabilities that block release, affect online entries, or trigger compliance requirements may be inserted as Class B items; other low-priority upgrades must not be expanded into large upgrade projects.

#### Periodic Regression Task Template

Each regression task includes at least: scope, trigger conditions, frequency, timeout budget, and output format (executed verifications, result summary, Review Gate conclusion, issue grading, uncovered boundaries, and follow-up re-run plan; plus test / browser / performance / dependency security results per the verification matrix).

Suggested default frequencies: ESLint / type debt / `max-lines` weekly; `init.sql` vs entity sync before each release; README / deploy / translation sync before each release; i18n initialization field audits weekly and after every large locale split; script entry cleanup biweekly; governance quantification script baseline re-checks biweekly; coverage governance and performance baseline audits weekly or before phase close; dependency security audits before release or weekly.

#### Fixed Scheduling Entries

| Cadence | Entry | Minimal fixed bundle | Blocker rule |
| :--- | :--- | :--- | :--- |
| Weekly | `pnpm regression:weekly` | `test:coverage` + `security:audit-deps` + `docs:check:source-of-truth` + `docs:check:i18n` + `docs:check:line-count` + `i18n:audit:missing` + `duplicate-code:check` + `governance:check:scripts` | Any required command failure is a blocker; active log window overrun first recorded as warning |
| Pre-release | `pnpm regression:pre-release` | `release:check:full` (incl. `i18n:audit:missing`) + `docs:check:i18n` + `docs:check:line-count` + `test:perf:budget:strict` + `duplicate-code:check` | Any required command failure is a blocker |
| Phase close | `pnpm regression:phase-close` | `test:coverage` + `release:check:full` + `docs:check:i18n` + `docs:check:line-count` + `test:perf:budget:strict` + `duplicate-code:check:strict` + `review-gate:generate:check` | Any required command failure is a blocker; `current.md` over 700 lines or 8 records without rotation is also a blocker |

Additional constraints: generated artifacts are only reference evidence; formal summaries land in `docs/reports/regression/current.md`. `duplicate-code:check` defaults to warning baseline in weekly / pre-release and upgrades to strict in `phase-close`. Once a mainline has a stable governance script, wire it into a fixed entry or explicitly record why not; avoid "script exists but still manually re-run" drift. `governance:check:scripts` runs as warning baseline in weekly only.

### 4.3 Irreversible Principle: No Retroactive Modifications
-   **Non-Modification Rule**: Once a task in a phase is marked as `[x]` (Completed), retroactive modifications to that entry are forbidden, including:
    -   Changing acceptance criteria
    -   Deleting completed tasks
    -   Changing priorities
    -   Redefining delivered features
-   **Item Placement Rules**:
    -   New feature requirements: must go to `docs/plan/backlog.md`; only after evaluation and promotion may they move to roadmap / todo.
    -   Bug fixes: only allowed in the current phase's "TODO" section, clearly labeled as fix type.
    -   Optimizations: evaluated first, then placed in roadmap or current-phase todo by priority.
-   **Change Strategy**:
    -   If a completed feature is found to be imperfect:
        1.  Create a "Feature Enhancement" or "Optimization" task in the current phase.
        2.  Evaluate whether to execute immediately or place in the long-term backlog.
        3.  Extend the existing feature rather than deleting or rewriting it.

### 4.4 Archive Management
-   **Timing**: When all core tasks of a Phase are marked as completed, the details should be archived to `docs/plan/todo-archive.md`.
-   **Format**: Archives should preserve the original hierarchy, checkbox status, and acceptance criteria for historical traceability.
-   **Simplicity**: After archiving, `docs/plan/todo.md` should only retain active tasks for the current iteration. Long-term mainlines and short-term candidates are managed in `docs/plan/backlog.md`; `roadmap.md` keeps only formal phase plans and archive conclusions.

Deep-archive thresholds (see the [deep archive governance](../plan/archive/index.md) entry): root `README*` `<= 300` lines healthy, `301 - 400` warning, over `400` before pushing details back to `docs/` topic pages; `roadmap.md` `<= 800` / `801 - 900` warning / over `900` must split earlier phase shards first; `backlog.md` and `todo-archive.md` `<= 500` / `501 - 700` warning / over `700` must converge candidate summaries or split phase-range shards; `docs/reports/regression/current.md` `<= 500` / `501 - 700` warning / over `700` must rotate old records to the archive. Thresholds are enforced by `pnpm docs:check:line-count`.

### 4.5 Phase Archive Workflow

Any "current phase done, ready to archive and evaluate the next phase" action must follow this unified workflow. It is the single archiving contract for `todo.md`, `todo-archive.md`, `roadmap.md`, and related translation summaries; agent skills and other docs may only reference it, never invent a second set of steps.

#### Step 1. Archive Admission Check

1.  Confirm all core items of the current phase are complete and no unclosed phase-blocking items remain in `todo.md`.
2.  For descriptions like "in progress", "to be observed", "to be re-run", judge whether they are independent blockers (stay in the phase) or runtime observations / follow-up ops concerns (no longer block archiving).
3.  If the phase still lacks `todo.md` cleanup, regression record persistence, phase summary, or `todo-archive.md` archive blocks, it is still in phase closing and next-phase formal planning must not start.

#### Step 2. Evidence Chain Check

1.  Verify the phase has sufficient regression or validation evidence; backfill to `docs/reports/regression/current.md` or an equivalent carrier when missing.
2.  At minimum confirm: core implementation or governance conclusions; executed validations and quality gate results; Review Gate conclusion; uncovered boundaries and follow-up observation items.
3.  If phase closing depends on historical regression records, archive logs, or special reports, complete the index or reference paths before archiving.

#### Step 3. Documentation Sync Check

1.  Chinese source of truth must be synced first: `todo.md`, `todo-archive.md`, `roadmap.md`.
2.  If backlog promotion, mainline slicing, or candidate de-duplication is involved, update `docs/plan/backlog.md`; backlog is not "optional notes".
3.  If phase status changes (e.g. "planning" to "audited & archived"), check whether `docs/i18n/*/plan/roadmap.md` summaries need updates.
4.  Run `node scripts/ai-hooks/distill-wisdom.mjs --check`: if it returns `WISDOM_NEEDS_DISTILL`, follow the [Session Wisdom distillation process](../design/governance/session-wisdom-distillation.md) and solidify high-value knowledge into `docs/` before archiving.
5.  `todo.md` and `backlog.md` stay Chinese by default; no separate translation files are created for phase archives.
6.  If the phase comes with standards, guides, README, or module design doc drift, judge whether to sync them before archiving; do not leave "doc backfill" as a hidden tail item.
7.  If new or rewritten design docs are involved, decide `docs/design/modules/` vs `docs/design/governance/` placement; do not stuff governance docs back into the module directory for convenience.
8.  **Archive consistency check**: confirm roadmap archive shards in `docs/plan/archive/` match the coverage of todo-archive shards. If the roadmap archive lags behind, backfill the missing shards first; if roadmap detail bodies were compressed into summary tables, restore the original text from git HEAD or `todo-archive.md` to create the archive shard, so phase details stay traceable.

#### Step 4. File Update Order

1.  Update `docs/plan/todo.md` first: clean up current in-progress items, remove completed-phase bodies, keep only still-executing phases.
2.  Then update `docs/plan/todo-archive.md`: append a full archive block with audit conclusions, mainline items, acceptance summaries, and key validation conclusions.
3.  Then update `docs/plan/roadmap.md`: change the phase status to "audited & archived" or equivalent, with a one-line closing conclusion.
4.  If backlog changes are involved, update `docs/plan/backlog.md`: mainlines record latest status, last promoted phase, and next slice direction; short-term candidates de-duplicate or become historical notes after promotion.
5.  Finally update `docs/i18n/*/plan/roadmap.md` as needed: only phase status and summaries, no forced translation of `todo.md` / `backlog.md`.

> **Compression iron rule**: if compressing completed-phase execution details in `roadmap.md` (e.g. replacing detailed planning with summary tables), first ensure the original full body is extracted into `archive/roadmap-phases-*-*.md` shard files. Dropping phase details without archive shards is forbidden. Restore from git HEAD or rebuild from `todo-archive.md` records.

#### Step 5. Minimal Verification Matrix

Phase archiving is a formal planning-doc change and must satisfy at least `V0 + V1 + RG`:

1.  Doc structure check: run `lint-md` or equivalent on the changed Markdown files.
2.  Doc directory check: run `pnpm docs:check:i18n` to confirm no legacy directory recurrence or duplicate translation pages.
3.  Quality status confirmation: verify the phase's latest `lint`, `typecheck`, targeted tests, or special validation conclusions are recorded; without proof of passing the minimum quality gate, do not archive.
4.  Error-surface check: confirm no new editor diagnostics on the files involved in the archive.

#### Step 6. Review Gate & Release Conclusion

1.  At least one review round is required before archiving; `@code-auditor` or an equivalent flow gives `Pass / Reject`.
2.  If blockers, missing key evidence, or obvious translation / roadmap drift remain, the conclusion must be `Reject`.
3.  On `Pass`, non-blocking observations may remain but must be explicitly written into "uncovered boundaries" or "follow-up observations"; do not disguise them as closed.

#### Step 7. Next-Phase Planning Gate

1.  Only after the above archive flow is complete may backlog items be formally promoted to the next phase's planning.
2.  Before landing, next-phase candidates exist as "evaluation conclusion / candidate mainline / ROI and risk"; do not write them into `todo.md` or `roadmap.md` early. Explicitly distinguish candidate sources: "long-term mainline slice" vs "short-term / one-off candidate".
3.  If the user only asks to "analyze the next phase first", stay at the candidate level; no sneak-run formal planning persistence.

#### Step 8. Workspace Cleanliness Check Before New Phase Evaluation

Before formally evaluating a new phase, run a workspace cleanliness check to ensure the planning doc base is clean and archives are consistent:

1.  **Doc base check**: `todo.md` has no residual completed-phase bodies (new phase entry is "preparing"); `roadmap.md` has no residual detailed planning of archived phases (only summary tables or audit conclusions); `backlog.md` has no residual bodies of completed candidates.
2.  **Archive consistency check**: roadmap archive shards and todo-archive shards cover roughly aligned phase ranges; shard filenames match the registration list in `archive/index.md`.
3.  **Format cleanliness check**: no mixed parentheses like `（(` / `）)`; no abnormal backticks; heading levels progress without jumps; the doc ends with a complete "Related Documents" index with valid reference paths.
4.  **Execution**: performed by the `@product-manager` or equivalent role entering the new phase evaluation; issues are graded "blocking / non-blocking"; blocking items must be fixed before evaluation, non-blocking items marked TODO in the planning docs.

#### Backlog Dual-Track Template

`docs/plan/backlog.md` maintains at least two areas:

1.  **Long-term mainline tasks (kept across phases)**: applicable to coverage governance, test effectiveness, ESLint / type debt, duplicate code / pure function reuse, periodic regression, security / performance baselines. Minimal fields: goal, status (in-progress / observing / paused / closed), last promoted phase, next slice direction. Rule: each phase extracts only the current slice; the mainline card stays until explicitly closed, canceled, or replaced.
2.  **Short-term / one-off candidate tasks (de-duplicated after promotion)**: applicable to single evaluations, single-phase features, one-off migrations, standalone pre-research, or items closable after completion. Minimal fields: acceptance goal, main constraints, promotion prerequisites. Rule: once formally promoted to roadmap / todo, delete or rewrite as history notes to avoid duplication.

#### Minimal Phase Archive Checklist

Confirm each item per archive: core items complete or explicitly converted to non-blocking observations; `todo.md` cleaned; `todo-archive.md` archive block appended; `roadmap.md` status and conclusion synced; required `docs/i18n/*/plan/roadmap.md` updated; regression records / Review Gate evidence traceable; `lint-md`, `docs:check:i18n`, and minimal quality gates confirmed; `Pass / Reject` conclusion formed.

## 5. Cross-Module Change Evaluation

1.  **Proposal**: describe the motivation for the new feature or change.
2.  **Self-assessment**: score preliminarily with the matrix in "Chapter 3".
3.  **Impact scope audit**:
    -   Does it change the database schema?
    -   Does it affect i18n multi-language mappings?
    -   Does it increase the frontend bundle size?
4.  **Decision record**: record the evaluation result in the relevant design document.

### 5.1 Design Artifact Before Implementation

When an item meets "new module / cross-module / contract rewrite / standalone governance", the following prerequisites must be completed in addition to the evaluation matrix:

1.  **Design landing judgment**: stable module total designs go to `docs/design/modules/`; governance, migration plans, evaluation reports, execution matrices, and phase designs go to `docs/design/governance/`.
2.  **Minimal design content**: background and problem definition; scope and non-goals; contract / data structure / interaction boundaries; risks, rollback, and validation plan.
3.  **Landing timing**: design docs must land before large-scale implementation and exist as review objects; do not write "post-hoc explanations" after all code is done.
4.  **Todo / Roadmap linkage**: if a current-phase mainline depends on a design doc first, `roadmap.md` and `todo.md` acceptance criteria must explicitly state "complete the design doc first, then implement", so execution never skips the design artifact.

## 6. Related Documents

-   [Project Roadmap](../plan/roadmap.md)
-   [TODO](../plan/todo.md)
-   [Development Standards](./development.md)
-   [Design Doc Index](../design/modules/index.md)
-   [Governance & Special Design Index](../design/governance/index.md)
