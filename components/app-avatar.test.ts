import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AppAvatar from './app-avatar.vue'

/**
 * `AppAvatar` 的单元契约。
 *
 * 迁移期本组件是「同一文件内按路由择库」的过渡件；迁移收口后 V1 消费者清零，已收敛为
 * 单一 caomei 实现。本文件锁住收敛后仍必须保真的三件事：
 * - **档位几何**：PrimeVue 风格档位（`normal` / `large` / `xlarge`）按 px 覆盖还原，缺省与非法值回落 32px；
 * - **属性落点**：`$attrs` 与尺寸钩子必须落在**自有包装元素**上（`CaomeiAvatar` 以 Fragment 为根，
 *   挂在它上面的 attrs 在生产构建被丢弃，见 `docs/design/governance/2026-09-25-caomei-ui-upstream-feedback.md` §2.1）；
 * - **回退文案**：无姓名时 `fallback` 保持未传，让 caomei 回退到 `alt` 首字母。
 */

const gravatarUrl = ref('')

mockNuxtImport('useAvatar', () => () => ({ avatarUrl: gravatarUrl }))

/**
 * caomei `Avatar` 的渲染契约：`src` / `fallback` / `size` / `shape`。
 *
 * 刻意**不**接收 `class` / `style`（`inheritAttrs: false`），与真实实现「Fragment 根丢弃 attrs」
 * 保持一致——否则用例会靠桩的宽容掩盖属性落点错误。
 */
const CaomeiAvatarStub = defineComponent({
    name: 'CaomeiAvatar',
    inheritAttrs: false,
    props: {
        src: { type: String, default: '' },
        alt: { type: String, default: '' },
        // 不设默认值：需要区分「传了空串」与「未传」——后者才会触发 caomei 的 `alt` 首字母回退
        fallback: { type: String, default: undefined },
        size: { type: String, default: 'md' },
        shape: { type: String, default: 'circle' },
    },
    setup(props) {
        return () => h('span', {
            class: 'caomei-avatar',
            'data-src': props.src,
            'data-alt': props.alt,
            'data-fallback': props.fallback === undefined ? '<unset>' : props.fallback,
            'data-size': props.size,
            'data-shape': props.shape,
        })
    },
})

const stubs = { CaomeiAvatar: CaomeiAvatarStub }

async function mountAvatar(props: Record<string, unknown> = {}) {
    const wrapper = await mountSuspended(AppAvatar, {
        props,
        global: { stubs },
    })
    await nextTick()

    return wrapper
}

describe('AppAvatar', () => {
    beforeEach(() => {
        gravatarUrl.value = ''
    })

    it('把图片映射到 caomei Avatar 的 src，并把姓名首字母作为 fallback', async () => {
        const wrapper = await mountAvatar({
            image: 'https://cdn.example.com/a.png',
            name: 'Ada',
            email: 'ada@example.com',
        })

        const caomei = wrapper.find('.caomei-avatar')
        expect(caomei.attributes('data-src')).toBe('https://cdn.example.com/a.png')
        expect(caomei.attributes('data-fallback')).toBe('A')
    })

    it('图片缺省时使用 composable 计算出的回退 URL（gravatar / ui-avatars）', async () => {
        gravatarUrl.value = 'https://gravatar.example.com/hash.png'

        const wrapper = await mountAvatar({ name: 'Ada', email: 'ada@example.com' })
        expect(wrapper.find('.caomei-avatar').attributes('data-src')).toBe('https://gravatar.example.com/hash.png')
    })

    it('显式图片优先于回退 URL', async () => {
        gravatarUrl.value = 'https://gravatar.example.com/hash.png'

        const wrapper = await mountAvatar({ image: 'https://cdn.example.com/a.png', name: 'Ada' })
        expect(wrapper.find('.caomei-avatar').attributes('data-src')).toBe('https://cdn.example.com/a.png')
    })

    it('档位映射（几何保真）：PrimeVue 有效档位按 px 覆盖还原，非法 / 缺省回落 32px', async () => {
        // PrimeVue `Avatar` 有效档位：normal(32) / large(48) / xlarge(64)；`small` 等非法值被忽略 → 默认 32px。
        const cases: [string | undefined, string, string][] = [
            ['normal', 'md', '32px'],
            ['large', 'lg', '48px'],
            ['xlarge', 'lg', '64px'],
            // PrimeVue 不存在的档位（实测被忽略并回落默认 2rem）→ 与 PrimeVue 行为一致
            ['small', 'md', '32px'],
            ['unknown', 'md', '32px'],
            [undefined, 'md', '32px'],
            // 已传入 caomei 档位时原样透传，边框盒取档位自身尺寸（24 / 32 / 40px）
            ['sm', 'sm', '24px'],
            ['md', 'md', '32px'],
            ['lg', 'lg', '40px'],
        ]

        for (const [input, expectedSize, expectedBox] of cases) {
            const wrapper = await mountAvatar({ name: 'Ada', size: input })
            // 边框盒由自有包装元素承载（`CaomeiAvatar` 的 Fragment 根会丢弃 attrs）
            expect(wrapper.get('.app-avatar').attributes('style')).toContain(`--app-avatar-box: ${expectedBox}`)
            expect(wrapper.find('.caomei-avatar').attributes('data-size')).toBe(expectedSize)
        }
    })

    it('形状默认取 PrimeVue 默认值 square，显式传入时透传', async () => {
        const defaultShape = await mountAvatar({ name: 'Ada' })
        expect(defaultShape.find('.caomei-avatar').attributes('data-shape')).toBe('square')

        const circle = await mountAvatar({ name: 'Ada', shape: 'circle' })
        expect(circle.find('.caomei-avatar').attributes('data-shape')).toBe('circle')
    })

    it('无姓名时不传 fallback（保持缺省），以便 caomei 回退到 alt 首字母；alt 取邮箱兜底', async () => {
        const wrapper = await mountAvatar({ email: 'ada@example.com' })

        // 传空串会关闭 caomei 的「alt 首字母」默认回退，故必须保持未传
        expect(wrapper.find('.caomei-avatar').attributes('data-fallback')).toBe('<unset>')
        expect(wrapper.find('.caomei-avatar').attributes('data-alt')).toBe('ada@example.com')
    })

    it('有姓名时显式传首字母作为 fallback（大写归一）', async () => {
        const wrapper = await mountAvatar({ name: 'ada', email: 'ada@example.com' })

        expect(wrapper.find('.caomei-avatar').attributes('data-fallback')).toBe('A')
    })

    it('消费处传入的 class 落到自有包装元素（Fragment 根的 CaomeiAvatar 会丢弃 attrs）', async () => {
        const wrapper = await mountAvatar({ name: 'Ada', class: 'avatar-preview' })

        expect(wrapper.get('.app-avatar').classes()).toContain('avatar-preview')
        // 反向断言：桩不接收 class，若属性落点回退到 `CaomeiAvatar` 上，上面一行就会失败
        expect(wrapper.get('.caomei-avatar').classes()).not.toContain('avatar-preview')
    })

    it('自有包装元素是唯一根节点，`$attrs` 与尺寸钩子不依赖隐式 fallthrough', async () => {
        const wrapper = await mountAvatar({ name: 'Ada', 'data-testid': 'avatar', loading: 'lazy' })

        const root = wrapper.element as HTMLElement
        expect(root.tagName).toBe('SPAN')
        expect(root.classList.contains('app-avatar')).toBe(true)
        expect(root.getAttribute('data-testid')).toBe('avatar')
        expect(root.getAttribute('loading')).toBe('lazy')
        expect(root.style.getPropertyValue('--app-avatar-box')).toBe('32px')
    })
})
