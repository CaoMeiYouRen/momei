import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { In } from 'typeorm'
import { dataSource } from '@/server/database'
import { LinkGovernanceReport } from '@/server/entities/link-governance-report'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import {
    applyContentCandidateRewrite,
    buildIssue,
    buildRedirectSeed,
    buildRuntimeContext,
    type CandidateResolution,
    collectContentCandidates,
    collectMatchingSeeds,
    deriveObjectKeyFromAssetUrl,
    domainMatches,
    getCandidateDomain,
    getCandidatePath,
    getSourceKind,
    type GovernanceRuntimeContext,
    type LinkCandidate,
    looksLikeManagedAssetPath,
    normalizeContentTypes,
    pathPrefixMatches,
    resolveCanonicalRoute,
    resolveTargetPath,
} from '@/server/services/migration-link-governance.helpers'
import { resolveUploadedFileUrl } from '@/server/services/upload'
import { isAdmin } from '@/utils/shared/roles'
import {
    type LinkGovernanceContentType,
    type LinkGovernanceDiffItem,
    type LinkGovernanceMode,
    type LinkGovernanceReportListData,
    type LinkGovernanceReportListItem,
    type LinkGovernanceRedirectSeed,
    type LinkGovernanceReportData,
    type LinkGovernanceReportStatistics,
    type LinkGovernanceReportSummary,
    type LinkGovernanceRequest,
} from '@/types/migration-link-governance'

async function maybeProbeUrl(value: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    try {
        const response = await fetch(value, {
            method: 'HEAD',
            redirect: 'follow',
            signal: controller.signal,
        })
        return response.ok
    } catch {
        return false
    } finally {
        clearTimeout(timeout)
    }
}

async function resolveCandidate(candidate: LinkCandidate, runtime: GovernanceRuntimeContext, request: LinkGovernanceRequest): Promise<CandidateResolution> {
    const domain = getCandidateDomain(candidate.value)
    const path = getCandidatePath(candidate.value, candidate.sourceKind)
    const options = request.options

    if (candidate.sourceKind === 'relative' && !options?.allowRelativeLinks && candidate.field === 'content') {
        return {
            targetValue: null,
            scope: 'page-link',
            status: 'skipped',
            issues: [buildIssue('manual-confirmation-required', 'Relative links are disabled for this run')],
            domain,
        }
    }

    if (!domainMatches(domain, request.filters, runtime.managedDomains)) {
        if (options?.validationMode === 'static+online' && candidate.sourceKind === 'absolute') {
            const reachable = await maybeProbeUrl(candidate.value)
            return {
                targetValue: null,
                scope: 'page-link',
                status: 'skipped',
                issues: [buildIssue(reachable ? 'domain-out-of-scope' : 'external-unreachable', reachable ? 'Domain is not in current governance scope' : 'External URL probe failed')],
                domain,
            }
        }

        return {
            targetValue: null,
            scope: 'page-link',
            status: 'skipped',
            issues: [buildIssue('domain-out-of-scope', 'Domain is not in current governance scope')],
            domain,
        }
    }

    const shouldApplyPathPrefixFilter = request.scopes.includes('asset-url') && looksLikeManagedAssetPath(path)

    if (shouldApplyPathPrefixFilter && !pathPrefixMatches(path, request.filters) && candidate.sourceKind !== 'absolute') {
        return {
            targetValue: null,
            scope: 'page-link',
            status: 'skipped',
            issues: [buildIssue('domain-out-of-scope', 'Path is outside configured governance prefixes')],
            domain,
        }
    }

    const objectKey = deriveObjectKeyFromAssetUrl({
        value: candidate.value,
        sourceKind: candidate.sourceKind,
        runtime,
        options,
        field: candidate.field,
        filters: request.filters,
    })
    if (objectKey && request.scopes.includes('asset-url')) {
        const targetValue = resolveUploadedFileUrl(objectKey, runtime.storageContext)
        const status = targetValue === candidate.value ? 'unchanged' : 'rewritten'
        return {
            targetValue,
            scope: 'asset-url',
            status,
            matchedBy: 'object-key',
            objectKey,
            domain,
            redirectSeed: buildRedirectSeed(candidate.sourceKind === 'absolute' ? candidate.value : path, targetValue, 'asset-url'),
        }
    }

    const matchedSeeds = collectMatchingSeeds(candidate, runtime, request)
    if (matchedSeeds.length > 1) {
        const targets = Array.from(new Set(matchedSeeds.map((item) => resolveTargetPath(item.seed.targetType, item.seed.targetRef, runtime, item.matched.params.slug || item.seed.targetRef.slug)).filter(Boolean)))
        if (targets.length > 1) {
            return {
                targetValue: null,
                scope: matchedSeeds[0]!.seed.scope,
                status: 'needs-confirmation',
                issues: [buildIssue('redirect-conflict', 'Multiple seeds resolved to different targets')],
                domain,
            }
        }
    }

    if (matchedSeeds.length > 0) {
        const first = matchedSeeds[0]!
        const fallbackSlug = first.matched.params.slug || first.seed.targetRef.slug || undefined
        const targetValue = resolveTargetPath(first.seed.targetType, first.seed.targetRef, runtime, fallbackSlug)
        if (!targetValue) {
            return {
                targetValue: null,
                scope: first.seed.scope,
                status: 'failed',
                issues: [buildIssue('target-not-found', 'Seed matched but target entity was not found')],
                domain,
            }
        }

        const redirectSeed = first.seed.redirectMode === 'rewrite-only'
            ? undefined
            : buildRedirectSeed(first.seed.sourceKind === 'absolute' ? first.seed.source : getCandidatePath(first.seed.source, first.seed.sourceKind), targetValue, first.seed.scope)

        return {
            targetValue,
            scope: first.seed.scope,
            status: targetValue === candidate.value || targetValue === path ? 'unchanged' : 'rewritten',
            matchedBy: first.seed.sourceKind === 'path-rule' ? 'path-rule' : 'seed',
            domain,
            redirectSeed,
        }
    }

    if (candidate.sourceKind !== 'relative') {
        const canonicalMatch = resolveCanonicalRoute(path, runtime)
        if (canonicalMatch) {
            return {
                ...canonicalMatch,
                domain,
            }
        }
    }

    return {
        targetValue: null,
        scope: 'page-link',
        status: 'failed',
        issues: [buildIssue('mapping-missing', 'No mapping seed or canonical route could resolve this link')],
        domain,
    }
}

function createEmptySummary(): LinkGovernanceReportSummary {
    return {
        total: 0,
        resolved: 0,
        rewritten: 0,
        unchanged: 0,
        skipped: 0,
        failed: 0,
        needsConfirmation: 0,
    }
}

function toLinkGovernanceReportData(report: LinkGovernanceReport): LinkGovernanceReportData {
    return {
        reportId: report.id,
        mode: report.mode,
        status: report.status,
        scopes: report.scopes,
        filters: report.filters,
        options: report.options,
        requestedByUserId: report.requestedByUserId,
        summary: report.summary || createEmptySummary(),
        statistics: report.statistics || buildStatistics(report.items || []),
        items: report.items || [],
        redirectSeeds: report.redirectSeeds || [],
        markdown: report.markdown,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
    }
}

function toLinkGovernanceReportListItem(report: LinkGovernanceReport, userById: Map<string, Pick<User, 'id' | 'name' | 'email'>>): LinkGovernanceReportListItem {
    const requestedBy = userById.get(report.requestedByUserId)

    return {
        reportId: report.id,
        mode: report.mode,
        status: report.status,
        scopes: report.scopes,
        requestedByUserId: report.requestedByUserId,
        requestedByName: requestedBy?.name || null,
        requestedByEmail: requestedBy?.email || null,
        summary: report.summary || createEmptySummary(),
        itemCount: report.items?.length || 0,
        redirectSeedCount: report.redirectSeeds?.length || 0,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
    }
}

function buildStatistics(items: LinkGovernanceDiffItem[]): LinkGovernanceReportStatistics {
    const byScope: LinkGovernanceReportStatistics['byScope'] = {}
    const byContentType: LinkGovernanceReportStatistics['byContentType'] = {}
    const byDomain: LinkGovernanceReportStatistics['byDomain'] = {}

    for (const item of items) {
        byScope[item.scope] = (byScope[item.scope] || 0) + 1
        byContentType[item.contentType] = (byContentType[item.contentType] || 0) + 1
        const domainKey = item.domain || 'local'
        byDomain[domainKey] = (byDomain[domainKey] || 0) + 1
    }

    return { byScope, byContentType, byDomain }
}

function buildMarkdownReport(reportId: string, mode: LinkGovernanceMode, summary: LinkGovernanceReportSummary, items: LinkGovernanceDiffItem[], redirectSeeds: LinkGovernanceRedirectSeed[]) {
    const lines = [
        '# 链接治理报告',
        '',
        `- 报告 ID: ${reportId}`,
        `- 模式: ${mode}`,
        `- 总计: ${summary.total}`,
        `- 改写候选: ${summary.rewritten}`,
        `- 已落盘: ${summary.resolved}`,
        `- 失败: ${summary.failed}`,
        `- 跳过: ${summary.skipped}`,
        `- 待确认: ${summary.needsConfirmation}`,
        '',
        '## 差异预览',
        '',
        '| Scope | Field | Source | Target | Status |',
        '| :--- | :--- | :--- | :--- | :--- |',
    ]

    items.slice(0, 50).forEach((item) => {
        lines.push(`| ${item.scope} | ${item.field || '-'} | ${item.sourceValue} | ${item.targetValue || '-'} | ${item.status} |`)
    })

    if (redirectSeeds.length > 0) {
        lines.push('', '## Redirect Seeds', '', '| Source | Target | Status | Reason |', '| :--- | :--- | :--- | :--- |')
        redirectSeeds.slice(0, 50).forEach((seed) => {
            lines.push(`| ${seed.source} | ${seed.target} | ${seed.statusCode} | ${seed.reason} |`)
        })
    }

    return lines.join('\n')
}

async function loadPostsForGovernance(contentTypes: LinkGovernanceContentType[], retryFailuresFromReportId?: string) {
    const postRepo = dataSource.getRepository(Post)

    if (!contentTypes.includes('post')) {
        return [] as Post[]
    }

    if (!retryFailuresFromReportId) {
        return postRepo.find()
    }

    const reportRepo = dataSource.getRepository(LinkGovernanceReport)
    const priorReport = await reportRepo.findOneBy({ id: retryFailuresFromReportId })
    const items = priorReport?.items || []
    const targetPostIds = Array.from(new Set(items.filter((item) => item.contentType === 'post' && (item.status === 'failed' || item.status === 'needs-confirmation')).map((item) => item.contentId)))

    if (targetPostIds.length === 0) {
        return [] as Post[]
    }

    return postRepo.findBy({ id: In(targetPostIds) })
}

async function executeLinkGovernance(mode: LinkGovernanceMode, request: LinkGovernanceRequest, userId: string) {
    const runtime = await buildRuntimeContext()
    const contentTypes = normalizeContentTypes(request.filters?.contentTypes)
    const posts = await loadPostsForGovernance(contentTypes, request.options?.retryFailuresFromReportId)
    const items: LinkGovernanceDiffItem[] = []
    const redirectSeedMap = new Map<string, LinkGovernanceRedirectSeed>()
    const postRepo = dataSource.getRepository(Post)

    for (const post of posts) {
        let content = post.content
        let coverImage = post.coverImage
        let metadata = post.metadata
        let dirty = false

        const candidates: LinkCandidate[] = [...collectContentCandidates(post.content)]
        if (post.coverImage) {
            candidates.push({
                value: post.coverImage,
                sourceKind: getSourceKind(post.coverImage),
                field: 'coverImage',
            })
        }
        if (metadata?.audio?.url) {
            candidates.push({
                value: metadata.audio.url,
                sourceKind: getSourceKind(metadata.audio.url),
                field: 'metadata.audio.url',
            })
        }

        for (const candidate of candidates) {
            const resolution = await resolveCandidate(candidate, runtime, request)
            const item: LinkGovernanceDiffItem = {
                sourceValue: candidate.value,
                targetValue: resolution.targetValue,
                scope: resolution.scope,
                contentType: 'post',
                contentId: post.id,
                status: resolution.status,
                issues: resolution.issues,
                field: candidate.field,
                sourceKind: candidate.sourceKind,
                domain: resolution.domain,
                matchedBy: resolution.matchedBy,
                objectKey: resolution.objectKey,
            }

            if (mode === 'apply' && resolution.targetValue && resolution.targetValue !== candidate.value && !(resolution.status === 'needs-confirmation' && !request.options?.skipConfirmation)) {
                item.status = 'resolved'
                if (candidate.field === 'content') {
                    content = applyContentCandidateRewrite(content, candidate.value, resolution.targetValue)
                } else if (candidate.field === 'coverImage') {
                    coverImage = resolution.targetValue
                } else if (candidate.field === 'metadata.audio.url') {
                    metadata = {
                        ...(metadata || {}),
                        audio: {
                            ...(metadata?.audio || {}),
                            url: resolution.targetValue,
                        },
                    }
                }
                dirty = true
            }

            items.push(item)
            if (resolution.redirectSeed) {
                redirectSeedMap.set(`${resolution.redirectSeed.source}::${resolution.redirectSeed.target}`, resolution.redirectSeed)
            }
        }

        if (mode === 'apply' && dirty) {
            post.content = content
            post.coverImage = coverImage
            post.metadata = metadata
            await postRepo.save(post)
        }
    }

    const summary = createEmptySummary()
    items.forEach((item) => {
        summary.total++
        if (item.status === 'needs-confirmation') {
            summary.needsConfirmation++
            return
        }

        summary[item.status === 'resolved' ? 'resolved' : item.status]++
    })

    const redirectSeeds = Array.from(redirectSeedMap.values())
    const report = new LinkGovernanceReport()
    report.mode = mode
    report.status = 'completed'
    report.requestedByUserId = userId
    report.scopes = request.scopes
    report.filters = request.filters || null
    report.options = request.options || null
    report.summary = summary
    report.statistics = buildStatistics(items)
    report.items = items
    report.redirectSeeds = redirectSeeds
    report.markdown = buildMarkdownReport(report.id || randomUUID().replace(/-/g, '').slice(0, 12), mode, summary, items, redirectSeeds)
    report.error = null

    const saved = await runtime.reportRepo.save(report)
    const markdown = buildMarkdownReport(saved.id, mode, summary, items, redirectSeeds)
    saved.markdown = markdown
    await runtime.reportRepo.save(saved)

    return toLinkGovernanceReportData(saved)
}

export async function runLinkGovernanceDryRun(request: LinkGovernanceRequest, userId: string) {
    return executeLinkGovernance('dry-run', request, userId)
}

export async function runLinkGovernanceApply(request: LinkGovernanceRequest, userId: string) {
    return executeLinkGovernance('apply', request, userId)
}

export async function getLinkGovernanceReportById(reportId: string, actor: { userId: string, role?: string | null }) {
    const repo = dataSource.getRepository(LinkGovernanceReport)
    const report = await repo.findOneBy({ id: reportId })

    if (!report) {
        throw createError({ statusCode: 404, statusMessage: 'Link governance report not found' })
    }

    if (report.requestedByUserId !== actor.userId && !isAdmin(actor.role || '')) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    return toLinkGovernanceReportData(report)
}

export async function listLinkGovernanceReports(query: {
    page?: number
    limit?: number
    mode?: LinkGovernanceMode
    status?: 'completed' | 'failed'
}) {
    const page = Math.max(1, query.page || 1)
    const limit = Math.min(100, Math.max(1, query.limit || 10))
    const where = {
        ...(query.mode ? { mode: query.mode } : {}),
        ...(query.status ? { status: query.status } : {}),
    }
    const reportRepo = dataSource.getRepository(LinkGovernanceReport)
    const userRepo = dataSource.getRepository(User)
    const [reports, total] = await reportRepo.findAndCount({
        where,
        order: {
            createdAt: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
    })
    const userIds = Array.from(new Set(reports.map((report) => report.requestedByUserId).filter(Boolean)))
    const users = userIds.length > 0
        ? await userRepo.find({
            select: ['id', 'name', 'email'],
            where: { id: In(userIds) },
        })
        : []
    const userById = new Map(users.map((user) => [user.id, user]))

    return {
        items: reports.map((report) => toLinkGovernanceReportListItem(report, userById)),
        total,
        page,
        limit,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    } satisfies LinkGovernanceReportListData
}

export async function buildDefaultLinkGovernanceSeeds() {
    const runtime = await buildRuntimeContext()
    return runtime.defaultSeeds
}
