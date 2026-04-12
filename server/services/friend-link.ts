import { dataSource } from '@/server/database'
import { FriendLinkApplication } from '@/server/entities/friend-link-application'
import { FriendLinkCategory } from '@/server/entities/friend-link-category'
import { FriendLink } from '@/server/entities/friend-link'
import { getLocalizedSetting, getSetting } from '@/server/services/setting'
import { getUploadStorageContext } from '@/server/services/upload'
import logger from '@/server/utils/logger'
import { assignDefined } from '@/server/utils/object'
import { ensureFound, paginate } from '@/server/utils/response'
import { isValidCustomUrl } from '@/server/utils/security'
import { addSecondsToDate } from '@/utils/shared/date'
import { normalizeDurationMinutes } from '@/utils/shared/duration'
import { normalizeOptionalString } from '@/utils/shared/coerce'
import { normalizeAsciiSlug } from '@/utils/shared/slug'
import { normalizeBaseUrl } from '@/utils/shared/url'
import {
    FriendLinkHealthStatus,
    FriendLinkApplicationStatus,
    FriendLinkStatus,
    type FriendLinkHealthCheckResult,
    type FriendLinkMeta,
} from '@/types/friend-link'
import { SettingKey } from '@/types/setting'

const DEFAULT_FOOTER_LIMIT = 6
const DEFAULT_CHECK_INTERVAL_MINUTES = 1440
const MIN_CHECK_INTERVAL_MINUTES = 60
const DEFAULT_HEALTH_CHECK_BATCH_SIZE = 20
const DEFAULT_HEALTH_CHECK_TIMEOUT_MS = 8000
const DEFAULT_FAILURE_BACKOFF_FLOOR_MINUTES = 360
const DEFAULT_FAILURE_BACKOFF_MAX_MINUTES = 7 * 24 * 60

function parsePositiveInteger(value: string | number | null | undefined, fallback: number, min = 1, max?: number) {
    const normalized = typeof value === 'string' ? Number(value) : value

    if (!Number.isFinite(normalized) || normalized === undefined || normalized === null) {
        return fallback
    }

    const nextValue = Math.max(min, Math.floor(normalized))

    if (max !== undefined) {
        return Math.min(nextValue, max)
    }

    return nextValue
}

function addMinutes(base: Date, minutes: number) {
    return addSecondsToDate(base, minutes * 60)
}

function normalizeFriendLinkCheckIntervalMinutes(value: string | number | null | undefined) {
    return normalizeDurationMinutes(value, DEFAULT_CHECK_INTERVAL_MINUTES, {
        min: MIN_CHECK_INTERVAL_MINUTES,
    })
}

function getHealthCheckBatchSize() {
    return parsePositiveInteger(process.env.FRIEND_LINKS_CHECK_BATCH_SIZE, DEFAULT_HEALTH_CHECK_BATCH_SIZE, 1, 200)
}

function getHealthCheckTimeoutMs() {
    return parsePositiveInteger(process.env.FRIEND_LINKS_CHECK_TIMEOUT_MS, DEFAULT_HEALTH_CHECK_TIMEOUT_MS, 1000, 60000)
}

function getFailureBackoffMaxMinutes() {
    return parsePositiveInteger(
        process.env.FRIEND_LINKS_FAILURE_BACKOFF_MAX_MINUTES,
        DEFAULT_FAILURE_BACKOFF_MAX_MINUTES,
        DEFAULT_FAILURE_BACKOFF_FLOOR_MINUTES,
    )
}

function calculateFailureCooldownMinutes(checkIntervalMinutes: number, failureCount: number) {
    const cooldownFloor = Math.max(checkIntervalMinutes, DEFAULT_FAILURE_BACKOFF_FLOOR_MINUTES)
    const multiplier = 2 ** Math.max(0, failureCount - 1)
    return Math.min(getFailureBackoffMaxMinutes(), cooldownFloor * multiplier)
}

function getAutoDisableFailureThreshold() {
    const raw = Number(process.env.FRIEND_LINKS_AUTO_DISABLE_FAILURE_THRESHOLD || 0)

    if (!Number.isFinite(raw) || raw < 0) {
        return 0
    }

    return Math.floor(raw)
}

function isHttpUrl(value: string) {
    try {
        const url = new URL(value)
        return ['http:', 'https:'].includes(url.protocol)
    } catch {
        return false
    }
}

function slugify(value: string) {
    const slug = normalizeAsciiSlug(value)
    return slug || `category-${Date.now()}`
}

function isUrlWithinBase(url: string, baseUrl: string) {
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl)

    if (!normalizedBaseUrl) {
        return false
    }

    return url === normalizedBaseUrl.slice(0, -1) || url.startsWith(normalizedBaseUrl)
}

async function isUploadedAssetUrl(url: string) {
    const storageContext = await getUploadStorageContext()
    const baseUrls = [storageContext.assetPublicBaseUrl, storageContext.driverBaseUrl]
        .map((value) => normalizeBaseUrl(value))
        .filter((value): value is string => Boolean(value))

    return baseUrls.some((baseUrl) => isUrlWithinBase(url, baseUrl))
}

async function ensureAllowedLogoUrl(url?: string | null, allowUploadedAsset = false) {
    const normalizedUrl = normalizeOptionalString(url)

    if (!normalizedUrl) {
        return
    }

    if (isValidCustomUrl(normalizedUrl)) {
        return
    }

    if (allowUploadedAsset && await isUploadedAssetUrl(normalizedUrl)) {
        return
    }

    throw createError({
        statusCode: 400,
        statusMessage: 'Invalid friend link logo URL',
    })
}

async function resolveFriendLinkMeta(locale?: string | null): Promise<FriendLinkMeta> {
    const [enabledRaw, applicationEnabledRaw, guidelines, footerEnabledRaw, footerLimitRaw, checkIntervalRaw] = await Promise.all([
        getSetting(SettingKey.FRIEND_LINKS_ENABLED, 'true'),
        getSetting(SettingKey.FRIEND_LINKS_APPLICATION_ENABLED, 'true'),
        getLocalizedSetting(SettingKey.FRIEND_LINKS_APPLICATION_GUIDELINES, locale),
        getSetting(SettingKey.FRIEND_LINKS_FOOTER_ENABLED, 'true'),
        getSetting(SettingKey.FRIEND_LINKS_FOOTER_LIMIT, String(DEFAULT_FOOTER_LIMIT)),
        getSetting(SettingKey.FRIEND_LINKS_CHECK_INTERVAL_MINUTES, String(DEFAULT_CHECK_INTERVAL_MINUTES)),
    ])

    return {
        enabled: String(enabledRaw) !== 'false',
        applicationEnabled: String(applicationEnabledRaw) !== 'false',
        applicationGuidelines: typeof guidelines.value === 'string' ? guidelines.value : '',
        footerEnabled: String(footerEnabledRaw) !== 'false',
        footerLimit: parsePositiveInteger(footerLimitRaw, DEFAULT_FOOTER_LIMIT, 1, 50),
        checkIntervalMinutes: normalizeFriendLinkCheckIntervalMinutes(checkIntervalRaw),
    }
}

async function ensureUniqueFriendLinkUrl(url: string, excludeId?: string) {
    const friendLinkRepo = dataSource.getRepository(FriendLink)
    const existing = await friendLinkRepo.findOne({ where: { url } })

    if (existing && existing.id !== excludeId) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Friend link already exists',
        })
    }
}

async function saveFriendLinkEntity(
    entity: FriendLink,
    input: Partial<FriendLink>,
    operatorId: string | null,
) {
    assignDefined(entity, input, [
        'name',
        'url',
        'logo',
        'description',
        'rssUrl',
        'contactEmail',
        'categoryId',
        'status',
        'source',
        'isPinned',
        'isFeatured',
        'sortOrder',
        'applicationId',
    ])

    entity.logo = normalizeOptionalString(entity.logo)
    entity.description = normalizeOptionalString(entity.description)
    entity.rssUrl = normalizeOptionalString(entity.rssUrl)
    entity.contactEmail = normalizeOptionalString(entity.contactEmail)
    entity.categoryId = normalizeOptionalString(entity.categoryId)
    entity.updatedById = operatorId

    if (!entity.createdById) {
        entity.createdById = operatorId
    }

    if (!entity.status) {
        entity.status = FriendLinkStatus.DRAFT
    }

    await ensureAllowedLogoUrl(entity.logo, Boolean(operatorId))
    await ensureUniqueFriendLinkUrl(entity.url, entity.id)

    return await dataSource.getRepository(FriendLink).save(entity)
}

async function probeFriendLink(url: string): Promise<FriendLinkHealthCheckResult> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), getHealthCheckTimeoutMs())

    try {
        let response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            signal: controller.signal,
        })

        if (response.status === 403 || response.status === 405) {
            response = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                signal: controller.signal,
            })
        }

        return {
            ok: response.ok,
            httpStatus: response.status,
            errorMessage: response.ok ? null : `HTTP ${response.status}`,
        }
    } catch (error) {
        return {
            ok: false,
            httpStatus: null,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
        }
    } finally {
        clearTimeout(timer)
    }
}

export const friendLinkService = {
    async getMeta(locale?: string | null) {
        return await resolveFriendLinkMeta(locale)
    },

    async getCategories(options: { enabledOnly?: boolean } = {}) {
        const categoryRepo = dataSource.getRepository(FriendLinkCategory)
        const where = options.enabledOnly ? { isEnabled: true } : {}

        return await categoryRepo.find({
            where,
            order: {
                sortOrder: 'ASC',
                createdAt: 'ASC',
            },
        })
    },

    async createCategory(input: {
        name: string
        slug?: string | null
        description?: string | null
        sortOrder?: number
        isEnabled?: boolean
    }) {
        const categoryRepo = dataSource.getRepository(FriendLinkCategory)
        const category = new FriendLinkCategory()

        category.name = input.name.trim()
        category.slug = normalizeOptionalString(input.slug) || slugify(input.name)
        category.description = normalizeOptionalString(input.description)
        category.sortOrder = input.sortOrder ?? 0
        category.isEnabled = input.isEnabled ?? true

        return await categoryRepo.save(category)
    },

    async updateCategory(id: string, input: {
        name?: string
        slug?: string | null
        description?: string | null
        sortOrder?: number
        isEnabled?: boolean
    }) {
        const categoryRepo = dataSource.getRepository(FriendLinkCategory)
        const category = ensureFound(await categoryRepo.findOne({ where: { id } }), 'Friend link category')

        if (input.name !== undefined) {
            category.name = input.name.trim()
        }
        if (input.slug !== undefined) {
            category.slug = normalizeOptionalString(input.slug) || slugify(category.name)
        }
        if (input.description !== undefined) {
            category.description = normalizeOptionalString(input.description)
        }
        if (input.sortOrder !== undefined) {
            category.sortOrder = input.sortOrder
        }
        if (input.isEnabled !== undefined) {
            category.isEnabled = input.isEnabled
        }

        return await categoryRepo.save(category)
    },

    async deleteCategory(id: string) {
        const categoryRepo = dataSource.getRepository(FriendLinkCategory)
        const category = ensureFound(await categoryRepo.findOne({ where: { id } }), 'Friend link category')
        await categoryRepo.remove(category)
    },

    async getFriendLinks(options: {
        page?: number
        limit?: number
        status?: FriendLinkStatus
        categoryId?: string
        featured?: boolean
        keyword?: string
    } = {}) {
        const friendLinkRepo = dataSource.getRepository(FriendLink)
        const page = options.page ?? 1
        const limit = options.limit ?? 20
        const qb = friendLinkRepo.createQueryBuilder('friendLink')
            .leftJoinAndSelect('friendLink.category', 'category')
            .orderBy('friendLink.isPinned', 'DESC')
            .addOrderBy('friendLink.sortOrder', 'ASC')
            .addOrderBy('friendLink.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)

        if (options.status) {
            qb.andWhere('friendLink.status = :status', { status: options.status })
        }

        if (options.categoryId) {
            qb.andWhere('friendLink.categoryId = :categoryId', { categoryId: options.categoryId })
        }

        if (options.featured !== undefined) {
            qb.andWhere('friendLink.isFeatured = :featured', { featured: options.featured })
        }

        if (options.keyword) {
            qb.andWhere('(friendLink.name LIKE :keyword OR friendLink.description LIKE :keyword OR friendLink.url LIKE :keyword)', {
                keyword: `%${options.keyword}%`,
            })
        }

        const [items, total] = await qb.getManyAndCount()
        return paginate(items, total, page, limit)
    },

    async getPublicFriendLinks(options: {
        categoryId?: string
        featured?: boolean
        limit?: number
    } = {}) {
        const meta = await resolveFriendLinkMeta()

        if (!meta.enabled) {
            return {
                meta,
                items: [],
                groups: [],
            }
        }

        const friendLinkRepo = dataSource.getRepository(FriendLink)
        const qb = friendLinkRepo.createQueryBuilder('friendLink')
            .leftJoinAndSelect('friendLink.category', 'category')
            .where('friendLink.status = :status', { status: FriendLinkStatus.ACTIVE })
            .orderBy('friendLink.isPinned', 'DESC')
            .addOrderBy('friendLink.sortOrder', 'ASC')
            .addOrderBy('friendLink.createdAt', 'DESC')

        if (options.categoryId) {
            qb.andWhere('friendLink.categoryId = :categoryId', { categoryId: options.categoryId })
        }

        if (options.featured) {
            if (!meta.footerEnabled) {
                return {
                    meta,
                    items: [],
                    groups: [],
                }
            }
            qb.andWhere('friendLink.isFeatured = :featured', { featured: true })
            qb.take(options.limit ?? meta.footerLimit)
        }

        const items = await qb.getMany()
        const groupMap = new Map<string, { category: FriendLinkCategory | null, items: FriendLink[] }>()

        for (const item of items) {
            const key = item.categoryId || 'uncategorized'
            const current = groupMap.get(key)

            if (current) {
                current.items.push(item)
                continue
            }

            groupMap.set(key, {
                category: item.category || null,
                items: [item],
            })
        }

        return {
            meta,
            items,
            groups: Array.from(groupMap.values()),
        }
    },

    async createFriendLink(input: {
        name: string
        url: string
        logo?: string | null
        description?: string | null
        rssUrl?: string | null
        contactEmail?: string | null
        categoryId?: string | null
        status?: FriendLinkStatus
        isPinned?: boolean
        isFeatured?: boolean
        sortOrder?: number
        applicationId?: string | null
        source?: 'manual' | 'application'
    }, operatorId: string | null) {
        if (!isHttpUrl(input.url)) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid friend link URL' })
        }

        const entity = new FriendLink()
        entity.name = input.name.trim()
        entity.url = input.url.trim()
        entity.source = input.source ?? 'manual'
        entity.status = input.status ?? FriendLinkStatus.DRAFT
        entity.isPinned = input.isPinned ?? false
        entity.isFeatured = input.isFeatured ?? false
        entity.sortOrder = input.sortOrder ?? 0
        entity.healthStatus = FriendLinkHealthStatus.UNKNOWN
        entity.consecutiveFailures = 0
        entity.healthCheckCooldownUntil = null
        entity.createdById = operatorId

        return await saveFriendLinkEntity(entity, input, operatorId)
    },

    async updateFriendLink(id: string, input: {
        name?: string
        url?: string
        logo?: string | null
        description?: string | null
        rssUrl?: string | null
        contactEmail?: string | null
        categoryId?: string | null
        status?: FriendLinkStatus
        isPinned?: boolean
        isFeatured?: boolean
        sortOrder?: number
    }, operatorId: string | null) {
        const friendLinkRepo = dataSource.getRepository(FriendLink)
        const entity = ensureFound(await friendLinkRepo.findOne({ where: { id } }), 'Friend link')

        if (input.url !== undefined && !isHttpUrl(input.url)) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid friend link URL' })
        }

        if (input.name !== undefined) {
            entity.name = input.name.trim()
        }
        if (input.url !== undefined) {
            entity.url = input.url.trim()
        }

        return await saveFriendLinkEntity(entity, input, operatorId)
    },

    async deleteFriendLink(id: string) {
        const friendLinkRepo = dataSource.getRepository(FriendLink)
        const entity = ensureFound(await friendLinkRepo.findOne({ where: { id } }), 'Friend link')
        await friendLinkRepo.remove(entity)
    },

    async getApplications(options: {
        page?: number
        limit?: number
        status?: FriendLinkApplicationStatus
    } = {}) {
        const applicationRepo = dataSource.getRepository(FriendLinkApplication)
        const page = options.page ?? 1
        const limit = options.limit ?? 20
        const qb = applicationRepo.createQueryBuilder('application')
            .leftJoinAndSelect('application.applicant', 'applicant')
            .orderBy('application.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)

        if (options.status) {
            qb.andWhere('application.status = :status', { status: options.status })
        }

        const [items, total] = await qb.getManyAndCount()
        return paginate(items, total, page, limit)
    },

    async createApplication(input: {
        name: string
        url: string
        logo?: string | null
        description?: string | null
        categoryId?: string | null
        categorySuggestion?: string | null
        contactName?: string | null
        contactEmail: string
        rssUrl?: string | null
        reciprocalUrl?: string | null
        message?: string | null
        applicantId?: string | null
        submittedIp?: string | null
        submittedUserAgent?: string | null
    }) {
        const meta = await resolveFriendLinkMeta()

        if (!meta.enabled || !meta.applicationEnabled) {
            throw createError({ statusCode: 403, statusMessage: 'Friend link application is disabled' })
        }

        const applicationRepo = dataSource.getRepository(FriendLinkApplication)
        const existing = await applicationRepo.findOne({
            where: {
                url: input.url,
                status: FriendLinkApplicationStatus.PENDING,
            },
        })

        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'A pending application already exists for this URL' })
        }

        const entity = new FriendLinkApplication()
        entity.name = input.name.trim()
        entity.url = input.url.trim()
        entity.logo = normalizeOptionalString(input.logo)
        entity.description = normalizeOptionalString(input.description)
        entity.categoryId = normalizeOptionalString(input.categoryId)
        entity.categorySuggestion = normalizeOptionalString(input.categorySuggestion)
        entity.contactName = normalizeOptionalString(input.contactName)
        entity.contactEmail = input.contactEmail.trim()
        entity.rssUrl = normalizeOptionalString(input.rssUrl)
        entity.reciprocalUrl = normalizeOptionalString(input.reciprocalUrl)
        entity.message = normalizeOptionalString(input.message)
        entity.applicantId = normalizeOptionalString(input.applicantId)
        entity.status = FriendLinkApplicationStatus.PENDING
        entity.submittedIp = normalizeOptionalString(input.submittedIp)
        entity.submittedUserAgent = normalizeOptionalString(input.submittedUserAgent)
        entity.reviewNote = null
        entity.reviewedById = null
        entity.reviewedAt = null
        entity.friendLinkId = null

        await ensureAllowedLogoUrl(entity.logo, Boolean(entity.applicantId))

        return await applicationRepo.save(entity)
    },

    async reviewApplication(id: string, input: {
        status: FriendLinkApplicationStatus
        reviewNote?: string | null
        linkData?: Partial<FriendLink>
    }, reviewerId: string) {
        const applicationRepo = dataSource.getRepository(FriendLinkApplication)
        const friendLinkRepo = dataSource.getRepository(FriendLink)
        const application = ensureFound(await applicationRepo.findOne({ where: { id } }), 'Friend link application')

        application.status = input.status
        application.reviewNote = normalizeOptionalString(input.reviewNote)
        application.reviewedById = reviewerId
        application.reviewedAt = new Date()

        let friendLink: FriendLink | null = null

        if (input.status === FriendLinkApplicationStatus.APPROVED) {
            const existingLink = application.friendLinkId
                ? await friendLinkRepo.findOne({ where: { id: application.friendLinkId } })
                : await friendLinkRepo.findOne({ where: { url: application.url } })

            if (existingLink) {
                existingLink.name = input.linkData?.name?.trim() || application.name
                existingLink.url = input.linkData?.url?.trim() || application.url
                existingLink.logo = normalizeOptionalString(input.linkData?.logo as string | undefined) ?? application.logo
                existingLink.description = normalizeOptionalString(input.linkData?.description as string | undefined) ?? application.description
                existingLink.rssUrl = normalizeOptionalString(input.linkData?.rssUrl as string | undefined) ?? application.rssUrl
                existingLink.contactEmail = normalizeOptionalString(input.linkData?.contactEmail as string | undefined) ?? application.contactEmail
                existingLink.categoryId = normalizeOptionalString(input.linkData?.categoryId as string | undefined) ?? application.categoryId
                existingLink.status = input.linkData?.status ?? FriendLinkStatus.ACTIVE
                existingLink.healthStatus = FriendLinkHealthStatus.UNKNOWN
                existingLink.consecutiveFailures = 0
                existingLink.healthCheckCooldownUntil = null
                existingLink.isPinned = input.linkData?.isPinned ?? existingLink.isPinned
                existingLink.isFeatured = input.linkData?.isFeatured ?? existingLink.isFeatured
                existingLink.sortOrder = input.linkData?.sortOrder ?? existingLink.sortOrder
                existingLink.applicationId = application.id
                existingLink.source = 'application'
                existingLink.updatedById = reviewerId
                friendLink = await saveFriendLinkEntity(existingLink, existingLink, reviewerId)
            } else {
                friendLink = await this.createFriendLink({
                    name: input.linkData?.name?.trim() || application.name,
                    url: input.linkData?.url?.trim() || application.url,
                    logo: normalizeOptionalString(input.linkData?.logo as string | undefined) ?? application.logo,
                    description: normalizeOptionalString(input.linkData?.description as string | undefined) ?? application.description,
                    rssUrl: normalizeOptionalString(input.linkData?.rssUrl as string | undefined) ?? application.rssUrl,
                    contactEmail: normalizeOptionalString(input.linkData?.contactEmail as string | undefined) ?? application.contactEmail,
                    categoryId: normalizeOptionalString(input.linkData?.categoryId as string | undefined) ?? application.categoryId,
                    status: input.linkData?.status ?? FriendLinkStatus.ACTIVE,
                    isPinned: input.linkData?.isPinned ?? false,
                    isFeatured: input.linkData?.isFeatured ?? false,
                    sortOrder: input.linkData?.sortOrder ?? 0,
                    source: 'application',
                    applicationId: application.id,
                }, reviewerId)
            }

            application.friendLinkId = friendLink.id
        }

        await applicationRepo.save(application)

        return {
            application,
            friendLink,
        }
    },

    async runHealthCheck(limit = getHealthCheckBatchSize()) {
        const meta = await resolveFriendLinkMeta()

        if (!meta.enabled) {
            return 0
        }

        const friendLinkRepo = dataSource.getRepository(FriendLink)
        const autoDisableFailureThreshold = getAutoDisableFailureThreshold()
        const now = new Date()
        const normalizedLimit = parsePositiveInteger(limit, getHealthCheckBatchSize(), 1, 200)
        const candidates = await friendLinkRepo.createQueryBuilder('friendLink')
            .where('friendLink.status = :status', { status: FriendLinkStatus.ACTIVE })
            .andWhere('(friendLink.healthCheckCooldownUntil IS NULL OR friendLink.healthCheckCooldownUntil <= :now)', { now })
            .orderBy('friendLink.healthCheckCooldownUntil', 'ASC')
            .addOrderBy('friendLink.lastCheckedAt', 'ASC')
            .addOrderBy('friendLink.createdAt', 'ASC')
            .take(normalizedLimit)
            .getMany()

        for (const candidate of candidates) {
            const result = await probeFriendLink(candidate.url)
            const checkedAt = new Date()

            candidate.healthStatus = FriendLinkHealthStatus.CHECKING
            candidate.lastCheckedAt = checkedAt
            candidate.lastHttpStatus = result.httpStatus
            candidate.lastErrorMessage = result.errorMessage

            if (result.ok) {
                candidate.healthStatus = FriendLinkHealthStatus.HEALTHY
                candidate.consecutiveFailures = 0
                candidate.healthCheckCooldownUntil = addMinutes(checkedAt, meta.checkIntervalMinutes)
            } else {
                candidate.healthStatus = FriendLinkHealthStatus.UNREACHABLE
                candidate.consecutiveFailures = (candidate.consecutiveFailures || 0) + 1
                candidate.healthCheckCooldownUntil = addMinutes(
                    checkedAt,
                    calculateFailureCooldownMinutes(meta.checkIntervalMinutes, candidate.consecutiveFailures),
                )

                if (autoDisableFailureThreshold > 0 && candidate.consecutiveFailures >= autoDisableFailureThreshold) {
                    candidate.status = FriendLinkStatus.INACTIVE
                }
            }

            await friendLinkRepo.save(candidate)
        }

        if (candidates.length > 0) {
            logger.info(`[FriendLinks] Health check completed for ${candidates.length} links.`)
        }

        return candidates.length
    },
}
