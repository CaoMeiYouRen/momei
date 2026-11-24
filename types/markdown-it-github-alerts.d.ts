declare module 'markdown-it-github-alerts' {
    import type MarkdownIt from 'markdown-it'

    const plugin: (md: MarkdownIt, options?: Record<string, unknown>) => void
    export default plugin
}
