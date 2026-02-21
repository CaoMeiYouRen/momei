import { success, localizedFail } from '../utils/response'
import { t } from '../utils/i18n'

/**
 * 国际化测试接口 (I18n Test API)
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const mode = query.mode as string

    if (mode === 'error') {
        // 测试异步国际化失败响应
        return await localizedFail('error.unauthorized', 401)
    }

    if (mode === 'params') {
        // 测试带参数的国际化响应 (例如: 'Resource not found: User')
        return await localizedFail('error.notFound', 404, { resource: 'TestingUser' })
    }

    // 默认测试正常翻译
    const welcome = await t('app.description')
    const locale = event.context.locale // 从中间件获取的

    return success({
        hello: welcome,
        currentLocale: locale,
        timestamp: new Date().toISOString(),
    })
})
