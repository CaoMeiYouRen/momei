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
                tabsContainer.querySelectorAll('button').forEach((tab) => tab.classList.remove('active'))
                contentContainer.querySelectorAll('pre').forEach((codeBlock) => codeBlock.classList.remove('active'))
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
