import type { MomeiImportPathAliasReport, MomeiImportPathAliasStatus } from '@momei-blog/api-client'
import type { CliImportPostRequest } from './types'

export interface CliImportValidationCandidate {
    file: string
    relativeFile: string
    request: CliImportPostRequest
    report: MomeiImportPathAliasReport
}

export interface CliImportExecutionItem extends CliImportValidationCandidate {
    action: 'import' | 'skip'
    actionReason: 'ready' | 'blocking-issues' | 'confirmation-required' | 'already-synced'
}

export interface CliImportExecutionPlan {
    summary: {
        total: number
        ready: number
        skipped: number
        requiresConfirmation: number
        blockingIssues: number
        alreadySynced: number
        accepted: number
        fallback: number
        repaired: number
        invalid: number
        conflict: number
        needsConfirmation: number
    }
    items: CliImportExecutionItem[]
}

function sumStatus(reports: MomeiImportPathAliasReport[], status: MomeiImportPathAliasStatus) {
    return reports.reduce((count, report) => count + (report.summary[status] || 0), 0)
}

export function buildImportExecutionPlan(
    candidates: CliImportValidationCandidate[],
    options: { confirmPathAliases: boolean },
): CliImportExecutionPlan {
    const items = candidates.map<CliImportExecutionItem>((candidate) => {
        if (candidate.report.hasBlockingIssues) {
            return {
                ...candidate,
                action: 'skip',
                actionReason: 'blocking-issues',
            }
        }

        if (!candidate.report.canImport) {
            const isAlreadySynced = candidate.report.items.some(
                (item) => item.status === 'skipped' && item.reason === 'already-synced',
            )
            return {
                ...candidate,
                action: 'skip',
                actionReason: isAlreadySynced ? 'already-synced' : 'blocking-issues',
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
            alreadySynced: items.filter((item) => item.actionReason === 'already-synced').length,
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
