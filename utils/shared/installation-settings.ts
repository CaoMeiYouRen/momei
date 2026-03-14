import type { CopyrightType } from '@/types/copyright'
import { SettingKey, type AdminLanguageCode } from '@/types/setting'

export interface InstallationSiteConfigModel {
    siteTitle: string
    siteDescription: string
    siteKeywords: string
    siteUrl: string
    siteCopyright: CopyrightType | ''
    footerCopyrightOwner: string
    footerCopyrightStartYear: string
    defaultLanguage: AdminLanguageCode
}

export interface InstallationExtraConfigModel {
    aiProvider: string
    aiApiKey: string
    aiModel: string
    aiEndpoint: string
    emailHost: string
    emailPort: number
    emailUser: string
    emailPass: string
    emailFrom: string
    storageType: string
    localStorageDir: string
    localStorageBaseUrl: string
    s3Endpoint: string
    s3Bucket: string
    s3Region: string
    s3AccessKey: string
    s3SecretKey: string
    s3BaseUrl: string
    s3BucketPrefix: string
    assetPublicBaseUrl: string
    assetObjectPrefix: string
    baiduAnalytics: string
    googleAnalytics: string
    clarityAnalytics: string
}

export type InstallationSiteFieldErrors = Partial<Record<keyof InstallationSiteConfigModel, string>>
export type InstallationExtraFieldErrors = Partial<Record<keyof InstallationExtraConfigModel, string>>

export const INSTALLATION_SITE_SETTING_KEYS = {
    siteTitle: SettingKey.SITE_TITLE,
    siteDescription: SettingKey.SITE_DESCRIPTION,
    siteKeywords: SettingKey.SITE_KEYWORDS,
    siteUrl: SettingKey.SITE_URL,
    siteCopyright: SettingKey.SITE_COPYRIGHT,
    footerCopyrightOwner: SettingKey.FOOTER_COPYRIGHT_OWNER,
    footerCopyrightStartYear: SettingKey.FOOTER_COPYRIGHT_START_YEAR,
    defaultLanguage: SettingKey.DEFAULT_LANGUAGE,
} as const

export const INSTALLATION_EXTRA_ENV_BACKFILL_MAP = {
    [SettingKey.AI_PROVIDER]: 'aiProvider',
    [SettingKey.AI_API_KEY]: 'aiApiKey',
    [SettingKey.AI_MODEL]: 'aiModel',
    [SettingKey.AI_ENDPOINT]: 'aiEndpoint',
    [SettingKey.EMAIL_HOST]: 'emailHost',
    [SettingKey.EMAIL_PORT]: 'emailPort',
    [SettingKey.EMAIL_USER]: 'emailUser',
    [SettingKey.EMAIL_PASS]: 'emailPass',
    [SettingKey.EMAIL_FROM]: 'emailFrom',
    [SettingKey.STORAGE_TYPE]: 'storageType',
    [SettingKey.LOCAL_STORAGE_DIR]: 'localStorageDir',
    [SettingKey.LOCAL_STORAGE_BASE_URL]: 'localStorageBaseUrl',
    [SettingKey.S3_ENDPOINT]: 's3Endpoint',
    [SettingKey.S3_BUCKET]: 's3Bucket',
    [SettingKey.S3_REGION]: 's3Region',
    [SettingKey.S3_ACCESS_KEY]: 's3AccessKey',
    [SettingKey.S3_SECRET_KEY]: 's3SecretKey',
    [SettingKey.S3_BASE_URL]: 's3BaseUrl',
    [SettingKey.S3_BUCKET_PREFIX]: 's3BucketPrefix',
    [SettingKey.ASSET_PUBLIC_BASE_URL]: 'assetPublicBaseUrl',
    [SettingKey.ASSET_OBJECT_PREFIX]: 'assetObjectPrefix',
    [SettingKey.BAIDU_ANALYTICS]: 'baiduAnalytics',
    [SettingKey.GOOGLE_ANALYTICS]: 'googleAnalytics',
    [SettingKey.CLARITY_ANALYTICS]: 'clarityAnalytics',
} as const satisfies Record<string, keyof InstallationExtraConfigModel>

export const INSTALLATION_SITE_ENV_BACKFILL_MAP = {
    [SettingKey.SITE_TITLE]: 'siteTitle',
    [SettingKey.SITE_DESCRIPTION]: 'siteDescription',
    [SettingKey.SITE_KEYWORDS]: 'siteKeywords',
    [SettingKey.SITE_URL]: 'siteUrl',
    [SettingKey.SITE_COPYRIGHT]: 'siteCopyright',
    [SettingKey.FOOTER_COPYRIGHT_OWNER]: 'footerCopyrightOwner',
    [SettingKey.FOOTER_COPYRIGHT_START_YEAR]: 'footerCopyrightStartYear',
    [SettingKey.DEFAULT_LANGUAGE]: 'defaultLanguage',
} as const satisfies Record<string, keyof InstallationSiteConfigModel>

export const DEFAULT_INSTALLATION_SITE_CONFIG: InstallationSiteConfigModel = {
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    siteUrl: '',
    siteCopyright: 'all-rights-reserved',
    footerCopyrightOwner: '',
    footerCopyrightStartYear: '',
    defaultLanguage: 'zh-CN',
}

export const DEFAULT_INSTALLATION_EXTRA_CONFIG: InstallationExtraConfigModel = {
    aiProvider: 'openai',
    aiApiKey: '',
    aiModel: 'gpt-4o',
    aiEndpoint: '',
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPass: '',
    emailFrom: '',
    storageType: 'local',
    localStorageDir: 'public/uploads',
    localStorageBaseUrl: '/uploads',
    s3Endpoint: '',
    s3Bucket: '',
    s3Region: 'auto',
    s3AccessKey: '',
    s3SecretKey: '',
    s3BaseUrl: '',
    s3BucketPrefix: '',
    assetPublicBaseUrl: '',
    assetObjectPrefix: '',
    baiduAnalytics: '',
    googleAnalytics: '',
    clarityAnalytics: '',
}
