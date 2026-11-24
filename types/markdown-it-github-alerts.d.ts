declare module 'markdown-it-github-alerts' {
    import type MarkdownIt from 'markdown-it'

    // 上游包未随发布产物提供可被当前 TS 工程解析的类型声明；项目内只使用无参数形态，
    // 因此按实际调用面声明为单参数插件，避免用宽松的 options 签名遮蔽上游选项语义。
    const plugin: (md: MarkdownIt) => void
    export default plugin
}
