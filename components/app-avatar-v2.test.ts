import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import AppAvatarV2 from './app-avatar-v2.vue'

/**
 * 过渡组件 `AppAvatarV2` 的单元契约。
 *
 * 重点：本组件是「同一文件内按路由择库」的过渡件——已迁移路由渲染 caomei-ui `Avatar`，
 * 未迁移路由必须回退到 V1，否则公开页（`comment-item` / `pages/posts/[id]`）与 `settings/profile`
 * 的头像会被被动改变。因此两条分支都要覆盖，且档位映射（PrimeVue → caomei）必须有损口径明确。
 */

// 样本路由说明：`/admin/submissions` 属本迁移程序已登记前缀；`/posts/hello` 为公开页（不随 admin 批次迁移）。
const routeState = reactive({ path: '/admin/submissions' })
const gravatarUrl = ref('')

mockNuxtImport('useRoute', () => () => routeState)
mockNuxtImport('useAvatar', () => () => ({ avatarUrl: gravatarUrl }))

/** caomei `Avatar` 的渲染契约：`src` / `fallback` / `size` / `shape`。 */
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
    setup(props, { attrs }) {
        return () => h('span', {
            class: ['caomei-avatar', ...(attrs.class ? [attrs.class as string] : [])],
            'data-src': props.src,
            'data-alt': props.alt,
            'data-fallback': props.fallback === undefined ? '<unset>' : props.fallback,
            'data-size': props.size,
            'data-shape': props.shape,
        })
    },
})

/** PrimeVue `Avatar`（V1 分支的落点）契约：`image` / `label`。 */
const AvatarStub = defineComponent({
    name: 'Avatar',
    inheritAttrs: false,
    props: {
        image: { type: String, default: '' },
        label: { type: String, default: '' },
    },
    setup(props, { attrs }) {
        // `size` / `shape` 由 V1 经 `$attrs` 透传下来（V1 未声明这两个 prop），
        // 故从 attrs 取，而不是声明成 prop——否则测不出「透传丢失」。
        return () => h('span', {
            class: ['p-avatar', ...(attrs.class ? [attrs.class as string] : [])],
            'data-image': props.image,
            'data-label': props.label,
            'data-size': typeof attrs.size === 'string' ? attrs.size : '',
            'data-shape': typeof attrs.shape === 'string' ? attrs.shape : '',
        })
    },
})

const stubs = { CaomeiAvatar: CaomeiAvatarStub, Avatar: AvatarStub }

async function mountAvatar(props: Record<string, unknown> = {}) {
    const wrapper = await mountSuspended(AppAvatarV2, {
        props,
        global: { stubs },
    })
    await nextTick()

    return wrapper
}

describe('AppAvatarV2', () => {
    beforeEach(() => {
        routeState.path = '/admin/submissions'
        gravatarUrl.value = ''
    })

    it('未迁移路由回退到 V1（PrimeVue Avatar），不渲染 caomei 头像', async () => {
        routeState.path = '/posts/hello'
        const wrapper = await mountAvatar({ image: 'https://cdn.example.com/a.png', name: 'Ada' })

        expect(wrapper.find('.caomei-avatar').exists()).toBe(false)
        const prime = wrapper.find('.p-avatar')
        expect(prime.exists()).toBe(true)
        expect(prime.attributes('data-image')).toBe('https://cdn.example.com/a.png')
        // V1 的 `label` 语义：图片缺省时取姓名首字母
        expect(prime.attributes('data-label')).toBe('')
    })

    it('已迁移路由渲染 caomei Avatar，并把图片映射到 src', async () => {
        const wrapper = await mountAvatar({
            image: 'https://cdn.example.com/a.png',
            name: 'Ada',
            email: 'ada@example.com',
        })

        expect(wrapper.find('.p-avatar').exists()).toBe(false)
        const caomei = wrapper.find('.caomei-avatar')
        expect(caomei.attributes('data-src')).toBe('https://cdn.example.com/a.png')
        expect(caomei.attributes('data-fallback')).toBe('A')
    })

    it('图片缺省时两分支都使用同一回退 URL（gravatar / ui-avatars 计算集中在 V1 与 V2 共用的 composable）', async () => {
        gravatarUrl.value = 'https://gravatar.example.com/hash.png'

        const migrated = await mountAvatar({ name: 'Ada', email: 'ada@example.com' })
        expect(migrated.find('.caomei-avatar').attributes('data-src')).toBe('https://gravatar.example.com/hash.png')

        routeState.path = '/posts/hello'
        const legacy = await mountAvatar({ name: 'Ada', email: 'ada@example.com' })
        expect(legacy.find('.p-avatar').attributes('data-image')).toBe('https://gravatar.example.com/hash.png')
    })

    it('档位映射：PrimeVue 档位 → caomei 档位（xlarge 有损落到 lg）', async () => {
        const cases: [string | undefined, string][] = [
            ['small', 'sm'],
            ['normal', 'md'],
            ['large', 'lg'],
            ['xlarge', 'lg'],
            // 已传入 caomei 档位时原样透传
            ['sm', 'sm'],
            ['md', 'md'],
            ['lg', 'lg'],
            // 缺省与未知值取 caomei 默认档位
            [undefined, 'md'],
            ['unknown', 'md'],
        ]

        for (const [input, expected] of cases) {
            const wrapper = await mountAvatar({ name: 'Ada', size: input })
            expect(wrapper.find('.caomei-avatar').attributes('data-size')).toBe(expected)
        }
    })

    it('形状默认取 PrimeVue 默认值 square，显式传入时透传', async () => {
        const defaultShape = await mountAvatar({ name: 'Ada' })
        expect(defaultShape.find('.caomei-avatar').attributes('data-shape')).toBe('square')

        const circle = await mountAvatar({ name: 'Ada', shape: 'circle' })
        expect(circle.find('.caomei-avatar').attributes('data-shape')).toBe('circle')
    })

    it('未迁移路由把 size / shape 透传给 V1（否则共享壳会丢档位）', async () => {
        routeState.path = '/posts/hello'
        const wrapper = await mountAvatar({ name: 'Ada', size: 'xlarge', shape: 'circle' })

        // V1 通过 `$attrs` 把未声明 props 继续透传给 PrimeVue Avatar（缺一则共享壳会丢档位）
        const prime = wrapper.find('.p-avatar')
        expect(prime.exists()).toBe(true)
        expect(prime.attributes('data-size')).toBe('xlarge')
        expect(prime.attributes('data-shape')).toBe('circle')
    })

    it('无姓名时不传 fallback（保持缺省），以便 caomei 回退到 alt 首字母；alt 取邮箱兜底', async () => {
        const wrapper = await mountAvatar({ email: 'ada@example.com' })

        // 传空串会关闭 caomei 的「alt 首字母」默认回退，故必须保持未传
        expect(wrapper.find('.caomei-avatar').attributes('data-fallback')).toBe('<unset>')
        expect(wrapper.find('.caomei-avatar').attributes('data-alt')).toBe('ada@example.com')
    })

    it('有姓名时显式传首字母作为 fallback', async () => {
        const wrapper = await mountAvatar({ name: 'ada', email: 'ada@example.com' })

        expect(wrapper.find('.caomei-avatar').attributes('data-fallback')).toBe('A')
    })

    it('消费处传入的 class 落到渲染出的根元素（两分支一致）', async () => {
        const migrated = await mountAvatar({ name: 'Ada', class: 'avatar-preview' })
        expect(migrated.find('.caomei-avatar').classes()).toContain('avatar-preview')

        routeState.path = '/posts/hello'
        const legacy = await mountAvatar({ name: 'Ada', class: 'avatar-preview' })
        expect(legacy.find('.p-avatar').classes()).toContain('avatar-preview')
    })

    it('路由切换时按新路由择库（同一实例内响应式切换）', async () => {
        const wrapper = await mountAvatar({ name: 'Ada' })
        expect(wrapper.find('.caomei-avatar').exists()).toBe(true)

        routeState.path = '/posts/hello'
        await nextTick()
        expect(wrapper.find('.p-avatar').exists()).toBe(true)

        routeState.path = '/admin/submissions'
        await nextTick()
        expect(wrapper.find('.caomei-avatar').exists()).toBe(true)
    })

    it('locale 前缀路由同样按业务路径择库', async () => {
        routeState.path = '/en-US/admin/submissions'
        const wrapper = await mountAvatar({ name: 'Ada' })

        expect(wrapper.find('.caomei-avatar').exists()).toBe(true)
    })

    it('未在册路由（如公开页）即使带 locale 前缀也回退到 V1', async () => {
        routeState.path = '/en-US/posts/hello'
        const wrapper = await mountAvatar({ name: 'Ada' })

        expect(wrapper.find('.p-avatar').exists()).toBe(true)
        expect(wrapper.find('.caomei-avatar').exists()).toBe(false)
    })
})
