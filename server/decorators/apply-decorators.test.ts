import { describe, expect, it, vi } from 'vitest'
import { applyDecorators } from './apply-decorators'

/**
 * legacy 装饰器发射器按三种形态调用：class decorator 只带 target；
 * 属性装饰器带 (target, key, undefined)；方法装饰器带 (target, key, descriptor)。
 * 这里直接以包装器的入参形态锁定分派，避免把属性装饰器误当异常跳过。
 */
describe('applyDecorators', () => {
    it('类目标下所有装饰器都按类装饰器接收 target', () => {
        class Fixture {}
        const classDecorator = vi.fn()
        const secondDecorator = vi.fn()

        applyDecorators(classDecorator as ClassDecorator, secondDecorator as ClassDecorator)(Fixture)

        expect(classDecorator).toHaveBeenCalledWith(Fixture)
        expect(secondDecorator).toHaveBeenCalledWith(Fixture)
    })

    it('属性装饰器以 (target, key, undefined) 分派且不被跳过', () => {
        const target = {}
        const propertyDecorator = vi.fn()

        applyDecorators(propertyDecorator as PropertyDecorator)(target, 'name')

        expect(propertyDecorator).toHaveBeenCalledWith(target, 'name')
    })

    it('方法装饰器携带描述符分派', () => {
        const target = {}
        const descriptor = { value: () => 'ok' }
        const methodDecorator = vi.fn()

        applyDecorators(methodDecorator as MethodDecorator)(target, 'run', descriptor)

        expect(methodDecorator).toHaveBeenCalledWith(target, 'run', descriptor)
    })

    it('缺少属性键时不做分派', () => {
        const decorator = vi.fn()

        applyDecorators(decorator as PropertyDecorator)({})

        expect(decorator).not.toHaveBeenCalled()
    })
})
