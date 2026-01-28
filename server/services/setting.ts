import { dataSource } from '@/server/database'
import { Setting } from '@/server/entities/setting'

/**
 * 值的脱敏处理
 */
export const maskValue = (value: string | null, type: string): string | null => {
    if (!value) {
        return value
    }
    switch (type) {
        case 'password':
            return '********'
        case 'key':
            if (value.length <= 8) {
                return '********'
            }
            return `${value.substring(0, 4)}****${value.substring(value.length - 4)}`
        case 'email': {
            const parts = value.split('@')
            const userPart = parts[0]
            const domainPart = parts[1]
            if (!userPart || !domainPart) {
                return '********'
            }
            return `${userPart.substring(0, Math.min(3, userPart.length))}***@${domainPart}`
        }
        default:
            return value
    }
}

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

    settings.forEach((s: Setting) => {
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
 * @param options 配置选项 (级别、描述、脱敏类型)
 */
export const setSetting = async (
    key: string,
    value: string | null,
    options?: {
        level?: number
        description?: string
        maskType?: string
    },
) => {
    const settingRepo = dataSource.getRepository(Setting)
    let setting = await settingRepo.findOne({ where: { key } })

    if (setting) {
        setting.value = value
        if (options?.description !== undefined) {
            setting.description = options.description
        }
        if (options?.level !== undefined) {
            setting.level = options.level
        }
        if (options?.maskType !== undefined) {
            setting.maskType = options.maskType
        }
    } else {
        setting = settingRepo.create({
            key,
            value,
            description: options?.description ?? '',
            level: options?.level ?? 2,
            maskType: options?.maskType ?? 'none',
        })
    }

    await settingRepo.save(setting)
}

/**
 * 获取所有设置项 (Admin 仅限)
 * @param includeSecrets 是否包含机密信息 (level 3)
 * @param shouldMask 是否执行脱敏
 */
export const getAllSettings = async (options?: { includeSecrets?: boolean, shouldMask?: boolean }) => {
    const settingRepo = dataSource.getRepository(Setting)
    let query = settingRepo.createQueryBuilder('setting')

    if (!options?.includeSecrets) {
        query = query.where('setting.level < :level', { level: 3 })
    }

    const settings = await query.getMany()

    if (options?.shouldMask) {
        return settings.map((s: Setting) => ({
            ...s,
            value: maskValue(s.value, s.maskType),
        }))
    }

    return settings
}

/**
 * 批量设置配置项
 *
 * @param settings 键值对对象，key 也可以是对象包含具体属性
 */
export const setSettings = async (settings: Record<string, string | any>) => {
    const settingRepo = dataSource.getRepository(Setting)
    const entries = Object.entries(settings)

    for (const [key, val] of entries) {
        let setting = await settingRepo.findOne({ where: { key } })

        const value = typeof val === 'object' && val !== null ? val.value : val
        const extra = typeof val === 'object' && val !== null ? val : {}

        if (setting) {
            // 如果是脱敏过的值且没有变化（即用户提交的是脱敏后的占位符），则跳过值更新
            const isMaskedPlaceholder = (inputValue: string, maskType: string) => {
                if (maskType === 'password' && inputValue === '********') {
                    return true
                }
                if (maskType === 'key' && inputValue.includes('****') && inputValue.length > 8) {
                    return true
                }
                if (maskType === 'email' && inputValue.includes('***@')) {
                    return true
                }
                return false
            }

            if (!isMaskedPlaceholder(value, setting.maskType)) {
                setting.value = value
            }

            if (extra.description !== undefined) {
                setting.description = String(extra.description)
            }
            if (extra.level !== undefined) {
                setting.level = Number(extra.level)
            }
            if (extra.maskType !== undefined) {
                setting.maskType = String(extra.maskType)
            }
        } else {
            setting = settingRepo.create({
                key,
                value,
                description: String(extra.description ?? ''),
                level: Number(extra.level ?? 2),
                maskType: String(extra.maskType ?? 'none'),
            })
        }
        await settingRepo.save(setting)
    }
}
