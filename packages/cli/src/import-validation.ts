import type { CliImportPathAliasReport, CliImportPathAliasStatus, CliImportPostRequest } from './types'

export interface CliImportValidationCandidate {
    file: string
    relativeFile: string
    request: CliImportPostRequest
    report: CliImportPathAliasReport
}

export interface CliImportExecutionItem extends CliImportValidationCandidate {
    action: 'import' | 'skip'
    actionReason: 'ready' | 'blocking-issues' | 'confirmation-required'
}

export interface CliImportExecutionPlan {
    summary: {
        total: number
        ready: number
        skipped: number
        requiresConfirmation: number
        blockingIssues: number
        accepted: number
        fallback: number
        repaired: number
        invalid: number
        conflict: number
        needsConfirmation: number
    }
    items: CliImportExecutionItem[]
}

function sumStatus(reports: CliImportPathAliasReport[], status: CliImportPathAliasStatus) {
    return reports.reduce((count, report) => count + (report.summary[status] || 0), 0)
}

export function buildImportExecutionPlan(
    candidates: CliImportValidationCandidate[],
    options: { confirmPathAliases: boolean },
): CliImportExecutionPlan {
    const items = candidates.map<CliImportExecutionItem>((candidate) => {
        if (candidate.report.hasBlockingIssues || !candidate.report.canImport) {
            return {
                ...candidate,
                action: 'skip',
                actionReason: 'blocking-issues',
            }
        }

        if (candidate.report.requiresConfirmation && !options.confirmPathAliases) {
            return {
                ...candidate,
                action: 'skip',
                actionReason: 'confirmation-required',
            }
        }

        return {
            ...candidate,
            action: 'import',
            actionReason: 'ready',
        }
    })

    const reports = candidates.map((candidate) => candidate.report)

    return {
        summary: {
            total: candidates.length,
            ready: items.filter((item) => item.action === 'import').length,
            skipped: items.filter((item) => item.action === 'skip').length,
            requiresConfirmation: items.filter((item) => item.actionReason === 'confirmation-required').length,
            blockingIssues: items.filter((item) => item.actionReason === 'blocking-issues').length,
            accepted: sumStatus(reports, 'accepted'),
            fallback: sumStatus(reports, 'fallback'),
            repaired: sumStatus(reports, 'repaired'),
            invalid: sumStatus(reports, 'invalid'),
            conflict: sumStatus(reports, 'conflict'),
            needsConfirmation: sumStatus(reports, 'needs-confirmation'),
        },
        items,
    }
}
