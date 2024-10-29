import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Message } from './Message';

@Entity('users')
export class User {
    @PrimaryColumn('bigint')
    id!: number;

    @Column({ nullable: true })
    username!: string;

    @Column({ default: 0 })
    access!: number;

    @Column({ default: 'gpt-3.5-turbo', name: 'preferred_model' })
    preferredModel!: string;

    @OneToMany(() => Message, (message: Message) => message.user)
    messages!: Message[];

    constructor(partial: Partial<User> = {}) {
        Object.assign(this, partial);
    }
}
