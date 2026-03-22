import { plainTextToHtml } from '@/server/utils/html'
import { emailTemplateEngine } from '@/server/utils/email/templates'
import { resolveEmailTemplateRuntimeContent } from '@/server/services/email-template'
import { getSettings } from '@/server/services/setting'
import type { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { SettingKey } from '@/types/setting'
import { toBoolean } from '@/utils/shared/coerce'

type ListmonkDispatchAction = 'created' | 'updated'

export type ListmonkDispatchErrorCode = 'CONFIG_MISSING' | 'LIST_MAPPING_MISSING' | 'REMOTE_REQUEST_FAILED'

export interface ListmonkDispatchConfig {
    enabled: boolean
    baseUrl: string
    username: string
    accessToken: string
    defaultListIds: number[]
    categoryListMap: Record<string, number[]>
    tagListMap: Record<string, number[]>
    templateId: number | null
    missingFields: string[]
}

export interface ListmonkDispatchResult {
    remoteCampaignId: number
    action: ListmonkDispatchAction
    listIds: number[]
}

export class ListmonkDispatchError extends Error {
    code: ListmonkDispatchErrorCode
    manualAction: string | null
    remoteCampaignId: number | null
    listIds: number[]
    action: ListmonkDispatchAction | null

    constructor(
        message: string,
        options: {
            code: ListmonkDispatchErrorCode
            manualAction?: string | null
            remoteCampaignId?: number | null
            listIds?: number[]
            action?: ListmonkDispatchAction | null
        },
    ) {
        super(message)
        this.name = 'ListmonkDispatchError'
        this.code = options.code
        this.manualAction = options.manualAction ?? null
        this.remoteCampaignId = options.remoteCampaignId ?? null
        this.listIds = options.listIds ?? []
        this.action = options.action ?? null
    }
}

function parseNumberList(value: string | null | undefined) {
    if (!value) {
        return []
    }

    return [...new Set(
        value
            .split(',')
            .map((item) => Number(item.trim()))
            .filter((item) => Number.isInteger(item) && item > 0),
    )]
}

function parseMapping(value: string | null | undefined) {
    if (!value) {
        return {} as Record<string, number[]>
    }

    const parsed = JSON.parse(value) as Record<string, number[] | number | string>
    return Object.fromEntries(Object.entries(parsed).map(([key, rawValue]) => {
        if (Array.isArray(rawValue)) {
            return [key, [...new Set(rawValue.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))]]
        }

        if (typeof rawValue === 'number') {
            return [key, Number.isInteger(rawValue) && rawValue > 0 ? [rawValue] : []]
        }

        if (typeof rawValue === 'string') {
            return [key, parseNumberList(rawValue)]
        }

        return [key, []]
    }))
}

function parseOptionalNumber(value: string | null | undefined) {
    if (!value) {
        return null
    }

    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function getListmonkState(campaign: MarketingCampaign) {
    return campaign.targetCriteria?.externalDistribution?.listmonk ?? null
}

function buildAuthHeader(username: string, accessToken: string) {
    return `Basic ${Buffer.from(`${username}:${accessToken}`).toString('base64')}`
}

async function buildCampaignBody(campaign: MarketingCampaign) {
    const locale = campaign.targetCriteria?.articleLocale || 'zh-CN'

    const params = {
        appName: 'Momei',
        title: campaign.title,
        summary: campaign.content,
    }
    const template = await resolveEmailTemplateRuntimeContent({
        templateId: 'marketingCampaign',
        locale,
        params,
    })

    const result = await emailTemplateEngine.generateMarketingEmailTemplate(
        {
            headerIcon: template.headerIcon,
            message: plainTextToHtml(campaign.content),
            articleTitle: campaign.targetCriteria?.articleTitle || campaign.title,
            authorLabel: template.authorLabel ?? '',
            authorName: campaign.targetCriteria?.authorName || 'Admin',
            categoryLabel: template.categoryLabel ?? '',
            categoryName: campaign.targetCriteria?.categoryName || 'General',
            dateLabel: template.dateLabel ?? '',
            publishDate: campaign.targetCriteria?.publishDate || '',
            buttonText: template.buttonText ?? '',
            actionUrl: campaign.targetCriteria?.articleLink || '/',
        },
        {
            title: template.title,
            preheader: template.preheader,
            locale,
        },
    )

    return result.html
}

function buildCampaignPayload(campaign: MarketingCampaign, body: string, listIds: number[], templateId: number | null) {
    const payload: Record<string, unknown> = {
        name: `${campaign.title} (${campaign.id})`,
        subject: campaign.title,
        lists: listIds,
        content_type: 'html',
        body,
        messenger: 'email',
        type: 'regular',
        tags: ['momei', campaign.type.toLowerCase()],
    }

    if (templateId) {
        payload.template_id = templateId
    }

    return payload
}

async function requestListmonk<T>(config: ListmonkDispatchConfig, path: string, options: { method?: 'GET' | 'POST' | 'PUT', body?: Record<string, unknown> } = {}) {
    return await $fetch<T>(`${config.baseUrl}${path}`, {
        method: options.method || 'GET',
        headers: {
            Authorization: buildAuthHeader(config.username, config.accessToken),
        },
        body: options.body,
    })
}

function extractRemoteCampaignId(response: unknown) {
    const candidate = response as {
        data?: { id?: number | string }
        id?: number | string
    }

    const rawId = candidate?.data?.id ?? candidate?.id
    const parsed = Number(rawId)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export async function getListmonkDispatchConfig(): Promise<ListmonkDispatchConfig> {
    const settings = await getSettings([
        SettingKey.LISTMONK_ENABLED,
        SettingKey.LISTMONK_INSTANCE_URL,
        SettingKey.LISTMONK_USERNAME,
        SettingKey.LISTMONK_ACCESS_TOKEN,
        SettingKey.LISTMONK_DEFAULT_LIST_IDS,
        SettingKey.LISTMONK_CATEGORY_LIST_MAP,
        SettingKey.LISTMONK_TAG_LIST_MAP,
        SettingKey.LISTMONK_TEMPLATE_ID,
    ])

    const enabled = toBoolean(settings[SettingKey.LISTMONK_ENABLED])
    const baseUrl = (settings[SettingKey.LISTMONK_INSTANCE_URL] || '').trim().replace(/\/$/, '')
    const username = (settings[SettingKey.LISTMONK_USERNAME] || '').trim()
    const accessToken = (settings[SettingKey.LISTMONK_ACCESS_TOKEN] || '').trim()
    const missingFields = enabled
        ? [
            !baseUrl ? SettingKey.LISTMONK_INSTANCE_URL : null,
            !username ? SettingKey.LISTMONK_USERNAME : null,
            !accessToken ? SettingKey.LISTMONK_ACCESS_TOKEN : null,
        ].filter(Boolean) as string[]
        : []

    return {
        enabled,
        baseUrl,
        username,
        accessToken,
        defaultListIds: parseNumberList(settings[SettingKey.LISTMONK_DEFAULT_LIST_IDS]),
        categoryListMap: parseMapping(settings[SettingKey.LISTMONK_CATEGORY_LIST_MAP]),
        tagListMap: parseMapping(settings[SettingKey.LISTMONK_TAG_LIST_MAP]),
        templateId: parseOptionalNumber(settings[SettingKey.LISTMONK_TEMPLATE_ID]),
        missingFields,
    }
}

export function resolveListmonkTargetListIds(campaign: MarketingCampaign, config: ListmonkDispatchConfig) {
    const categoryIds = Array.isArray(campaign.targetCriteria?.categoryIds) ? campaign.targetCriteria.categoryIds as string[] : []
    const tagIds = Array.isArray(campaign.targetCriteria?.tagIds) ? campaign.targetCriteria.tagIds as string[] : []

    const mappedCategoryIds = categoryIds.flatMap((categoryId) => config.categoryListMap[categoryId] || [])
    const mappedTagIds = tagIds.flatMap((tagId) => config.tagListMap[tagId] || [])

    return [...new Set([...config.defaultListIds, ...mappedCategoryIds, ...mappedTagIds])]
}

export async function dispatchListmonkCampaign(campaign: MarketingCampaign, configInput?: ListmonkDispatchConfig): Promise<ListmonkDispatchResult> {
    const config = configInput || await getListmonkDispatchConfig()

    if (!config.enabled || config.missingFields.length > 0) {
        throw new ListmonkDispatchError(
            `Listmonk configuration is incomplete: ${config.missingFields.join(', ')}`,
            {
                code: 'CONFIG_MISSING',
                manualAction: '请在系统设置中补齐 listmonk 实例地址、用户名和 Access Token。',
            },
        )
    }

    const listIds = resolveListmonkTargetListIds(campaign, config)
    if (listIds.length === 0) {
        throw new ListmonkDispatchError('No target list configured for listmonk campaign dispatch', {
            code: 'LIST_MAPPING_MISSING',
            manualAction: '请配置默认列表或分类/标签到 listmonk 列表的映射。',
        })
    }

    const remoteState = getListmonkState(campaign)
    const existingRemoteCampaignId = Number(remoteState?.remoteCampaignId)
    const remoteCampaignId = Number.isInteger(existingRemoteCampaignId) && existingRemoteCampaignId > 0
        ? existingRemoteCampaignId
        : null
    const body = await buildCampaignBody(campaign)
    const payload = buildCampaignPayload(campaign, body, listIds, config.templateId)

    let currentRemoteCampaignId = remoteCampaignId
    const action: ListmonkDispatchAction = currentRemoteCampaignId ? 'updated' : 'created'

    try {
        if (currentRemoteCampaignId) {
            await requestListmonk(config, `/api/campaigns/${currentRemoteCampaignId}`, {
                method: 'PUT',
                body: payload,
            })
        } else {
            const response = await requestListmonk(config, '/api/campaigns', {
                method: 'POST',
                body: payload,
            })
            currentRemoteCampaignId = extractRemoteCampaignId(response)

            if (!currentRemoteCampaignId) {
                throw new ListmonkDispatchError('Listmonk create campaign response missing remote id', {
                    code: 'REMOTE_REQUEST_FAILED',
                    manualAction: '请检查 listmonk 返回结果，确认 API 版本与权限配置是否正确。',
                    listIds,
                    action,
                })
            }
        }

        await requestListmonk(config, `/api/campaigns/${currentRemoteCampaignId}/status`, {
            method: 'PUT',
            body: {
                status: 'running',
            },
        })

        return {
            remoteCampaignId: currentRemoteCampaignId,
            action,
            listIds,
        }
    } catch (error) {
        if (error instanceof ListmonkDispatchError) {
            throw error
        }

        throw new ListmonkDispatchError(
            error instanceof Error ? error.message : String(error),
            {
                code: 'REMOTE_REQUEST_FAILED',
                manualAction: '请检查 listmonk 服务连通性、列表 ID、模板 ID 与目标 Campaign 状态。',
                remoteCampaignId: currentRemoteCampaignId,
                listIds,
                action,
            },
        )
    }
}
