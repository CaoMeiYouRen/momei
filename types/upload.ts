/**
 * 上传类型枚举。
 * 统一事实源——原在 `composables/use-upload.ts` 与 `server/services/upload.ts` 各有一份相同定义，现收敛至此。
 */
export enum UploadType {
    IMAGE = 'image',
    AUDIO = 'audio',
    FILE = 'file',
}
