<template>
    <CaomeiTooltipProvider :delay-duration="delayDuration">
        <CaomeiTooltip :disabled="!text">
            <CaomeiTooltipTrigger
                v-bind="$attrs"
                as-child
                unstyled
            >
                <slot />
            </CaomeiTooltipTrigger>
            <CaomeiTooltipContent :side="side" :aria-label="text || undefined">
                {{ text }}
            </CaomeiTooltipContent>
        </CaomeiTooltip>
    </CaomeiTooltipProvider>
</template>

<script setup lang="ts">
import type { TooltipSide } from 'caomei-ui'

defineOptions({
    // 外层 `as-child` 触发器（DropdownMenu / Popover）会把自身的 aria / 事件以 attrs 传进来，
    // 必须落到真正的触发元素上；默认继承会把它们停在 provider 这一层组件上。
    inheritAttrs: false,
})

/**
 * `v-tooltip` 指令到 caomei-ui 的桥接层。
 *
 * caomei-ui 的 tooltip 是组合式 API（`Tooltip` + `Trigger` + `Content`），没有指令形态。
 * 逐处展开会把 84 处调用点变成三层嵌套，且方位映射、空内容守卫、触发器 `as-child` 这些
 * 共性规则会被复制 84 次；这里收成单一组件，调用点只保留「内容 + 方位」两个语义参数。
 *
 * 行为对齐 PrimeVue `v-tooltip`：
 * - 内容为空 / 未定义时不展示（等价于原指令的静默禁用）；
 * - 默认方位为 `top`（与原指令缺省一致）；
 * - 延迟为 `0`（PrimeVue 指令默认即时出现，caomei 默认 700ms 会明显变慢）；
 * - `Trigger` 用 `as-child` 落到既有元素上，`unstyled` 避免继承触发器默认外观；
 *   面板走 portal，不改变调用点的布局与层叠上下文。
 *
 * provider 挂在本组件内部而非应用根：Reka 的 `TooltipRoot` 必须处于 provider 之内，
 * 自包一层可让组件树与单测都不依赖「根上另有 provider」的隐式前提；代价是不共享
 * 跨 tooltip 的免延迟宽限，而延迟为 0 时该宽限本就无意义。
 */
const props = withDefaults(defineProps<{
    /** 展示文案；空串 / `null` / `undefined` 时不展示面板。 */
    content?: string | null
    /** 弹出方向，对应原指令的 `.top` / `.right` / `.bottom` / `.left` 修饰符。 */
    side?: TooltipSide
    /** 指针进入后到面板出现的等待时长（ms）。 */
    delayDuration?: number
}>(), {
    content: '',
    side: 'top',
    delayDuration: 0,
})

const text = computed(() => props.content ?? '')
</script>
