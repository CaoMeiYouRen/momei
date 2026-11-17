<template>
    <span
        v-bind="$attrs"
        class="app-avatar"
        :style="avatarSize.style"
    >
        <CaomeiAvatar
            :src="displayImage"
            :alt="altText"
            :fallback="fallbackText"
            :size="avatarSize.size"
            :shape="shape"
        />
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 统一头像（caomei-ui）。迁移期曾以 `AppAvatarV2` + 路由择库形式并存；迁移收口后 V1 消费者清零，
 * 收敛为单一实现（原 `-v2` 后缀已去除）。
 *
 * 与已删除的 V1（PrimeVue `Avatar`）的差异（均为有意，见迁移方案 §6.2 与上游反馈 §2.1）：
 * - **尺寸档位映射（边框盒尺寸保真）**：PrimeVue 有效档位为 `normal`(32px) / `large`(48px) / `xlarge`(64px)，
 *   caomei 为 `sm`(24) / `md`(32) / `lg`(40)。`normal` 映射到 `md`（同尺寸）；`large` / `xlarge`
 *   无对应档位，按上游 §2.1 的口径在 `lg` 之上把边框盒覆盖回 48 / 64px。
 *   缺省与非法档位一律回落 `md`（32px）。
 * - **回退文案**：caomei 由 `fallback` 承载首字母；无姓名时传 `undefined` 以回退到 `alt` 首字母。
 * - **`alt` 可访问名**：以「姓名 → 邮箱」补 `alt`。
 *
 * ## 自有包装元素（几何与属性透传的唯一落点）
 *
 * `caomei-ui` 的 `CaomeiAvatar` 以 **Fragment 为根**（注释节点 + `AvatarRoot`），组件 attrs 无法落到
 * `AvatarRoot`：Vue 对 Fragment 根既不隐式透传、也不报错，生产构建直接丢弃。历史实现把 `$attrs`
 * 与内联 `--caomei-avatar-size` 挂在 `CaomeiAvatar` 上，结果：
 *
 * - `settings/profile` 的 `xlarge` 实际渲染 40px（应为 64px），`large` 同理缩到 40px；
 * - 消费处的 `class`（`comment-item__avatar-img` / `avatar-preview`）全部失效。
 *
 * 因此尺寸与属性由**本组件自持的包装元素**承载：
 * - `$attrs`（含消费处 `class`）落在包装元素上；
 * - 边框盒尺寸经 `--app-avatar-box` 内联钩子写在包装元素上，内层 `CaomeiAvatar` 按 100% 填满，
 *   使「盒尺寸」只有一个事实源（见 `<style>` 注释的低特异性约定）。
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

// 属性透传显式化：`$attrs` 落到自有包装元素（Fragment 根的 `CaomeiAvatar` 会丢弃 attrs）。
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
 * PrimeVue 档位 → caomei 档位 + 边框盒尺寸。
 *
 * PrimeVue `Avatar` 的**有效**档位只有 `normal`（默认 `2rem` = 32px）/ `large`（`3rem` = 48px）/
 * `xlarge`（`4rem` = 64px）；`small` 等非法值会被忽略并回落默认 `2rem`（实测：`size="small"` 与
 * `size="normal"` 渲染出完全相同的类名）。
 *
 * caomei 档位为 `sm`(24) / `md`(32) / `lg`(40)，因此 `large` / `xlarge` **没有对应档位**，必须按
 * 上游反馈 §2.1 的口径把边框盒覆盖回 48 / 64px；否则头像会从 48 / 64px 缩到 40px，属未登记的
 * 几何回归（`settings/profile` 的 `xlarge` 即为此类）。
 */
const PRIMEVUE_AVATAR_SIZE_MAP: Record<string, { size: CaomeiAvatarSize, box: string }> = {
    normal: { size: 'md', box: '32px' },
    large: { size: 'lg', box: '48px' },
    xlarge: { size: 'lg', box: '64px' },
}

/** 缺省与非法档位的回落值（PrimeVue 默认 `2rem`）。 */
const DEFAULT_PRIMEVUE_AVATAR_SIZE = { size: 'md' as CaomeiAvatarSize, box: '32px' }

/** caomei 档位自身的边框盒尺寸（与 caomei `:where(.caomei-avatar--*)` 的取值一致）。 */
const CAOMEI_AVATAR_BOX_MAP: Record<CaomeiAvatarSize, string> = {
    sm: '24px',
    md: '32px',
    lg: '40px',
}

/**
 * 解析档位：caomei 档位原样透传；PrimeVue 档位按映射表（含尺寸覆盖）；
 * **缺省与非法值一律回落 `md`（32px）**，与 PrimeVue「忽略非法档位」的行为一致。
 */
function resolveAvatarSize(size?: string | null): { size: CaomeiAvatarSize, style: Record<string, string> } {
    if (size && CAOMEI_AVATAR_SIZES.has(size)) {
        const caomeiSize = size as CaomeiAvatarSize
        return { size: caomeiSize, style: { '--app-avatar-box': CAOMEI_AVATAR_BOX_MAP[caomeiSize] } }
    }

    const mapped = PRIMEVUE_AVATAR_SIZE_MAP[size ?? ''] ?? DEFAULT_PRIMEVUE_AVATAR_SIZE

    // 覆盖钩子走包装元素的内联自定义属性：`CaomeiAvatar` 的档位选择器用 `:where()` 归零特异性，
    // 但其声明落在 `.caomei-avatar` **自身**，祖辈继承值会被同元素声明压过，故不能只靠继承。
    return { size: mapped.size, style: { '--app-avatar-box': mapped.box } }
}

const avatarSize = computed(() => resolveAvatarSize(props.size))
</script>

<style lang="scss">
/**
 * 包装元素样式（非 scoped，与 `app-search` / `language-switcher` 等既有全局块一致）：
 *
 * - **尺寸走低特异性单类**：`.app-avatar` 的 `width` / `height` 取 `--app-avatar-box`（组件内联写入），
 *   特异性为单个类，消费处传入的 `class`（如评论头像的 `3rem` / `2rem`）可正常覆盖。若改用 scoped
 *   （`.app-avatar[data-v-*]`）会与消费处同为两段特异性，只能靠样式注入顺序决胜。
 * - **内层填满**：`.caomei-avatar` 的 `width` / `height` 来自其自身
 *   `.caomei-avatar[data-v-*] { width: var(--caomei-avatar-size, 32px) }`（两段特异性），故此处用
 *   双类提升到三段，稳定压过它而不依赖注入顺序。
 */
.app-avatar {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--app-avatar-box, 32px);
    height: var(--app-avatar-box, 32px);
    vertical-align: middle;

    > .caomei-avatar.caomei-avatar {
        width: 100%;
        height: 100%;
    }
}
</style>
