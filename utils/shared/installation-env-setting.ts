import type { SettingLockReason } from '@/types/setting'

export interface InstallationEnvSetting {
    value: string
    isLocked: boolean
    maskType: string
    envKey: string | null
    lockReason: SettingLockReason | null
}

export function resolveInstallationEnvLockMessage(
    t: (key: string, params?: Record<string, string>) => string,
    fieldKey: string,
    envSetting?: InstallationEnvSetting | null,
) {
    if (!envSetting?.isLocked) {
        return ''
    }

    if (envSetting.lockReason === 'forced_env_lock') {
        return t('pages.admin.settings.system.smart_mode.messages.forced_env_lock')
    }

    return t('pages.admin.settings.system.smart_mode.messages.env_override', {
        envKey: envSetting.envKey ?? fieldKey.toUpperCase(),
    })
}
