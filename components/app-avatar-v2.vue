<template>
    <!--
      过渡组件：同一文件内按路由择库。
      - 已迁移路由（`lib/ui-library.ts` 登记）：渲染 caomei-ui `Avatar`；
      - 未迁移路由（含公开页 `comment-item` / `posts/[id]` 与 `settings-profile`）：回退到 V1，
        避免公开页头像被被动改变。
      属性透传用**显式** `v-bind="$attrs"`（配合 `inheritAttrs: false`）：不依赖 Vue 对
      「组件根」的隐式 fallthrough——该机制在当前实现下确实生效（`CaomeiAvatar` 的根是
      「注释节点 + 单一元素」的 fragment，Vue 会跳过注释并把唯一非注释子节点当作根），
      但一旦有人在分支里新增同级根节点，隐式透传会静默失效（`class` / `loading` / `decoding`
      是公开页消费方的实际依赖）。
    -->
    <CaomeiAvatar
        v-if="prefersCaomeiUi"
        v-bind="$attrs"
        :src="displayImage"
        :alt="altText"
        :fallback="fallbackText"
        :size="caomeiSize"
        :shape="shape"
    />
    <AppAvatar
        v-else
        v-bind="$attrs"
        :image="image"
        :email="email"
        :email-hash="emailHash"
        :name="name"
        :size="size"
        :shape="shape"
    />
</template>

<script setup lang="ts">
import AppAvatar from './app-avatar.vue'
import { resolveUiLibraryForRoutePath } from '@/lib/ui-library'

/**
 * 过渡用「统一头像（caomei-ui 版）」。
 *
 * 背景：`AppAvatar` 是跨路由共享组件，消费者横跨 B2 目标路由（`users` / `subscribers`，**本批只交付过渡壳，
 * 页面替换是各自路由批次的原子步骤**）与公开页 / 设置页（`comment-item` / `pages/posts/[id]`、`settings/profile`）。若直接改写 `AppAvatar`，
 * 公开页头像会被被动改变。故并存期新增本过渡组件，**内部按路由择库**（`lib/ui-library.ts` 为单一事实源）：
 * 未迁移路由回退到 V1，因此本组件可在任意路由安全采用；待全站迁完后再删除 V1 分支。
 *
 * 与 V1 的差异（均为有意，见迁移方案 §6.2 与上游反馈清单 §2.1）：
 * - **尺寸档位映射**：PrimeVue 为 `normal` / `large` / `xlarge`，caomei 为 `md` / `lg`（`sm` / `md` / `lg`）。
 *   `xlarge` 在 caomei 侧无对应档位，按上游 §2.1 的有损映射落到 `lg`；需要更大尺寸时应由消费处覆盖
 *   `--caomei-avatar-size`。已传入 caomei 档位时原样透传。
 * - **回退文案**：PrimeVue 由 `label` 承载首字母，caomei 由 `fallback` 承载；此处显式传入首字母，
 *   使两版回退内容一致（无姓名时传 `undefined` 而非空串，以便 caomei 回退到 `alt` 首字母）。
 * - **补 `alt` 可访问名**：V1 未设置 `alt`（PrimeVue 默认 `avatar`）；此处以「姓名 → 邮箱」补 `alt`，
 *   使图片模式下的 `img alt` 与回退内容的可访问名具备语义（可访问性改进，非视觉差异）。
 */
const props = withDefaults(defineProps<{
    image?: string | null
    email?: string | null
    emailHash?: string | null
    name?: string | null
    /** PrimeVue 档位（`small` / `normal` / `large` / `xlarge`）或 caomei 档位（`sm` / `md` / `lg`）。 */
    size?: string | null
    /** 形状；默认取 PrimeVue 的默认值 `square`，使两版缺省表现一致。 */
    shape?: 'circle' | 'square'
}>(), {
    // PrimeVue `Avatar` 的 `shape` 默认值为 `square`；caomei 默认为 `circle`。
    // 在过渡组件内显式补齐，避免「消费处不传 shape」时两分支表现分叉。
    shape: 'square',
})

// 属性透传显式化（见模板注释）：不依赖 Vue 对组件根的隐式 fallthrough。
defineOptions({ inheritAttrs: false })

const route = useRoute()
const prefersCaomeiUi = computed(() => resolveUiLibraryForRoutePath(route.path) === 'caomei-ui')

const { avatarUrl } = useAvatar(() => props.email, () => props.name, () => props.emailHash)

const displayImage = computed(() => props.image || avatarUrl.value)
const altText = computed(() => props.name || props.email || '')
// 无姓名时返回 `undefined`（而非空串）：caomei 在 `fallback` 缺省时会回退到 `alt` 首字母，
// 传空串会关闭该默认能力。
const fallbackText = computed(() => props.name?.charAt(0)?.toUpperCase() || undefined)

const CAOMEI_AVATAR_SIZES = new Set(['sm', 'md', 'lg'])

function toCaomeiAvatarSize(size?: string | null): 'sm' | 'md' | 'lg' {
    if (size && CAOMEI_AVATAR_SIZES.has(size)) {
        return size as 'sm' | 'md' | 'lg'
    }

    switch (size) {
        case 'small':
            return 'sm'
        case 'large':
        case 'xlarge':
            return 'lg'
        case 'normal':
        default:
            return 'md'
    }
}

const caomeiSize = computed(() => toCaomeiAvatarSize(props.size))
</script>
