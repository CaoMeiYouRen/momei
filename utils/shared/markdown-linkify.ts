import type { MarkdownIt } from 'markdown-it'

/**
 * markdown-it 15 升级到 linkify-it 6 后的链接识别默认值补偿。
 *
 * linkify-it 6 把 `fuzzyLink` / `urlAuth` 默认值改为关闭（v5 中 fuzzyLink 默认开启、
 * 且没有 urlAuth 选项而是默认允许 auth 段），会让裸域名与带认证信息的 URL 不再自动链接。
 * 本仓所有渲染器（共享渲染器与 4 处服务端直连实例）都启用了 `linkify`，必须统一调用本函数，
 * 保证同一段正文在文章页、Feed、ActivityPub 与营销邮件中的输出一致。将来若新增
 * `linkify: false` 的实例则无需调用；开启 `linkify` 的裸 `MarkdownIt` 实例必须调用。
 */
export function applyMarkdownLinkifyCompatibility(md: MarkdownIt): void {
    md.linkify.set({ fuzzyLink: true, urlAuth: true })
}
