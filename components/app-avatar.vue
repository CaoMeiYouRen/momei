<template>
    <CaomeiAvatar
        v-bind="$attrs"
        :src="displayImage"
        :alt="altText"
        :fallback="fallbackText"
        :size="avatarSize.size"
        :style="avatarSize.style"
        :shape="shape"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 统一头像（caomei-ui）。迁移期曾以 `AppAvatarV2` + 路由择库形式并存；B4-B 收口后 V1 消费者清零，
 * 收敛为单一实现（原 `-v2` 后缀已去除）。
 *
 * 与已删除的 V1（PrimeVue `Avatar`）的差异（均为有意，见迁移方案 §6.2 与上游反馈 §2.1）：
 * - **尺寸档位映射（边框盒尺寸保真）**：PrimeVue 有效档位为 `normal`(32px) / `large`(48px) / `xlarge`(64px)，
 *   caomei 为 `sm`(24) / `md`(32) / `lg`(40)。`normal` 映射到 `md`（同尺寸）；`large` / `xlarge`
 *   无对应档位，按上游 §2.1 的口径在 `lg` 之上用 `--caomei-avatar-size` 覆盖回 48 / 64px。
 *   缺省与非法档位一律回落 `md`（32px）。
 * - **回退文案**：caomei 由 `fallback` 承载首字母；无姓名时传 `undefined` 以回退到 `alt` 首字母。
 * - **`alt` 可访问名**：以「姓名 → 邮箱」补 `alt`。
 */
const props = withDefaults(defineProps<{
    image?: string | null
    email?: string | null
    emailHash?: string | null
    name?: string | null
    /** 档位：caomei 档位（`sm` / `md` / `lg`）或 PrimeVue 风格档位（`normal` / `large` / `xlarge`，含历史遗留的非法值 `small`）。 */
    size?: string | null
    /** 形状；默认取 PrimeVue 的默认值 `square`，使两版缺省表现一致。 */
    shape?: 'circle' | 'square'
}>(), {
    // PrimeVue `Avatar` 的 `shape` 默认值为 `square`；caomei 默认为 `circle`。
    // 在组件内显式补齐，避免「消费处不传 shape」时与迁移前表现分叉。
    shape: 'square',
})

// 属性透传显式化（见模板注释）：不依赖 Vue 对组件根的隐式 fallthrough。
defineOptions({ inheritAttrs: false })

const { avatarUrl } = useAvatar(() => props.email, () => props.name, () => props.emailHash)

const displayImage = computed(() => props.image || avatarUrl.value)
const altText = computed(() => props.name || props.email || '')
// 无姓名时返回 `undefined`（而非空串）：caomei 在 `fallback` 缺省时会回退到 `alt` 首字母，
// 传空串会关闭该默认能力。
const fallbackText = computed(() => props.name?.charAt(0)?.toUpperCase() || undefined)

const CAOMEI_AVATAR_SIZES = new Set(['sm', 'md', 'lg'])

type CaomeiAvatarSize = 'sm' | 'md' | 'lg'

/**
 * PrimeVue 档位 → caomei 档位 + 尺寸覆盖。
 *
 * PrimeVue `Avatar` 的**有效**档位只有 `normal`（默认 `2rem` = 32px）/ `large`（`3rem` = 48px）/
 * `xlarge`（`4rem` = 64px）；`small` 等非法值会被忽略并回落默认 `2rem`（实测：`size="small"` 与
 * `size="normal"` 渲染出完全相同的类名）。
 *
 * caomei 档位为 `sm`(24) / `md`(32) / `lg`(40)，因此 `large` / `xlarge` **没有对应档位**，
 * 必须按上游反馈 §2.1 的口径用 `--caomei-avatar-size` 覆盖；否则头像会从 48 / 64px 缩到 40px，
 * 属未登记的几何回归（`settings/profile` 的 `xlarge` 即为此类）。
 */
const PRIMEVUE_AVATAR_SIZE_MAP: Record<string, { size: CaomeiAvatarSize, px: string }> = {
    normal: { size: 'md', px: '32px' },
    large: { size: 'lg', px: '48px' },
    xlarge: { size: 'lg', px: '64px' },
}

/**
 * 解析档位：caomei 档位原样透传；PrimeVue 档位按映射表（含尺寸覆盖）；
 * **缺省与非法值一律回落 `md`（32px）**，与 PrimeVue「忽略非法档位」的行为一致。
 */
function resolveAvatarSize(size?: string | null): { size: CaomeiAvatarSize, style?: Record<string, string> } {
    if (size && CAOMEI_AVATAR_SIZES.has(size)) {
        return { size: size as CaomeiAvatarSize }
    }

    const mapped = PRIMEVUE_AVATAR_SIZE_MAP[size ?? ''] ?? { size: 'md' as CaomeiAvatarSize, px: '32px' }

    // 覆盖 token 走内联样式：caomei 的档位选择器用 `:where()` 归零特异性，内联变量可稳定压过它。
    return { size: mapped.size, style: { '--caomei-avatar-size': mapped.px } }
}

const avatarSize = computed(() => resolveAvatarSize(props.size))
</script>
