import { Entity, OneToMany, Unique } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { FriendLink } from './friend-link'

@Entity('friend_link_categories')
@Unique(['slug'])
export class FriendLinkCategory extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 100, nullable: false })
    name: string

    @CustomColumn({ type: 'varchar', length: 100, nullable: false, index: true })
    slug: string

    @CustomColumn({ type: 'text', nullable: true })
    description: string | null

    @CustomColumn({ type: 'int', default: 0 })
    sortOrder: number

    @CustomColumn({ type: 'boolean', default: true, index: true })
    isEnabled: boolean

    @OneToMany(() => FriendLink, (friendLink) => friendLink.category)
    links: FriendLink[]
}
