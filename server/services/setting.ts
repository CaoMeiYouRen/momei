import { dataSource } from '@/server/database'
import { Setting } from '@/server/entities/setting'

/**
 * 获取指定键的设置值
 *
 * @param key 设置键名
 * @returns 设置值或 null
 */
export const getSetting = async (key: string): Promise<string | null> => {
    const settingRepo = dataSource.getRepository(Setting)
    const setting = await settingRepo.findOne({ where: { key } })
    return setting?.value ?? null
}

/**
 * 获取多个设置值
 *
 * @param keys 设置键名数组
 * @returns 键值对对象
 */
export const getSettings = async (keys: string[]): Promise<Record<string, string | null>> => {
    const settingRepo = dataSource.getRepository(Setting)
    const settings = await settingRepo.find()
    const result: Record<string, string | null> = {}

    // 初始化默认值
    keys.forEach((key) => {
        result[key] = null
    })

    settings.forEach((s) => {
        if (keys.includes(s.key)) {
            result[s.key] = s.value
        }
    })

    return result
}

/**
 * 设置或更新配置项
 *
 * @param key 设置键名
 * @param value 设置值
 * @param description 描述信息（可选）
 */
export const setSetting = async (key: string, value: string | null, description?: string) => {
    const settingRepo = dataSource.getRepository(Setting)
    let setting = await settingRepo.findOne({ where: { key } })

    if (setting) {
        setting.value = value
        if (description !== undefined) {
            setting.description = description
        }
    } else {
        setting = settingRepo.create({
            key,
            value,
            description: description ?? '',
        })
    }

    await settingRepo.save(setting)
}

/**
 * 获取所有设置项 (Admin 仅限)
 */
export const getAllSettings = async () => {
    const settingRepo = dataSource.getRepository(Setting)
    return await settingRepo.find()
}

/**
 * 批量设置配置项
 *
 * @param settings 键值对对象
 */
export const setSettings = async (settings: Record<string, string | null>) => {
    const settingRepo = dataSource.getRepository(Setting)
    const entries = Object.entries(settings)

    for (const [key, value] of entries) {
        let setting = await settingRepo.findOne({ where: { key } })
        if (setting) {
            setting.value = value
        } else {
            setting = settingRepo.create({ key, value })
        }
        await settingRepo.save(setting)
    }
}
