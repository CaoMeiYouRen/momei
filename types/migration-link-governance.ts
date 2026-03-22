export const LINK_GOVERNANCE_SCOPES = [
    'asset-url',
    'post-link',
    'category-link',
    'tag-link',
    'archive-link',
    'page-link',
    'permalink-rule',
] as const

export type LinkGovernanceScope = typeof LINK_GOVERNANCE_SCOPES[number]

export const LINK_GOVERNANCE_SOURCE_KINDS = ['absolute', 'root-relative', 'relative', 'path-rule'] as const

export type LinkGovernanceSourceKind = typeof LINK_GOVERNANCE_SOURCE_KINDS[number]

export const LINK_GOVERNANCE_MATCH_MODES = ['exact', 'prefix', 'pattern'] as const

export type LinkGovernanceMatchMode = typeof LINK_GOVERNANCE_MATCH_MODES[number]

export const LINK_GOVERNANCE_TARGET_TYPES = ['asset', 'post', 'category', 'tag', 'archive', 'page'] as const

export type LinkGovernanceTargetType = typeof LINK_GOVERNANCE_TARGET_TYPES[number]

export const LINK_GOVERNANCE_PAGE_KEYS = [
    'about',
    'friend-links',
    'feedback',
    'submit',
    'privacy-policy',
    'user-agreement',
] as const

export type LinkGovernancePageKey = typeof LINK_GOVERNANCE_PAGE_KEYS[number]

export const LINK_GOVERNANCE_CONTENT_TYPES = ['post', 'category', 'tag', 'page', 'asset-record'] as const

export type LinkGovernanceContentType = typeof LINK_GOVERNANCE_CONTENT_TYPES[number]

export const LINK_GOVERNANCE_DIFF_STATUSES = [
    'resolved',
    'rewritten',
    'unchanged',
    'skipped',
    'failed',
    'needs-confirmation',
] as const

export type LinkGovernanceDiffStatus = typeof LINK_GOVERNANCE_DIFF_STATUSES[number]

export const LINK_GOVERNANCE_MODES = ['dry-run', 'apply'] as const

export type LinkGovernanceMode = typeof LINK_GOVERNANCE_MODES[number]

export const LINK_GOVERNANCE_REPORT_STATUSES = ['completed', 'failed'] as const

export type LinkGovernanceReportStatus = typeof LINK_GOVERNANCE_REPORT_STATUSES[number]

export const LINK_GOVERNANCE_VALIDATION_MODES = ['static', 'static+online'] as const

export type LinkGovernanceValidationMode = typeof LINK_GOVERNANCE_VALIDATION_MODES[number]

export const LINK_GOVERNANCE_ISSUE_CODES = [
    'mapping-missing',
    'target-not-found',
    'domain-out-of-scope',
    'redirect-conflict',
    'external-unreachable',
    'manual-confirmation-required',
] as const

export type LinkGovernanceIssueCode = typeof LINK_GOVERNANCE_ISSUE_CODES[number]

export const STATIC_PAGE_ROUTE_MAP: Record<LinkGovernancePageKey, string> = {
    about: '/about',
    'friend-links': '/friend-links',
    feedback: '/feedback',
    submit: '/submit',
    'privacy-policy': '/privacy-policy',
    'user-agreement': '/user-agreement',
}

export interface LinkGovernanceArchiveKey {
    year?: number
    month?: number
}

export interface LinkGovernanceTargetRef {
    id?: string
    slug?: string
    translationId?: string
    locale?: string
    objectKey?: string
    pageKey?: LinkGovernancePageKey
    archiveKey?: LinkGovernanceArchiveKey
}

export interface LinkGovernanceMappingSeed {
    source: string
    sourceKind: LinkGovernanceSourceKind
    matchMode: LinkGovernanceMatchMode
    scope: LinkGovernanceScope
    targetType: LinkGovernanceTargetType
    targetRef: LinkGovernanceTargetRef
    redirectMode?: 'rewrite-only' | 'redirect-seed' | 'alias-only'
    notes?: string
}

export interface LinkGovernanceIssue {
    code: LinkGovernanceIssueCode
    message: string
}

export interface LinkGovernanceRedirectSeed {
    source: string
    target: string
    statusCode: 301 | 302
    reason: 'legacy-permalink' | 'path-rule' | 'asset-domain-migration'
}

export interface LinkGovernanceDiffItem {
    sourceValue: string
    targetValue: string | null
    scope: LinkGovernanceScope
    contentType: LinkGovernanceContentType
    contentId: string
    status: LinkGovernanceDiffStatus
    issues?: LinkGovernanceIssue[]
    field?: 'content' | 'coverImage' | 'metadata.audio.url'
    sourceKind?: LinkGovernanceSourceKind
    domain?: string | null
    matchedBy?: 'canonical' | 'seed' | 'path-rule' | 'object-key' | 'page-key' | 'translation-id' | 'slug' | 'id'
    objectKey?: string | null
}

export interface LinkGovernanceReportSummary {
    total: number
    resolved: number
    rewritten: number
    unchanged: number
    skipped: number
    failed: number
    needsConfirmation: number
}

export interface LinkGovernanceReportStatistics {
    byScope: Partial<Record<LinkGovernanceScope, number>>
    byContentType: Partial<Record<LinkGovernanceContentType, number>>
    byDomain: Record<string, number>
}

export interface LinkGovernanceRequestFilters {
    domains?: string[]
    pathPrefixes?: string[]
    contentTypes?: LinkGovernanceContentType[]
}

export interface LinkGovernanceRequestOptions {
    reportFormat?: 'json' | 'markdown'
    validationMode?: LinkGovernanceValidationMode
    allowRelativeLinks?: boolean
    retryFailuresFromReportId?: string
    reviewedDryRunReportId?: string
    skipConfirmation?: boolean
}

export interface LinkGovernanceRequest {
    scopes: LinkGovernanceScope[]
    filters?: LinkGovernanceRequestFilters
    seeds?: LinkGovernanceMappingSeed[]
    options?: LinkGovernanceRequestOptions
}

export interface LinkGovernanceReportData {
    reportId: string
    mode: LinkGovernanceMode
    status?: LinkGovernanceReportStatus
    scopes?: LinkGovernanceScope[]
    filters?: LinkGovernanceRequestFilters | null
    options?: LinkGovernanceRequestOptions | null
    requestedByUserId?: string
    summary: LinkGovernanceReportSummary
    statistics: LinkGovernanceReportStatistics
    items: LinkGovernanceDiffItem[]
    redirectSeeds: LinkGovernanceRedirectSeed[]
    markdown?: string | null
    createdAt?: string | Date
    updatedAt?: string | Date
}

export interface LinkGovernanceReportListItem {
    reportId: string
    mode: LinkGovernanceMode
    status: LinkGovernanceReportStatus
    scopes: LinkGovernanceScope[]
    requestedByUserId: string
    requestedByName?: string | null
    requestedByEmail?: string | null
    summary: LinkGovernanceReportSummary
    itemCount: number
    redirectSeedCount: number
    createdAt: string | Date
    updatedAt: string | Date
}

export interface LinkGovernanceReportListData {
    items: LinkGovernanceReportListItem[]
    total: number
    page: number
    limit: number
    totalPages: number
}
