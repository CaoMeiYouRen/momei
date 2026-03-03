import { defineEventHandler, getRouterParam } from 'h3'
import { getLinkByShortCode, recordClick } from '@/server/services/link'
import { LinkStatus } from '@/types/ad'

/**
 * 获取外链目标 URL（用于跳转页）
 * GET /api/goto/:code
 */
export default defineEventHandler(async (event) => {
    try {
        const shortCode = getRouterParam(event, 'code')
        if (!shortCode) {
            return {
                code: 400,
                message: 'Short code is required',
            }
        }

        const link = await getLinkByShortCode(shortCode)

        if (!link) {
            return {
                code: 404,
                message: 'Link not found',
            }
        }

        // 检查链接状态
        if (link.status === LinkStatus.BLOCKED) {
            return {
                code: 403,
                message: 'This link has been blocked',
            }
        }

        if (link.status === LinkStatus.EXPIRED) {
            return {
                code: 410,
                message: 'This link has expired',
            }
        }

        // 记录点击（异步，不阻塞响应）
        recordClick(shortCode).catch((err) => {
            console.error('Failed to record click:', err)
        })

        // 返回跳转信息
        return {
            code: 200,
            data: {
                url: link.originalUrl,
                favicon: link.metadata?.favicon || '',
                title: link.metadata?.title || '',
                showRedirectPage: link.showRedirectPage,
            },
            message: 'Success',
        }
    } catch (error: any) {
        return {
            code: 500,
            message: error.message || 'Internal server error',
        }
    }
})
