import { flushPromises, type DOMWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { vi } from 'vitest'

/**
 * 交互后的统一等待口径：「等待可观测状态」，而不是固定 tick 数。
 *
 * 管理端用例常见形态是「点击 → 断言 mock / DOM」，而点击处理器多为 `async`：
 * 一次 `nextTick()` 只推进渲染队列，不能保证 async 处理器内部的 `await` 链已跑完。
 * 该辅助先排空微任务（`flushPromises`），再等待一次渲染 flush（`nextTick`），
 * 覆盖「处理器 await → 写响应式状态 → Vue patch」的完整链路。
 *
 * 不得用 `waitForTimeout` 之类的定时等待替代：这里等的是**可观测状态**，不是时间。
 */
export async function settleUi(): Promise<void> {
    await flushPromises()
    await nextTick()
}

/**
 * 对「异步副作用最终发生」的断言给出有界等待。
 *
 * 与测试重试（`--retry`）不同：失败仍然会让当前用例失败，只是把断言从
 * 「点击后的第一个微任务」放宽到「可观测状态在限定时间内出现」。
 * 默认 2s 上限，超时后抛出最近一次断言错误，便于定位。
 */
export async function expectEventually(
    assertion: () => void | Promise<void>,
    options: { timeout?: number, interval?: number } = {},
): Promise<void> {
    await vi.waitFor(assertion, {
        timeout: options.timeout ?? 2000,
        interval: options.interval ?? 10,
    })
}

/**
 * 先确认交互目标存在，再点击并等待状态落地。
 *
 * 避免 `wrapper.find(...)?.trigger('click')` 在元素尚未渲染时**静默跳过**点击，
 * 进而在断言处表现为「mock 0 次调用」的伪 flake（真实原因是目标缺失）。
 */
export async function clickWhenReady(
    target: DOMWrapper<Element> | undefined,
    description: string,
): Promise<void> {
    if (!target) {
        throw new Error(`交互目标不存在：${description}`)
    }

    await target.trigger('click')
    await settleUi()
}
