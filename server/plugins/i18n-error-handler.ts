/**
 * 国际化错误处理插件
 * 捕获 Nitro 渲染期间发生的错误，并尝试对具有特定 messageKey 的错误进行翻译
 */
export default defineNitroPlugin(() => {
    // 占位功能：后续可用于拦截全局渲染错误
    // 目前项目主要通过 API Handler 及 Util (fail/localizedFail) 层面控制
})
