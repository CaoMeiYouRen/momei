# 开放发布协议支持 (Open Federation Protocols)

## 1. 概述

第八阶段已经将开放协议从“设计稿”推进为可运行的只读联邦能力。当前实现重点是：

- WebFinger 发现
- ActivityPub Actor / Note / Outbox 只读端点
- 基于公开文章的协议映射

RSS、Atom 与 JSON Feed 属于订阅分发链路，相关内容在其他模块文档中维护，这里不再重复展开。

## 2. 当前已实现端点

| 路径 | 文件 | 作用 |
| :--- | :--- | :--- |
| `/.well-known/webfinger` | [server/routes/.well-known/webfinger.ts](../../server/routes/.well-known/webfinger.ts) | 发现用户 Actor |
| `/fed/actor/:username` | [server/routes/fed/actor/[username].ts](../../server/routes/fed/actor/[username].ts) | 返回 Actor 对象 |
| `/fed/note/:id` | [server/routes/fed/note/[id].ts](../../server/routes/fed/note/[id].ts) | 返回公开文章的 ActivityPub Article |
| `/fed/outbox/:username` | [server/routes/fed/outbox/[username].ts](../../server/routes/fed/outbox/[username].ts) | 返回用户公开文章活动流 |

## 3. 协议映射现状

### 3.1 WebFinger

WebFinger 端点当前行为已经明确：

1. 仅接受 `acct:username@domain` 格式。
2. 校验请求中的 `domain` 必须等于当前站点域名。
3. 返回 Actor 地址、作者页面、头像与关注模板。
4. 输出 `application/jrd+json`。

这部分真实逻辑以 [server/routes/.well-known/webfinger.ts](../../server/routes/.well-known/webfinger.ts) 为准，不再沿用旧版伪代码示例。

### 3.2 Actor

Actor 映射已经统一收敛到 [server/utils/fed/mapper.ts](../../server/utils/fed/mapper.ts) 的 `userToActor()`：

- `preferredUsername` 来自用户名
- `url` 指向作者页
- `publicKey` 通过用户密钥对生成工具提供
- `sharedInbox` 指向站点级联邦入口占位地址

协议类型定义则统一维护在 [types/federation.ts](../../types/federation.ts)。

### 3.3 Note / Article

文章映射已经采用真实文章数据，而不是文档中的静态示例：

- 只允许公开且已发布文章对外暴露
- Markdown 内容会渲染为 HTML 后写入 `content`
- 标签与分类都会映射为 `Hashtag`
- 封面图会映射为附件对象

实现入口在 [server/routes/fed/note/[id].ts](../../server/routes/fed/note/[id].ts) 与 [server/utils/fed/mapper.ts](../../server/utils/fed/mapper.ts)。

### 3.4 Outbox

Outbox 端点当前支持分页查询：

- 未带 `page` 参数时返回 `OrderedCollection`
- 带 `page` 参数时返回 `OrderedCollectionPage`
- 文章筛选复用了现有可见性过滤逻辑 `applyPostVisibilityFilter`

这保证联邦输出与站内公开可见性保持一致，而不是维护一套独立的权限判断。

## 4. 安全与兼容性

### 4.1 当前安全控制

- 所有公开内容都受站内文章可见性规则约束。
- 非公开文章在 Note 端点返回 404，避免泄露存在性。
- WebFinger 与 ActivityPub 路由仅对同源浏览器请求回写精确的 CORS 头，不使用通配符。

### 4.2 当前未纳入范围

以下能力尚未在本阶段完整交付，因此不再在本文档中伪装成“已设计即已实现”：

- Inbox 写入与联邦收件处理
- Followers / Following 集合端点
- Follow / Accept / Undo 等双向活动协商
- 更完整的 HTTP Signature 验签链路

## 5. 文档维护约定

从本次收敛起，开放协议文档只描述真实可访问的端点与共享映射工具，不再在正文中复制大段与代码脱节的示例实现。

## 6. 相关文档

- [开放接口](./open-api.md)
- [渲染引擎](./rendering.md)
