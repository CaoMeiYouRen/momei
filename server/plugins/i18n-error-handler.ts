import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { t, getLocale } from '../utils/i18n'

/**
 * 国际化错误处理插件
 * 捕获 Nitro 渲染期间发生的错误，并尝试对具有特定 messageKey 的错误进行翻译
 * 注意：Nitro 的 onError 钩子会在渲染错误响应前触发
 */
export default defineNitroPlugin((nitroApp) => {
    // 拦截 Nitro 的响应流可能由 Nitro 内部专门处理 (详见 error.vue 渲染流程)
    // 但此处可以捕获逻辑上的未处理异常，并根据上下文补全国际化信息
    // 注意：当前版本的 Nitro API 更多是通过 middleware 与 handler 完成。

    // 如果想要深度全局处理，通常是在 H3 的原始响应生命周期拦截。
    // 在此项目中，我们优先推荐在 API Handler 及 Util (fail/localizedFail) 层面控制。
})
