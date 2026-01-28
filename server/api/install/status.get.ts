import { getInstallationStatus } from '~/server/services/installation'

/**
 * 获取安装状态
 * GET /api/install/status
 */
export default defineEventHandler(async () => {
    const status = await getInstallationStatus()

    return {
        code: 200,
        message: 'Success',
        data: status,
    }
})
