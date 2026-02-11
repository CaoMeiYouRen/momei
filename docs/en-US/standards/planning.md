---
source_branch: master
last_sync: 2026-02-11
---

# Planning & Evaluation Standards

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../standards/planning.md) shall prevail.
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

## 4. Roadmap & TODO Management Workflow

### 4.1 Roadmap Updates
-   `docs/plan/roadmap.md` undergoes a major version review monthly.
-   Completed tasks should be marked with `(Completed)`.
-   A new Phase can only be started after the core metrics of the previous Phase are achieved.

### 4.2 TODO Maintenance
-   `docs/plan/todo.md` is the real-time operational manual, containing **specific implementation tasks for the current phase only**.
-   Task status must be clearly marked: `[ ]` (Pending), `[x]` (Completed), `[-]` (Canceled).
-   Task descriptions should include specific "Acceptance Criteria."
-   **Anti-Duplication Principle**: Before planning or adding any new feature, **always** check `docs/plan/todo.md`, `docs/plan/roadmap.md`, and `docs/plan/todo-archive.md`. Duplicate designs for tasks that are already archived, in progress, or on the roadmap are forbidden.

### 4.3 Irreversible Principle: No Retroactive Modifications
-   **Non-Modification Rule**: Once a task in a phase is marked as `[x]` (Completed), retroactive modifications to that entry are forbidden, including:
    -   Changing acceptance criteria
    -   Deleting completed tasks
    -   Changing priorities
    -   Redefining delivered features
-   **Change Strategy**:
    -   If a completed feature is found to be imperfect:
        1.  Create a "Feature Enhancement" or "Optimization" task in the current phase.
        2.  Evaluate whether to execute immediately or place in the long-term backlog.
        3.  Extend the existing feature rather than deleting or rewriting it.

### 4.4 Archive Management
-   **Timing**: When all core tasks of a Phase are marked as completed, the details should be archived to `docs/plan/todo-archive.md`.
-   **Format**: Archives should preserve the original hierarchy, checkbox status, and acceptance criteria for historical traceability.
-   **Simplicity**: After archiving, `docs/plan/todo.md` should only retain active tasks for the current iteration. Long-term backlog items are managed exclusively in `docs/plan/roadmap.md`.
