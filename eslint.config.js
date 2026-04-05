import cmyrConfig from 'eslint-config-cmyr/nuxt'
import { globalIgnores } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import vueI18n from '@intlify/eslint-plugin-vue-i18n'
import tseslint from 'typescript-eslint'
import { __WARN__, createLanguageOptions } from 'eslint-config-cmyr/utils'
import withNuxt from './.nuxt/eslint.config.mjs'

const enableI18nLint = process.env.ESLINT_I18N === 'true'

function promoteRuleLevel(ruleConfig) {
    if (Array.isArray(ruleConfig)) {
        return ['error', ...ruleConfig.slice(1)]
    }

    return 'error'
}

function promoteVueI18nRuleLevels(config) {
    if (!enableI18nLint || !config.rules) {
        return config
    }

    return {
        ...config,
        rules: Object.fromEntries(
            Object.entries(config.rules).map(([ruleName, ruleConfig]) => {
                if (!ruleName.startsWith('@intlify/vue-i18n/')) {
                    return [ruleName, ruleConfig]
                }

                return [ruleName, promoteRuleLevel(ruleConfig)]
            }),
        ),
    }
}

const i18nLintConfigs = enableI18nLint
    ? [
        ...vueI18n.configs.recommended.map(promoteVueI18nRuleLevels),
        {
            rules: {
                '@intlify/vue-i18n/no-raw-text': 'off',
                '@intlify/vue-i18n/no-dynamic-keys': 'off',
                '@intlify/vue-i18n/no-unused-keys': [
                    'error',
                    {
                        extensions: ['.js', '.ts', '.vue'],
                        // 由于某些翻译项是动态生成的，或者在代码中以动态方式访问，因此无法静态分析到它们的使用情况，所以需要忽略这些特定的路径模式。
                        ignores: [
                            '/^components\\.post\\.copyright\\.licenses\\./',
                            '/^components\\.post\\.sponsor\\.platforms\\./',
                            '/^pages\\.about\\.meaning\\.features\\[\\d+\\]$/',
                            '/^pages\\.about\\.features\\.items\\[\\d+\\]\\.(title|desc)$/',
                            '/^pages\\.admin\\.ai\\.types\\.(asr|image|text|suggest_slug|summarize|translate|recommend_tags)$/',
                            '/^pages\\.admin\\.settings\\.system\\.notifications\\.events\\./',
                            '/^pages\\.admin\\.snippets\\.source_types\\./',
                            '/^pages\\.archives\\.months\\./',
                            '/^pages\\.posts\\.locked\\./',
                            '/^pages\\.settings\\.commercial\\.social_platforms\\./',
                            '/^pages\\.login\\.(email_required|password_required)$/',
                            '/^pages\\.register\\.(name_required|email_required|password_required|confirm_password_required)$/',
                            '/^pages\\.settings\\.security\\.(current_password_required|new_password_required|confirm_password_required)$/',
                            '/^legal\\.agreement_required$/',
                            '/^error\\.(forbidden|validation|rateLimited|internal)$/',
                        ],
                    },
                ],
            },
            settings: {
                'vue-i18n': {
                    localeDir: [
                        './i18n/locales/*.json',
                        './i18n/locales/**/*.json',
                    ],
                    messageSyntaxVersion: '^10.0.0',
                },
            },
        },
        {
            files: ['i18n/locales/*.json', 'i18n/locales/**/*.json'],
            rules: {
                '@intlify/vue-i18n/no-unused-keys': 'off',
                '@intlify/vue-i18n/no-html-messages': 'off', // 允许在 JSON 文件中使用 HTML 标签
            },
        },
    ]
    : []

export default withNuxt(
    globalIgnores([
        'node_modules',
        '.husky',
        '.git',
        '.nuxt',
        '.output',
        '.vercel',
        '.vitepress',
        'docs',
        'dist',
        'public',
        'static',
        'coverage',
        'logs',
        'jscpd-report',
        'packages',
        'playwright-report',
        'test-results',
        'pnpm-lock.yaml',
    ]),
    {
        plugins: {
            vue: pluginVue,
        },
    },
    ...i18nLintConfigs,
    cmyrConfig,
    {
        rules: {
            'max-lines': [1, { max: 800 }], // 强制文件的最大行数
            'max-lines-per-function': [1, { max: 500 }], // 强制函数最大行数
        },
    },
    {
        files: ['**/**/*.test.*', '**/**/*.spec.*'],
        rules: {
            'max-lines-per-function': [1, { max: 700 }], // 测试文件的函数行数限制放宽一些
        },
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        extends: [
            tseslint.configs.recommendedTypeChecked,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ],
        plugins: {
            tseslint,
        },
        languageOptions: createLanguageOptions({}, {
            projectService: {
                defaultProject: 'tsconfig.json',
            },
            tsconfigRootDir: process.cwd(),
        }),
        rules: {

            '@typescript-eslint/no-deprecated': [1], // 禁止使用已废弃的 API
            '@typescript-eslint/no-floating-promises': [1], // 禁止忽略 Promise 返回值
            '@typescript-eslint/no-misused-promises': [1], // 禁止将 Promise 误用为条件表达式
            '@typescript-eslint/await-thenable': [1], // 禁止等待非 Promise 类型的值
            '@typescript-eslint/no-base-to-string': [1], // 禁止将对象直接转换为字符串
            '@typescript-eslint/no-unnecessary-type-assertion': [0], // 禁止不必要的类型断言
            '@typescript-eslint/no-unsafe-enum-comparison': [1], // 禁止将枚举与非枚举类型进行比较
            '@typescript-eslint/no-redundant-type-constituents': [1], // 禁止联合类型中包含冗余的成员
            '@typescript-eslint/only-throw-error': [1], // 禁止不做任何处理就再次向上抛出相同的 error
            '@typescript-eslint/prefer-optional-chain': [1], // 建议使用可选链 (?.) 替代逻辑与 (&&) 来访问深层嵌套的属性
            '@typescript-eslint/require-await': [1], // 禁止在 async 函数中不使用 await 表达式
            '@typescript-eslint/non-nullable-type-assertion-style': [0], // 建议使用非空断言 (postfix !) 替代类型断言来消除 null 和 undefined
            '@typescript-eslint/no-inferrable-types': [0], // 对于初始化为数字、字符串或布尔值的变量或参数，不允许显式类型声明
            '@typescript-eslint/explicit-function-return-type': [0], // 要求函数和类方法的显式返回类型
            '@typescript-eslint/prefer-nullish-coalescing': [0], // 建议使用空值合并运算符 (??) 替代逻辑或 (||) 来处理 null 或 undefined

            '@typescript-eslint/no-unnecessary-boolean-literal-compare': [1], // 禁止与 boolean 字面量进行不必要的比较
            '@typescript-eslint/return-await': [1], // 禁止在返回语句中使用 await，除非在 try/catch 块中
            '@typescript-eslint/no-invalid-void-type': [1], // 禁止在泛型或返回类型之外使用 void 类型
            '@typescript-eslint/no-unnecessary-type-parameters': [1], // 禁止在类型参数未被使用时将其添加到泛型函数中

            '@typescript-eslint/no-extraneous-class': [0], // 允许存在没有成员的类，或者只有静态成员的类
            '@typescript-eslint/no-confusing-void-expression': [0], // 要求类型为 void 的表达式出现在语句位置
            '@typescript-eslint/use-unknown-in-catch-callback-variable': [0], // 允许在 catch 子句中使用 any 类型的错误变量
            '@typescript-eslint/restrict-template-expressions': [0], // 允许在模板字符串中使用非字符串类型的表达式
            '@typescript-eslint/no-non-null-assertion': [0], // 允许使用非空断言操作符 (!)
            '@typescript-eslint/no-unnecessary-condition': [0], // 允许在条件表达式中包含不必要的条件
            '@typescript-eslint/restrict-plus-operands': [0], // 允许在加法操作中使用不同类型的操作数
            '@typescript-eslint/ban-ts-comment': [0], // 禁止 @ts-<directive> 注释或要求指令后必须有描述
            '@typescript-eslint/no-unnecessary-type-arguments': [0], // 禁止在类型参数可以被推断时显式指定类型参数
            '@typescript-eslint/prefer-reduce-type-parameter': [0], // 建议使用 Array.prototype.reduce() 的类型参数来代替显式的类型参数

            // TODO eslint 规则更加严格。下方的规则将按批次进行启用，以便逐步改进代码质量，同时避免一次性修复过多问题。

            '@typescript-eslint/explicit-module-boundary-types': [0, {
                allowArgumentsExplicitlyTypedAsAny: true,
            }], // 要求导出函数和类的公共类方法的显式返回和参数类型
            '@typescript-eslint/no-explicit-any': [0], // 不允许使用any类型
            '@typescript-eslint/no-unsafe-argument': [0], // 不允许传递 any 类型的值作为参数
            '@typescript-eslint/no-unsafe-assignment': [0], // 不允许将 any 类型的值分配给其他类型
            '@typescript-eslint/no-unsafe-member-access': [0], // 不允许对 any 类型的值进行成员访问
            '@typescript-eslint/no-unsafe-return': [0], // 不允许从函数返回 any 类型的值
            '@typescript-eslint/no-unsafe-call': [0], // 不允许对 any 类型的值进行调用
            '@typescript-eslint/unbound-method': [0], // 不允许不绑定上下文的类方法引用

            '@typescript-eslint/no-misused-spread': [0], // 禁止在可能引起意外行为时使用展开运算符
            '@typescript-eslint/no-dynamic-delete': [0], // 允许使用 delete 操作符删除对象的属性，即使该对象的类型不包含索引签名
            '@typescript-eslint/no-unnecessary-type-conversion': [0], // 禁止在表达式类型或值未发生变化时使用转换惯用法
        },
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        ignores: ['**/*.test.*', '**/*.spec.*', 'tests/**', 'scripts/**'],
        rules: {
            '@typescript-eslint/unbound-method': [1], // 首批扩展到全量生产 TS，继续排除测试与脚本范围
        },
    },
)
