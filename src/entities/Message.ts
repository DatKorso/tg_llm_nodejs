import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    role!: 'user' | 'assistant';

    @Column('text')
    content!: string;

    @CreateDateColumn()
    timestamp!: Date;

    @ManyToOne(() => User, (user: User) => user.messages)
    user!: User;

    @Column({ name: 'user_id' })
    userId!: number;

    constructor(partial: Partial<Message> = {}) {
        Object.assign(this, partial);
    }
}
