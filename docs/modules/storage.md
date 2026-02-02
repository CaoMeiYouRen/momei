# 存储模块设计文档 (Storage Module)

## 1. 概述 (Overview)

存储模块负责处理应用中的文件持久化，包括文章插图、用户头像等资源。为了适应不同的部署场景（从单机 VPS 到 Serverless 边缘计算），该模块采用了**适配器模式**进行架构设计。

## 2. 架构设计 (Architecture)

### 2.1 存储接口 (`Storage` Interface)

所有存储提供商必须实现以下接口：

```typescript
export interface Storage {
    /**
     * 上传二进制文件并返回可访问的 URL
     */
    upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }>
}
```

### 2.2 存储工厂 (`getFileStorage`)

系统根据环境变量 `STORAGE_TYPE` 动态初始化对应的驱动程序。

## 3. 驱动程序设计 (Driver Designs)

### 3.1 S3 适配器 (Cloud Storage)
- **适用场景**: 生产环境、分布式部署、跨域图片托管。
- **技术栈**: `@aws-sdk/client-s3`。
- **配置项**: `S3_ENDPOINT`, `S3_REGION`, `S3_KEY`, `S3_SECRET`, `S3_BUCKET`。

### 3.2 Vercel Blob 适配器 (Serverless Primary)
- **适用场景**: 部署在 Vercel 上的应用。
- **技术栈**: `@vercel/blob`。
- **特点**: 无需复杂配置，自动集成 Vercel 权限。

### 3.3 本地磁盘适配器 (Local Storage)
- **适用场景**: 单机部署、Docker 私有化部署、快速原型开发。
- **配置项**: `LOCAL_STORAGE_DIR`, `LOCAL_STORAGE_BASE_URL`, `LOCAL_STORAGE_MIN_FREE_SPACE`。
- **设计要点**:
    - **路径映射**: 默认存储在项目根目录的 `public/uploads` 或配置的 `LOCAL_STORAGE_DIR`。
    - **自动创建**: 上传时自动检查并创建必要的存储子目录。
    - **环境卫兵 (Environment Guard)**:
        - 探测到 Serverless 环境 (Vercel/Netlify/Cloudflare) 时，拒绝执行上传，引导用户切换存储引擎。
    - **磁盘空间保护**: 使用 `statfs` 监控剩余空间，低于阈值 (`LOCAL_STORAGE_MIN_FREE_SPACE`) 时停止写入。
    - **类型安全**: 强制校验 `contentType` 仅允许 `image/*`。

## 4. 安全与维护 (Security)

- **文件名混淆**: 默认使用 `时间戳-随机字符.扩展名` 命名，防止原文件名包含恶意字符或导致路径遍历攻击。
- **限制策略**:
    - 强制校验文件大小 (`MAX_UPLOAD_SIZE`)。
    - 基于用户角色的上传频率限制。
- **备份**: 建议在使用 `local` 模式时，将上传目录挂载到宿主机的持久化卷进行备份。

---

## 5. 待办事项 (Next Steps)

- [x] 实现 `LocalStorage` 核心逻辑。
- [x] 完善环境检测卫兵代码。
- [ ] 增强多级存储自动切换能力（可选）。
- [ ] 后台管理界面增加存储引擎状态监控。
