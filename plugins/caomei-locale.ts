/**
 * caomei-ui 内建文案的语言注册。
 *
 * `zh-CN` / `en-US` 由包根随 `caomei-ui` 预注册（`PRE_REGISTERED_LOCALES`），这里只注册
 * 其余三种应用语言。注册必须发生在 `<CaomeiConfigProvider>`（`app.vue`）**首次求值之前**：
 * provider 的文案是 computed，只会在语言标识变化时重算，`registerLocale` 本身不是响应式的；
 * 晚于 provider 注册会让该语言一直回落到默认文案。
 *
 * 注册动作放在模块顶层（而非插件函数内）：模块求值早于插件执行、更早于应用挂载；
 * 构建产物内每个运行侧只求值一次（dev HMR 可能重复求值，`registerLocale` 幂等）。
 * 注册的是静态文案对象，不含请求数据，因此 SSR 下跨请求共享注册表是安全的。
 *
 * 采用静态 import 而非「按当前语言动态 import」：后者需要在每次语言切换前 await 注册，
 * 否则 provider 已用旧注册表求值、切换后仍显示默认文案；且会阻塞客户端首次挂载。
 * 三门语言的 gzip 体积合计约 4.2KB，`coreEntryJs` 实测与两种形态的取舍裁定见
 * `docs/reports/regression/current.md` 的「第六十九阶段条目 3」窗口。
 */
import { registerLocale } from 'caomei-ui'
import jaJP from 'caomei-ui/locale/ja-jp'
import koKR from 'caomei-ui/locale/ko-kr'
import zhTW from 'caomei-ui/locale/zh-tw'

registerLocale('zh-TW', zhTW)
registerLocale('ja-JP', jaJP)
registerLocale('ko-KR', koKR)

export default defineNuxtPlugin(() => {
    // 注册已在模块求值阶段完成；插件本体无需额外动作，保留入口以便 Nuxt 生命周期可追踪。
})
