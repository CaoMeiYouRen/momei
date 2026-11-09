import { defineNuxtModule } from 'nuxt/kit'

/**
 * 需要从自动导入中移除的 caomei-ui 同名条目。
 *
 * PrimeVue 卸载后仅剩 `useTheme`：它与 momei 自身的 `composables/use-theme.ts` 同名，
 * 两套同名自动导入共存时 caomei-ui 版本会静默胜出（Nuxt 仅给出 `Duplicated imports` 警告），
 * 使依赖自动导入的既有页面在运行时切到不同 API。`useToast` / `useConfirm` 已无同名冲突，
 * 保留 caomei-ui 的自动导入。
 */
export const CONFLICTING_AUTO_IMPORT_NAMES = ['useTheme'] as const

/** 自动导入条目的最小结构（unimport Import 的子集）。 */
export interface AutoImportEntry {
    from?: string
    name?: string
}

/**
 * 就地移除来自 caomei-ui 的冲突自动导入条目。
 *
 * 抽为纯函数以便单测；返回移除数量，供调用方判断隔离是否真的生效。
 *
 * @param imports 待过滤的自动导入数组（原地修改）。
 * @param conflictingNames 需要移除的名字集合，默认取 {@link CONFLICTING_AUTO_IMPORT_NAMES}。
 * @returns 实际移除的条目数。
 */
export function filterConflictingImports(
    imports: AutoImportEntry[],
    conflictingNames: ReadonlySet<string> = new Set<string>(CONFLICTING_AUTO_IMPORT_NAMES),
): number {
    let removed = 0

    for (let index = imports.length - 1; index >= 0; index -= 1) {
        const entry = imports[index]

        if (entry?.from === 'caomei-ui' && entry.name !== undefined && conflictingNames.has(entry.name)) {
            imports.splice(index, 1)
            removed += 1
        }
    }

    return removed
}

/**
 * caomei-ui 自动导入隔离模块。
 *
 * 职责：把 caomei-ui 的 `useTheme` 从 Nuxt 的自动导入清单中移除，
 * 保留其不冲突的 `useToast` / `useConfirm` / `useLocale` / `provideLocale`。
 *
 * **注册顺序是本模块的硬前提**：caomei-ui 通过依赖模块的 `addImports()` 注册
 * `imports:extend` 钩子，Nuxt 按注册顺序依次调用同名钩子。本模块必须在该钩子之后执行，
 * 否则拿到的是「caomei-ui 尚未推入」的数组，过滤会静默失效。
 * 本模块位于 `modules/` 目录，由 Nuxt 在 `nuxt.config` 的 `modules` 之后自动加载，
 * 因此顺序成立；`build:before` 护栏会在顺序被破坏时直接失败，而不是静默放过。
 *
 * `useTheme` 同名冲突与 PrimeVue 无关，卸载后仍需要本隔离。
 * 背景见 `docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md` 的
 * 「双库并存隔离」一节。
 */
export default defineNuxtModule({
    meta: {
        name: 'momei-caomei-ui-coexistence',
    },
    setup(_options, nuxt) {
        let removalObserved = false

        nuxt.hook('imports:extend', (imports) => {
            if (filterConflictingImports(imports) > 0) {
                removalObserved = true
            }
        })

        nuxt.hook('build:before', () => {
            if (!removalObserved) {
                throw new Error(
                    '[momei-caomei-ui-coexistence] 未检测到 caomei-ui 的冲突自动导入，隔离未生效。'
                    + '请确认本模块在 caomei-ui/nuxt 之后注册（modules/ 目录的模块应晚于 nuxt.config 的 modules 加载）；'
                    + '若为迁移收尾阶段（caomei-ui 已卸载），应同时删除本模块。',
                )
            }
        })
    },
})
