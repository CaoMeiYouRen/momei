import { dataSource } from '../database'
import { Setting } from '../entities/setting'
import { User } from '../entities/user'

export interface InstallationProbeStatus {
    installed: boolean
    databaseConnected: boolean
}

async function checkDatabaseConnection() {
    if (!dataSource?.isInitialized) {
        return false
    }

    try {
        await dataSource.query('SELECT 1')
        return true
    } catch {
        return false
    }
}

async function checkHasUsers() {
    try {
        const userRepo = dataSource.getRepository(User)
        return await userRepo.count() > 0
    } catch {
        return false
    }
}

async function checkInstallationFlag() {
    try {
        const settingRepo = dataSource.getRepository(Setting)
        const setting = await settingRepo.findOne({
            where: { key: 'system_installed' },
        })
        return setting?.value === 'true'
    } catch {
        return false
    }
}

export async function getInstallationProbeStatus(): Promise<InstallationProbeStatus> {
    const databaseConnected = await checkDatabaseConnection()

    if (!databaseConnected) {
        return {
            installed: false,
            databaseConnected,
        }
    }

    const [hasUsers, hasInstallationFlag] = await Promise.all([
        checkHasUsers(),
        checkInstallationFlag(),
    ])

    return {
        installed: hasUsers && hasInstallationFlag,
        databaseConnected,
    }
}
