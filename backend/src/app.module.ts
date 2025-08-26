import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LocalHFService } from './local-hf.service';
import { AiController } from './ai.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ElevenLabsService } from './elevenlabs.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'fl4shsimp',
      database: 'education_math_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Disable in production
    }),
    UserModule,
  ],
  controllers: [AppController, AiController],
  providers: [AppService, LocalHFService, ElevenLabsService],
})
export class AppModule {}
