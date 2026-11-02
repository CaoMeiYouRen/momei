import { ref, type CSSProperties } from 'vue'

/**
 * 命令式浮层的锚点定位。
 *
 * 迁移前 PrimeVue `Popover` 支持 `show(event, target)` / `toggle(event)`，以事件坐标或目标元素定位；
 * caomei `CaomeiPopover` 只提供声明式触发器。对于「触发器在另一个组件 / 由命令式入口打开」的场景，
 * 用固定定位的零影响锚点元素承接 `CaomeiPopoverTrigger`，并把目标元素矩形同步到锚点样式上。
 *
 * 锚点 `pointer-events: none`，不拦截真实触发器的点击；开合完全由调用方控制。
 */
export function useAnchoredPopover() {
    const open = ref(false)
    const anchorStyle = ref<CSSProperties>({})

    function updateAnchor(target?: Event | EventTarget | null) {
        const element = target instanceof Event ? target.currentTarget : target

        if (!(element instanceof HTMLElement)) {
            return
        }

        const rect = element.getBoundingClientRect()

        anchorStyle.value = {
            position: 'fixed',
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            pointerEvents: 'none',
        }
    }

    const show = (target?: Event | EventTarget | null) => {
        updateAnchor(target)
        open.value = true
    }

    const hide = () => {
        open.value = false
    }

    const toggle = (target?: Event | EventTarget | null) => {
        if (open.value) {
            hide()
            return
        }

        show(target)
    }

    return {
        open,
        anchorStyle,
        show,
        hide,
        toggle,
    }
}
