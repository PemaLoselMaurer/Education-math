import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  favouriteSubjects: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  hobbies: string[] | null;
  @Column({ type: 'int', nullable: true })
  age: number | null;
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true, type: 'varchar' })
  verificationToken: string | null;

  @Column({ nullable: true, unique: true, type: 'varchar' })
  googleId: string | null;

  @Column({ nullable: true, type: 'json' })
  profile: Record<string, any> | null;
}
