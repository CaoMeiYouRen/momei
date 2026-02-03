import { dataSource } from '@/server/database'
import { ThemeConfig } from '@/server/entities/theme-config'
import { Setting } from '@/server/entities/setting'
import type { ThemeConfigInput, ThemeConfigUpdateInput } from '@/utils/schemas/theme-config'
import { assignDefined } from '@/server/utils/object'

/**
 * 获取所有主题方案
 */
export const getThemeConfigsService = async () => {
    const themeConfigRepo = dataSource.getRepository(ThemeConfig)
    return await themeConfigRepo.find({
        order: {
            createdAt: 'DESC',
        },
    })
}

/**
 * 创建新主题方案
 */
export const createThemeConfigService = async (body: ThemeConfigInput) => {
    const themeConfigRepo = dataSource.getRepository(ThemeConfig)
    const themeConfig = new ThemeConfig()

    assignDefined(themeConfig, body, ['name', 'description', 'configData', 'previewImage'])
    themeConfig.isSystem = false

    return await themeConfigRepo.save(themeConfig)
}

/**
 * 更新主题方案
 */
export const updateThemeConfigService = async (id: string, body: ThemeConfigUpdateInput) => {
    const themeConfigRepo = dataSource.getRepository(ThemeConfig)
    const themeConfig = await themeConfigRepo.findOneBy({ id })

    if (!themeConfig) {
        throw createError({ statusCode: 404, statusMessage: 'Theme config not found' })
    }

    if (themeConfig.isSystem) {
        // 系统内置方案仅允许更新预览图或其他元数据，不允许破坏核心配置数据（可选逻辑）
        // 这里暂时允许更新，但通常系统方案应该标记为只读
    }

    assignDefined(themeConfig, body, ['name', 'description', 'configData', 'previewImage'])

    return await themeConfigRepo.save(themeConfig)
}

/**
 * 删除主题方案
 */
export const deleteThemeConfigService = async (id: string) => {
    const themeConfigRepo = dataSource.getRepository(ThemeConfig)
    const themeConfig = await themeConfigRepo.findOneBy({ id })

    if (!themeConfig) {
        throw createError({ statusCode: 404, statusMessage: 'Theme config not found' })
    }

    if (themeConfig.isSystem) {
        throw createError({ statusCode: 403, statusMessage: 'System theme config cannot be deleted' })
    }

    return await themeConfigRepo.remove(themeConfig)
}

/**
 * 应用主题方案
 * 将方案中的配置数据同步到 Setting 表
 */
export const applyThemeConfigService = async (id: string) => {
    const themeConfigRepo = dataSource.getRepository(ThemeConfig)
    const settingRepo = dataSource.getRepository(Setting)

    const themeConfig = await themeConfigRepo.findOneBy({ id })
    if (!themeConfig) {
        throw createError({ statusCode: 404, statusMessage: 'Theme config not found' })
    }

    let config: Record<string, any> = {}
    try {
        config = JSON.parse(themeConfig.configData)
    } catch {
        throw createError({ statusCode: 400, statusMessage: 'Invalid config data' })
    }

    // 将配置项逐个保存到 Setting 表
    // 假设 config 包含 theme_primary_color, theme_border_radius 等键
    for (const [key, value] of Object.entries(config)) {
        let setting = await settingRepo.findOneBy({ key })
        if (!setting) {
            setting = new Setting()
            setting.key = key
        }
        // 只有非空值才更新，避免 null 覆盖已有的保底设置
        if (value !== null && typeof value !== 'undefined') {
            setting.value = String(value)
            await settingRepo.save(setting)
        }
    }

    // 特殊：保存当前生效的画廊 ID (可选，用于在画廊中标注“使用中”)
    let activeSetting = await settingRepo.findOneBy({ key: 'theme_active_config_id' })
    if (!activeSetting) {
        activeSetting = new Setting()
        activeSetting.key = 'theme_active_config_id'
        activeSetting.description = '当前生效的主题方案 ID'
    }
    activeSetting.value = id
    await settingRepo.save(activeSetting)

    return { success: true }
}
