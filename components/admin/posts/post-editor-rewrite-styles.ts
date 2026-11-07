import { BookOpen, Building2, Compass, MessageSquare, Palette, Settings } from '@lucide/vue'
import type { Component } from 'vue'

export type PostEditorRewriteStyle = 'casual' | 'formal' | 'academic' | 'technical' | 'creative' | 'concise'

export interface PostEditorRewriteStyleOption {
    value: PostEditorRewriteStyle
    icon: Component
    /** i18n key（而非文案），由消费方用 `$t` 渲染。 */
    labelKey: string
    descKey: string
}

/**
 * 编辑器「AI 写作」的风格选择项。
 *
 * 外置原因：`post-editor-header.vue` 已越过 ESLint `max-lines` 阈值（800 行），
 * 而这段是纯数据 + i18n key，无组件状态；外置后模板与逻辑都更易读。
 */
export const POST_EDITOR_REWRITE_STYLES: readonly PostEditorRewriteStyleOption[] = [
    {
        value: 'casual',
        icon: MessageSquare,
        labelKey: 'pages.admin.posts.ai.rewrite_style_casual',
        descKey: 'pages.admin.posts.ai.rewrite_style_casual_desc',
    },
    {
        value: 'formal',
        icon: Building2,
        labelKey: 'pages.admin.posts.ai.rewrite_style_formal',
        descKey: 'pages.admin.posts.ai.rewrite_style_formal_desc',
    },
    {
        value: 'academic',
        icon: BookOpen,
        labelKey: 'pages.admin.posts.ai.rewrite_style_academic',
        descKey: 'pages.admin.posts.ai.rewrite_style_academic_desc',
    },
    {
        value: 'technical',
        icon: Settings,
        labelKey: 'pages.admin.posts.ai.rewrite_style_technical',
        descKey: 'pages.admin.posts.ai.rewrite_style_technical_desc',
    },
    {
        value: 'creative',
        icon: Palette,
        labelKey: 'pages.admin.posts.ai.rewrite_style_creative',
        descKey: 'pages.admin.posts.ai.rewrite_style_creative_desc',
    },
    {
        value: 'concise',
        icon: Compass,
        labelKey: 'pages.admin.posts.ai.rewrite_style_concise',
        descKey: 'pages.admin.posts.ai.rewrite_style_concise_desc',
    },
]
