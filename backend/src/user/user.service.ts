import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<User> {
    // Check if username already exists
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      emailVerified: false,
      verificationToken,
      age: null,
    });
    // Do not save user yet; return user object for email sending
    return user;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { username } });
    return user === null ? undefined : user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user === null ? undefined : user;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      return user;
    }
    return null;
  }
  async findByVerificationToken(token: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });
    return user === null ? undefined : user;
  }

  async save(user: User): Promise<User> {
    // Only assign null to clear verificationToken
    return this.userRepository.save(user);
    // Fix verificationToken type issue
    if (user.verificationToken === undefined) {
      user.verificationToken = null;
    }
    return this.userRepository.save(user);
  }

  /*
  async registerGoogleUser(googleUser: any): Promise<User> {
    const user = this.userRepository.create({
      googleId: googleUser.googleId,
      email: googleUser.email,
      username: googleUser.username,
      profile: googleUser.profile,
      emailVerified: true,
      password: null,
    });
    return this.userRepository.save(user);
  }
  */
}
