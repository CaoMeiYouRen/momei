const DEFAULT_CODE_GROUP_TITLE = 'Code'

function getCodeGroupTitle(pre: Element, index: number) {
    const explicitTitle = pre.getAttribute('data-title')?.trim()
    if (explicitTitle) {
        return explicitTitle
    }

    const codeClassName = pre.querySelector('code')?.className || ''
    const language = codeClassName
        .split(/\s+/)
        .find((className) => className.startsWith('language-'))
        ?.replace('language-', '')

    return language || `${DEFAULT_CODE_GROUP_TITLE} ${index + 1}`
}

export function initRenderedMarkdownCodeGroups(container: ParentNode | null | undefined) {
    if (!container) {
        return
    }

    const groups = container.querySelectorAll('.code-group')
    groups.forEach((group) => {
        if (group.querySelector('.code-group-tabs')) {
            return
        }

        const preElements = Array.from(group.children).filter((child) => child.tagName === 'PRE')
        if (preElements.length === 0) {
            return
        }

        const tabsContainer = document.createElement('div')
        tabsContainer.className = 'code-group-tabs'

        const contentContainer = document.createElement('div')
        contentContainer.className = 'code-group-content'

        preElements.forEach((pre, index) => {
            const button = document.createElement('button')
            button.type = 'button'
            button.innerText = getCodeGroupTitle(pre, index)

            if (index === 0) {
                button.classList.add('active')
                pre.classList.add('active')
            }

            button.addEventListener('click', () => {
                tabsContainer.querySelectorAll('button').forEach((tab) => {
                    tab.classList.remove('active')
                })
                contentContainer.querySelectorAll('pre').forEach((codeBlock) => {
                    codeBlock.classList.remove('active')
                })
                button.classList.add('active')
                pre.classList.add('active')
            })

            tabsContainer.appendChild(button)
            contentContainer.appendChild(pre)
        })

        group.appendChild(tabsContainer)
        group.appendChild(contentContainer)
    })
}

/**
 * 把渲染出的表格包进可聚焦的横向滚动容器。
 *
 * 为什么不在 markdown 渲染器里做：渲染结果同时被 RSS / 导出等非 DOM 消费方使用，
 * 在 HTML 字符串层面插入包装会改变这些消费面的结构；这里只在浏览器端增强已挂载的正文。
 *
 * 幂等：已处于 `.table-scroll` 内的表格不会重复包装（重复调用安全）。
 *
 * @returns 本次新包装的表格数量
 */
export function enhanceRenderedMarkdownTables(
    container: ParentNode | null | undefined,
    options: { label?: string } = {},
): number {
    if (!container) {
        return 0
    }

    let wrapped = 0
    container.querySelectorAll('table').forEach((table) => {
        if (table.parentElement?.classList.contains('table-scroll')) {
            return
        }

        const wrapper = document.createElement('div')
        wrapper.className = 'table-scroll'
        /* 让键盘用户可以把焦点落到滚动容器上，用方向键浏览宽表。 */
        wrapper.tabIndex = 0
        wrapper.setAttribute('role', 'region')
        wrapper.setAttribute('aria-label', options.label || 'Table')

        table.parentNode?.insertBefore(wrapper, table)
        wrapper.appendChild(table)
        wrapped++
    })

    return wrapped
}

export async function copyRenderedMarkdownCode(button: HTMLElement) {
    const code = button.closest('pre')?.querySelector('code')?.textContent || ''
    if (!code) {
        return false
    }

    await navigator.clipboard.writeText(code)
    button.classList.add('copied')
    window.setTimeout(() => {
        button.classList.remove('copied')
    }, 2000)
    return true
}
