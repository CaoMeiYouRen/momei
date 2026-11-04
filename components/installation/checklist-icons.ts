import type { Component } from 'vue'
import { Bell, BookOpen, Clock, FolderOpen, Globe, IdCard, Languages, Link, Megaphone, Pencil, Send, Settings, Shield, Sparkles } from '@lucide/vue'
import type { InstallationChecklistIcon } from '@/utils/shared/installation-checklist'

/**
 * 安装清单语义键 → lucide 组件。
 *
 * 图标库依赖只留在渲染侧：`utils/shared/installation-checklist.ts` 是纯数据 / 类型模块，
 * 会被组合式函数与服务端渲染同时消费，不应引入 Vue 组件。
 */
export const INSTALLATION_CHECKLIST_ICONS: Record<InstallationChecklistIcon, Component> = {
    globe: Globe,
    clock: Clock,
    shield: Shield,
    megaphone: Megaphone,
    'id-card': IdCard,
    'folder-open': FolderOpen,
    sparkles: Sparkles,
    bell: Bell,
    book: BookOpen,
    pencil: Pencil,
    language: Languages,
    cog: Settings,
    link: Link,
    send: Send,
}
