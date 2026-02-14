import { Entity, ManyToOne, ManyToMany, JoinTable, Unique, OneToMany } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { Category } from './category'
import { Tag } from './tag'
import { Comment } from './comment'
import { PostVersion } from './post-version'
import { PostStatus, PostVisibility } from '@/types/post'

@Entity('post')
@Unique(['slug', 'language'])
export class Post extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 255, nullable: false, index: true })
    title: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    slug: string

    @CustomColumn({ type: 'text', nullable: false })
    content: string

    @CustomColumn({ type: 'text', nullable: true })
    summary: string | null

    @CustomColumn({ type: 'text', nullable: true })
    coverImage: string | null

    @CustomColumn({ type: 'varchar', length: 10, default: 'zh-CN', nullable: false, index: true })
    language: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, index: true })
    translationId: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: false, index: true })
    authorId: string

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    categoryId: string | null

    @CustomColumn({
        type: 'varchar',
        length: 20,
        comment: '文章状态：draft, pending, published, rejected, hidden, scheduled',
        default: PostStatus.DRAFT,
        index: true,
    })
    status: PostStatus

    @CustomColumn({
        type: 'varchar',
        length: 20,
        comment: '可见性：public, private, password, registered, subscriber',
        default: PostVisibility.PUBLIC,
        index: true,
    })
    visibility: PostVisibility

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, comment: '访问密码', select: false })
    password: string | null

    @CustomColumn({ type: 'integer', default: 0, index: true })
    views: number

    @CustomColumn({ type: 'text', nullable: true })
    copyright: string | null

    @CustomColumn({ type: 'text', nullable: true, comment: '音频文件地址' })
    audioUrl: string | null

    @CustomColumn({ type: 'integer', nullable: true, comment: '音频时长 (秒)' })
    audioDuration: number | null

    @CustomColumn({ type: 'integer', nullable: true, comment: '音频文件大小 (字节)' })
    audioSize: number | null

    @CustomColumn({ type: 'varchar', length: 100, nullable: true, comment: '音频 MIME 类型' })
    audioMimeType: string | null

    @CustomColumn({ type: 'varchar', length: 50, nullable: true, comment: 'TTS 音色' })
    ttsVoice: string | null

    @CustomColumn({ type: 'varchar', length: 50, nullable: true, comment: 'TTS 提供者' })
    ttsProvider: string | null

    @CustomColumn({ type: 'datetime', nullable: true, comment: 'TTS 生成时间' })
    ttsGeneratedAt: Date | null

    @CustomColumn({ type: 'text', nullable: true, comment: 'AI 生成的大纲原文' })
    scaffoldOutline: string | null

    @CustomColumn({ type: 'json', nullable: true, comment: '大纲生成的元数据 (模板, 受众, 章节数等)' })
    scaffoldMetadata: Record<string, any> | null

    @CustomColumn({ type: 'json', nullable: true, comment: '发布意图 (定时发布选项)' })
    publishIntent: Record<string, any> | null

    @CustomColumn({ type: 'datetime', nullable: true, index: true })
    publishedAt: Date | null

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, comment: '关联的 Memos ID', index: true })
    memosId: string | null

    // ========== 关系定义 ==========

    @ManyToOne(() => User, (user) => user.posts, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    author: User

    @ManyToOne(() => Category, (category) => category.posts, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    category: Category

    @ManyToMany(() => Tag, (tag) => tag.posts)
    @JoinTable({
        name: 'post_tags_tag_posts',
        joinColumn: {
            name: 'post_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'tag_id',
            referencedColumnName: 'id',
        },
    })
    tags: Tag[]

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[]

    @OneToMany(() => PostVersion, (version) => version.post)
    versions: PostVersion[]
}
