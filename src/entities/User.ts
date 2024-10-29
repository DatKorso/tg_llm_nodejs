import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Message } from './Message';
import { ModelType } from '../config/models.config';

@Entity('users')
export class User {
    @PrimaryColumn('bigint')
    id!: number;

    @Column({ nullable: true })
    username!: string;

    @Column({ default: 0 })
    access!: number;

    @Column({
        type: 'varchar',
        default: 'gpt-4o-mini'
    })
    preferredModel!: ModelType;

    @OneToMany(() => Message, (message: Message) => message.user)
    messages!: Message[];

    constructor(partial: Partial<User> = {}) {
        Object.assign(this, partial);
    }
}
