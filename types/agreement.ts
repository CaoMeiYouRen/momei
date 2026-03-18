export type AgreementType = 'user_agreement' | 'privacy_policy'
export type AgreementReviewStatus = 'draft' | 'pending_review' | 'approved'

export type AgreementRestrictionReason = 'env_locked' | 'consented' | 'active_authoritative'

export interface AgreementHistoryItem {
    id: string
    version: string | null
    versionDescription: string | null
    language: string
    effectiveAt: string | null
    updatedAt: string | null
    isCurrentActive: boolean
}

export interface AgreementAdminOption {
    id: string
    version: string | null
    language: string
    label: string
}

export interface AgreementAdminItem {
    id: string
    type: AgreementType
    language: string
    version: string | null
    versionDescription: string | null
    content: string
    reviewStatus: AgreementReviewStatus
    isFromEnv: boolean
    hasUserConsent: boolean
    isAuthoritativeVersion: boolean
    isReferenceTranslation: boolean
    isCurrentActive: boolean
    isCurrentReference: boolean
    sourceAgreementId: string | null
    sourceAgreementVersion: string | null
    sourceAgreementLanguage: string | null
    effectiveAt: string | null
    updatedAt: string | null
    createdAt: string | null
    canEdit: boolean
    canDelete: boolean
    canActivate: boolean
    restrictionReasons: AgreementRestrictionReason[]
}

export interface AgreementAdminListPayload {
    mainLanguage: string
    activeAgreementId: string | null
    items: AgreementAdminItem[]
    authoritativeOptions: AgreementAdminOption[]
}

export interface AgreementPublicPayload {
    id: string
    type: AgreementType
    language: string
    content: string
    version: string | null
    versionDescription: string | null
    effectiveAt: string | null
    updatedAt: string | null
    authoritativeLanguage: string
    authoritativeVersion: string | null
    isDefault: boolean
    isReferenceTranslation: boolean
    fallbackToAuthoritative: boolean
    sourceAgreementId: string | null
    sourceAgreementVersion: string | null
    history: AgreementHistoryItem[]
}
