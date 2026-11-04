import { expect, test } from '@playwright/test'
import { e2eBaseURL } from '../helpers/playwright-servers'

/**
 * 安装向导六步流程（未安装态实例，端口 3002）。
 *
 * 为什么必须独立实例：已安装态主实例由 `server/middleware/0-installation.ts` 直接把 `/installation`
 * 302 到首页，前端无法补救。该实例（`playwright.config.ts` 的第二个 webServer）使用
 * `MOMEI_INSTALLED=false` + `TEST_MODE=false` + 内存库 + `DATABASE_SYNCHRONIZE=true`，
 * 每次启动都是干净未安装态，故本文件可以真实走完安装流程。
 *
 * 断言口径：步骤切换只依赖标题与可访问按钮名；`.caomei-*` 类名仅用于「迁移防回退」与「等待异步消息」
 * 两类必须落地的场景（并在用例内就近注明），不作为通用选择器。
 */
test.describe.configure({ retries: 0 })

test.describe('安装向导（未安装态）', () => {
    test('完成从环境检查到安装完成的六步流程', async ({ page }) => {
        /* 整条链路含两次真实 API 往返（init-db / finalize）与三步表单提交，CI 上需要余量。 */
        test.slow()
        const panel = page.locator('.installation-wizard__panels')

        await page.goto('/installation')
        await page.getByRole('heading', { name: '墨梅博客安装向导' }).waitFor({ state: 'visible' })

        // 步骤 1：环境检查。就绪后「下一步」才可用（状态接口返回前按钮处于 loading）。
        await expect(panel.getByRole('heading', { level: 2 })).toHaveText('环境检查')
        await expect(page.locator('.installation-wizard__checks-grid')).toBeVisible()

        /* 步骤头的 `linear` 必须真的拦住前跳：非当前步骤一律不可点击，强点也不切换面板。 */
        const databaseStepTrigger = page.getByRole('button', { name: /数据库初始化/ })
        await expect(databaseStepTrigger).toBeDisabled()
        await databaseStepTrigger.click({ force: true })
        await expect(panel.getByRole('heading', { level: 2 })).toHaveText('环境检查')

        await panel.getByRole('button', { name: '下一步' }).click()

        // 步骤 2：初始化数据库。
        await expect(panel.getByRole('heading', { level: 2 })).toHaveText('数据库初始化')
        /* 未初始化时同样不能通过步骤头前跳。 */
        const siteStepTrigger = page.getByRole('button', { name: /站点配置/ })
        await expect(siteStepTrigger).toBeDisabled()
        await siteStepTrigger.click({ force: true })
        await expect(panel.getByRole('heading', { level: 2 })).toHaveText('数据库初始化')

        await panel.getByRole('button', { name: '初始化数据库' }).click()
        await expect(panel.locator('.caomei-message')).toContainText('数据库初始化成功', { timeout: 15000 })
        await panel.getByRole('button', { name: '下一步' }).click()

        // 步骤 3：站点配置。
        await expect(panel.getByRole('heading', { level: 2 })).toHaveText('站点配置')
        await expect(panel.locator('.p-inputtext')).toHaveCount(0)

        /* caomei 的 Select 默认上限 20rem：不显式复位会缩到 320px（迁移前 `fluid` 为 100%）。 */
        const selectWidth = await panel.locator('.caomei-select__field').first().evaluate((el) => el.getBoundingClientRect().width)
        expect(selectWidth).toBeGreaterThan(600)

        await panel.locator('#site_title').fill('E2E 安装站点')
        await panel.getByRole('button', { name: '下一步' }).click()

        // 步骤 4：管理员账号。
        await expect(panel.getByRole('heading', { level: 2 })).toHaveText('创建管理员账号')
        await expect(panel.locator('.p-inputtext')).toHaveCount(0)
        await panel.locator('#admin_name').fill('E2E 管理员')
        await panel.locator('#admin_email').fill('installer@momei.test')
        await panel.locator('#admin_password').fill('Password123')
        await panel.getByRole('button', { name: '下一步' }).click()

        // 步骤 5：可选功能配置（Accordion 四组折叠面板）。
        await expect(panel.getByRole('heading', { level: 2 })).toHaveText('可选功能配置')
        await expect(panel.locator('.caomei-accordion__item')).toHaveCount(4)
        await expect(panel.locator('.p-inputtext')).toHaveCount(0)

        /* 数字框默认上限 12rem：同样需要复位到整行宽。折叠面板默认收起，先展开「邮件配置」。 */
        await panel.getByRole('button', { name: '邮件服务' }).click()
        const numberWidth = await panel.locator('.caomei-input-number').first().evaluate((el) => el.getBoundingClientRect().width)
        expect(numberWidth).toBeGreaterThan(600)

        await panel.getByRole('button', { name: '保存并继续' }).click()

        // 步骤 6：完成安装。
        await expect(panel.getByRole('heading', { level: 2 })).toHaveText('安装完成')
        await panel.getByRole('button', { name: '完成安装' }).click()
        await expect(panel.locator('.caomei-message--success')).toContainText('安装已完成')
        await expect(panel.getByText('MOMEI_INSTALLED=true')).toBeVisible()
    })

    test('已安装态实例仍会把 /installation 重定向到首页', async ({ page }) => {
        /* 反向验证第二条 server 的必要性：主实例（已安装态）不应再暴露安装向导。
         * 该断言让「误把本文件放回主 project」变成响亮失败，而不是静默通过。 */
        await page.goto(`${e2eBaseURL}/installation`)
        await page.waitForURL((url) => !url.pathname.includes('/installation'), { timeout: 15000 })
        await expect(page.locator('.installation-wizard')).toHaveCount(0)
    })
})
