import { createAdSenseAdapter } from './adsense'
import type { IAdAdapter, AdAdapterConfig } from './base'

/**
 * 广告适配器注册表
 * 用于管理所有可用的广告平台适配器
 */
class AdAdapterRegistry {
    private adapters = new Map<string, IAdAdapter>()

    /**
     * 注册适配器
     */
    register(adapter: IAdAdapter): void {
        this.adapters.set(adapter.id, adapter)
    }

    /**
     * 获取适配器
     */
    get(id: string): IAdAdapter | undefined {
        return this.adapters.get(id)
    }

    /**
     * 获取所有适配器
     */
    getAll(): IAdAdapter[] {
        return Array.from(this.adapters.values())
    }

    /**
     * 检查适配器是否存在
     */
    has(id: string): boolean {
        return this.adapters.has(id)
    }
}

/**
 * 全局适配器注册表实例
 */
export const adAdapterRegistry = new AdAdapterRegistry()

// 注册内置适配器
adAdapterRegistry.register(createAdSenseAdapter())

/**
 * 广告适配器工厂
 * 用于创建和初始化广告适配器实例
 *
 * @author Claude Code
 * @date 2026-03-03
 */
export class AdAdapterFactory {
    /**
     * 创建并初始化适配器
     * @param adapterId 适配器 ID
     * @param config 适配器配置
     */
    static async create(adapterId: string, config: AdAdapterConfig): Promise<IAdAdapter> {
        const adapter = adAdapterRegistry.get(adapterId)

        if (!adapter) {
            throw new Error(`Ad adapter '${adapterId}' not found`)
        }

        // 创建新实例（避免共享状态）
        const instance = Object.create(Object.getPrototypeOf(adapter))
        Object.assign(instance, adapter)

        await instance.initialize(config)

        return instance
    }

    /**
     * 获取可用的适配器列表
     */
    static getAvailableAdapters(): {
        id: string
        name: string
        supportedLocales: string[]
    }[] {
        return adAdapterRegistry.getAll().map((adapter) => ({
            id: adapter.id,
            name: adapter.name,
            supportedLocales: adapter.supportedLocales,
        }))
    }

    /**
     * 检查适配器是否支持指定的语言环境
     */
    static supportsLocale(adapterId: string, locale: string): boolean {
        const adapter = adAdapterRegistry.get(adapterId)
        return adapter ? adapter.supportsLocale(locale) : false
    }
}

// 导出类型和工厂
export * from './base'
export * from './adsense'
