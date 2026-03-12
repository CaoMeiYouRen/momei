import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import type {
    LinkGovernanceDiffItem,
    LinkGovernanceMode,
    LinkGovernanceRedirectSeed,
    LinkGovernanceReportStatistics,
    LinkGovernanceReportStatus,
    LinkGovernanceReportSummary,
    LinkGovernanceRequestFilters,
    LinkGovernanceRequestOptions,
    LinkGovernanceScope,
} from '@/types/migration-link-governance'

@Entity('link_governance_report')
export class LinkGovernanceReport extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 20, nullable: false, index: true })
    mode: LinkGovernanceMode

    @CustomColumn({ type: 'varchar', length: 20, nullable: false, default: 'completed', index: true })
    status: LinkGovernanceReportStatus

    @CustomColumn({ type: 'varchar', length: 36, nullable: false, index: true })
    requestedByUserId: string

    @CustomColumn({ type: 'simple-json', nullable: false })
    scopes: LinkGovernanceScope[]

    @CustomColumn({ type: 'simple-json', nullable: true })
    filters: LinkGovernanceRequestFilters | null

    @CustomColumn({ type: 'simple-json', nullable: true })
    options: LinkGovernanceRequestOptions | null

    @CustomColumn({ type: 'simple-json', nullable: true })
    summary: LinkGovernanceReportSummary | null

    @CustomColumn({ type: 'simple-json', nullable: true })
    statistics: LinkGovernanceReportStatistics | null

    @CustomColumn({ type: 'simple-json', nullable: true })
    items: LinkGovernanceDiffItem[] | null

    @CustomColumn({ type: 'simple-json', nullable: true })
    redirectSeeds: LinkGovernanceRedirectSeed[] | null

    @CustomColumn({ type: 'text', nullable: true })
    markdown: string | null

    @CustomColumn({ type: 'text', nullable: true })
    error: string | null
}
