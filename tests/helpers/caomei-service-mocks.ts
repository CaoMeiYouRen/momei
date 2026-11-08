import { vi } from 'vitest'

type AnyRecord = Record<string, any>

/**
 * 测试期专用：把 caomei ToastApi 的新调用形态适配回既有断言使用的旧形态。
 *
 * 迁移后业务代码统一调用 `toast.show({ tone, title, description, duration })`；
 * 既有单测断言写的是 PrimeVue 形态（`severity` / `summary` / `detail` / `life`）。
 * 该适配只存在于 `tests/`，不进入生产代码；断言仍校验「同一条提示的语义内容」，
 * 避免为了迁移 API 而整体重写断言、丢失回归价值。
 */
export function mapToastOptions(options: AnyRecord) {
    const toneToSeverity: Record<string, string> = {
        danger: 'error',
        warning: 'warn',
        primary: 'info',
    }
    const severity = toneToSeverity[options.tone as string] ?? options.tone

    return {
        severity,
        summary: options.title,
        detail: options.description,
        life: options.duration,
    }
}

/** 旧形态 toast mock（`add` 为既有断言目标）。 */
export function createLegacyToastApi(add: (options: AnyRecord) => unknown): AnyRecord {
    const show = (content: string | AnyRecord) => {
        const options = typeof content === 'string' ? { title: content } : content
        return add(mapToastOptions(options))
    }
    const withTone = (tone: string) => (content: string | AnyRecord) => {
        const options = typeof content === 'string' ? { title: content } : content
        return show({ ...options, tone })
    }

    return {
        add,
        show,
        info: withTone('primary'),
        success: withTone('success'),
        warning: withTone('warning'),
        danger: withTone('danger'),
        dismiss: vi.fn(),
        clear: vi.fn(),
    }
}

/** 旧形态 confirm mock（`require` 为既有断言目标；`accept` / `reject` 决定 Promise 结果）。 */
export function createLegacyConfirmApi(require: (options: AnyRecord) => unknown): AnyRecord {
    const confirm = (content: string | AnyRecord) => new Promise<boolean>((resolve) => {
        const options = typeof content === 'string' ? { title: content } : content

        require({
            message: options.description ?? '',
            header: options.title ?? '',
            icon: options.tone === 'danger' ? 'warning' : 'info',
            acceptLabel: options.confirmLabel,
            rejectLabel: options.cancelLabel,
            accept: () => resolve(true),
            reject: () => resolve(false),
        })
    })

    return {
        require,
        confirm,
        open: confirm,
        cancel: vi.fn(),
    }
}
