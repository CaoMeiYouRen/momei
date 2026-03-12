import { z } from 'zod'
import {
    LINK_GOVERNANCE_CONTENT_TYPES,
    LINK_GOVERNANCE_MATCH_MODES,
    LINK_GOVERNANCE_PAGE_KEYS,
    LINK_GOVERNANCE_SCOPES,
    LINK_GOVERNANCE_SOURCE_KINDS,
    LINK_GOVERNANCE_TARGET_TYPES,
    LINK_GOVERNANCE_VALIDATION_MODES,
} from '@/types/migration-link-governance'

export const linkGovernanceSeedSchema = z.object({
    source: z.string().min(1).max(2048),
    sourceKind: z.enum(LINK_GOVERNANCE_SOURCE_KINDS),
    matchMode: z.enum(LINK_GOVERNANCE_MATCH_MODES),
    scope: z.enum(LINK_GOVERNANCE_SCOPES),
    targetType: z.enum(LINK_GOVERNANCE_TARGET_TYPES),
    targetRef: z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
        translationId: z.string().optional(),
        locale: z.string().optional(),
        objectKey: z.string().optional(),
        pageKey: z.enum(LINK_GOVERNANCE_PAGE_KEYS).optional(),
        archiveKey: z.object({
            year: z.coerce.number().int().min(1970).optional(),
            month: z.coerce.number().int().min(1).max(12).optional(),
        }).optional(),
    }),
    redirectMode: z.enum(['rewrite-only', 'redirect-seed', 'alias-only']).optional(),
    notes: z.string().max(500).optional(),
})

export const linkGovernanceRequestSchema = z.object({
    scopes: z.array(z.enum(LINK_GOVERNANCE_SCOPES)).min(1),
    filters: z.object({
        domains: z.array(z.string().min(1)).optional(),
        pathPrefixes: z.array(z.string().min(1)).optional(),
        contentTypes: z.array(z.enum(LINK_GOVERNANCE_CONTENT_TYPES)).optional(),
    }).optional(),
    seeds: z.array(linkGovernanceSeedSchema).optional(),
    options: z.object({
        reportFormat: z.enum(['json', 'markdown']).optional().default('json'),
        validationMode: z.enum(LINK_GOVERNANCE_VALIDATION_MODES).optional().default('static'),
        allowRelativeLinks: z.boolean().optional().default(false),
        retryFailuresFromReportId: z.string().optional(),
        skipConfirmation: z.boolean().optional().default(false),
    }).optional(),
})

export type LinkGovernanceRequestInput = z.infer<typeof linkGovernanceRequestSchema>
