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
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'education_math_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.TYPEORM_SYNC !== 'false', // set TYPEORM_SYNC=false to disable
      retryAttempts: 10,
      retryDelay: 3000,
    }),
    UserModule,
  ],
  controllers: [AppController, AiController],
  providers: [AppService, LocalHFService, ElevenLabsService],
})
export class AppModule {}
