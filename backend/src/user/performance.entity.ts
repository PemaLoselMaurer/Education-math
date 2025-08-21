import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Performance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @Index()
  user: User;

  @Column({ type: 'varchar', length: 64 })
  label: string;

  // accuracy percentage 0-100
  @Column({ type: 'float' })
  accuracy: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
