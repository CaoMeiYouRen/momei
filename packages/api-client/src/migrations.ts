import type { MomeiHttpClient } from './client'
import type {
    MomeiLinkGovernanceReportData,
    MomeiLinkGovernanceRequest,
} from './types'

export class MigrationsApi {
    constructor(private client: MomeiHttpClient) {}

    async dryRunLinkGovernance(request: MomeiLinkGovernanceRequest): Promise<MomeiLinkGovernanceReportData> {
        return this.client.post<MomeiLinkGovernanceReportData>('/api/external/migrations/link-governance/dry-run', request).then((r) => r.data)
    }

    async applyLinkGovernance(request: MomeiLinkGovernanceRequest): Promise<MomeiLinkGovernanceReportData> {
        return this.client.post<MomeiLinkGovernanceReportData>('/api/external/migrations/link-governance/apply', request).then((r) => r.data)
    }

    async getLinkGovernanceReport(reportId: string): Promise<MomeiLinkGovernanceReportData> {
        return this.client.get<MomeiLinkGovernanceReportData>(`/api/external/migrations/link-governance/reports/${reportId}`).then((r) => r.data)
    }
}
