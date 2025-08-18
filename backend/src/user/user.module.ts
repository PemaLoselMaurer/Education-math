import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
// import { GoogleStrategy } from './google.strategy';
import { EmailService } from './email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: 'your_jwt_secret', // Replace with env variable in production
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [UserService, /* GoogleStrategy, */ EmailService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
