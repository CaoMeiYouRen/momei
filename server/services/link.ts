import { randomBytes } from 'crypto'
import { In } from 'typeorm'
import { dataSource } from '@/server/database'
import { ExternalLink } from '@/server/entities/external-link'
import { LinkStatus, type ExternalLinkMetadata } from '@/types/ad'

/**
 * 外链管理服务
 * 提供短链生成、跳转追踪和安全过滤功能
 *
 * @author Claude Code
 * @date 2026-03-03
 */

/**
 * 生成随机短码
 * @param length 短码长度，默认 6
 */
export function generateShortCode(length: number = 6): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const bytes = randomBytes(length)
    let result = ''
    for (let i = 0; i < length; i++) {
        const byte = bytes[i]
        if (byte !== undefined) {
            result += chars[byte % chars.length]
        }
    }
    return result
}

/**
 * 生成唯一的短码
 * @param maxRetries 最大重试次数
 */
export async function generateUniqueShortCode(maxRetries: number = 10): Promise<string> {
    const linkRepo = dataSource.getRepository(ExternalLink)

    for (let i = 0; i < maxRetries; i++) {
        const code = generateShortCode()
        const existing = await linkRepo.findOne({ where: { shortCode: code } })
        if (!existing) {
            return code
        }
    }

    // 如果随机生成失败，使用更长的短码
    return generateShortCode(8)
}

/**
 * 验证 URL 是否有效
 */
export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * 检查 URL 是否在黑名单中
 */
export function isBlacklistedUrl(url: string, blacklist: string[] = []): boolean {
    try {
        const parsed = new URL(url)
        const hostname = parsed.hostname.toLowerCase()

        return blacklist.some((blacklisted) => {
            const blacklistedDomain = blacklisted.toLowerCase()
            return hostname === blacklistedDomain || hostname.endsWith(`.${blacklistedDomain}`)
        })
    } catch {
        return true
    }
}

/**
 * 提取网站 favicon URL
 */
export function extractFaviconUrl(url: string): string {
    try {
        const parsed = new URL(url)
        return `${parsed.protocol}//${parsed.hostname}/favicon.ico`
    } catch {
        return ''
    }
}

/**
 * 获取所有外链
 */
export async function getAllLinks(): Promise<ExternalLink[]> {
    const linkRepo = dataSource.getRepository(ExternalLink)
    return linkRepo.find({
        relations: ['createdBy'],
        order: {
            createdAt: 'DESC',
        },
    })
}

/**
 * 根据 ID 获取外链
 */
export async function getLinkById(id: string): Promise<ExternalLink | null> {
    const linkRepo = dataSource.getRepository(ExternalLink)
    return linkRepo.findOne({
        where: { id },
        relations: ['createdBy'],
    })
}

/**
 * 根据短码获取外链
 */
export async function getLinkByShortCode(shortCode: string): Promise<ExternalLink | null> {
    const linkRepo = dataSource.getRepository(ExternalLink)
    return linkRepo.findOne({
        where: { shortCode },
    })
}

/**
 * 创建外链
 */
export async function createLink(data: {
    originalUrl: string
    createdById: string
    noFollow?: boolean
    showRedirectPage?: boolean
    metadata?: ExternalLinkMetadata
}): Promise<ExternalLink> {
    // 验证 URL
    if (!isValidUrl(data.originalUrl)) {
        throw new Error('Invalid URL')
    }

    // 检查黑名单（可选）
    // const blacklist = ['spam.com', 'malicious.site']
    // if (isBlacklistedUrl(data.originalUrl, blacklist)) {
    //     throw new Error('URL is blacklisted')
    // }

    const linkRepo = dataSource.getRepository(ExternalLink)

    // 生成唯一短码
    const shortCode = await generateUniqueShortCode()

    // 自动提取 favicon（如果没有提供）
    const metadata = data.metadata
    if (metadata && !metadata.favicon) {
        metadata.favicon = extractFaviconUrl(data.originalUrl)
    }

    const link = linkRepo.create({
        ...data,
        shortCode,
        status: LinkStatus.ACTIVE,
        metadata,
    })

    return linkRepo.save(link)
}

/**
 * 更新外链
 */
export async function updateLink(id: string, data: Partial<ExternalLink>): Promise<ExternalLink | null> {
    const linkRepo = dataSource.getRepository(ExternalLink)

    // 如果更新 URL，需要重新验证
    if (data.originalUrl && !isValidUrl(data.originalUrl)) {
        throw new Error('Invalid URL')
    }

    // 只更新基本字段，不包含关系
    const { createdBy, ...updateData } = data as any
    await linkRepo.update(id, updateData)
    return getLinkById(id)
}

/**
 * 删除外链
 */
export async function deleteLink(id: string): Promise<boolean> {
    const linkRepo = dataSource.getRepository(ExternalLink)
    const result = await linkRepo.delete(id)
    return result.affected ? result.affected > 0 : false
}

/**
 * 更新外链状态
 */
export async function updateLinkStatus(id: string, status: LinkStatus): Promise<ExternalLink | null> {
    return updateLink(id, { status })
}

/**
 * 批量更新外链状态
 */
export async function updateLinkStatusBulk(ids: string[], status: LinkStatus): Promise<void> {
    const linkRepo = dataSource.getRepository(ExternalLink)
    await linkRepo.update({ id: In(ids) }, { status })
}

/**
 * 记录点击
 */
export async function recordClick(shortCode: string): Promise<ExternalLink | null> {
    const linkRepo = dataSource.getRepository(ExternalLink)
    await linkRepo.increment({ shortCode }, 'clickCount', 1)
    return getLinkByShortCode(shortCode)
}

/**
 * 获取外链统计信息
 */
export async function getLinkStats(id: string) {
    const link = await getLinkById(id)
    if (!link) {
        return null
    }

    return {
        id: link.id,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        clickCount: link.clickCount,
        status: link.status,
        createdAt: link.createdAt,
    }
}
