/**
 * Function that returns a new decorator that applies all decorators provided by param
 *
 * Useful to build new decorators (or a decorator factory) encapsulating multiple decorators related with the same feature
 *
 * @param decorators one or more decorators
 *
 */
type DecoratorClassTarget = abstract new (...args: never[]) => unknown

export function applyDecorators(
    ...decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[]
) {
    return <Y>(
        target: DecoratorClassTarget | object,
        propertyKey?: string | symbol,
        descriptor?: TypedPropertyDescriptor<Y>,
    ) => {
        for (const decorator of decorators) {
            if (typeof target === 'function' && !descriptor) {
                (decorator as ClassDecorator)(target)
                continue
            }
            if (propertyKey === undefined) {
                continue
            }

            // legacy 装饰器下属性装饰器的第三个参数恒为 undefined，必须按属性装饰器分派
            if (descriptor === undefined) {
                (decorator as PropertyDecorator)(target, propertyKey)
                continue
            }

            (decorator as MethodDecorator)(target, propertyKey, descriptor)
        }
    }
}
