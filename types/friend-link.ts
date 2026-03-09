export enum FriendLinkStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum FriendLinkHealthStatus {
    UNKNOWN = 'unknown',
    HEALTHY = 'healthy',
    UNREACHABLE = 'unreachable',
    CHECKING = 'checking',
}

export enum FriendLinkApplicationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    ARCHIVED = 'archived',
}

export type FriendLinkSource = 'manual' | 'application'

export interface FriendLinkMeta {
    enabled: boolean
    applicationEnabled: boolean
    applicationGuidelines: string
    footerEnabled: boolean
    footerLimit: number
    checkIntervalMinutes: number
}

export interface FriendLinkHealthCheckResult {
    ok: boolean
    httpStatus: number | null
    errorMessage: string | null
}
