import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LocalHFService } from './local-hf.service';
import { AiController } from './ai.controller';

@Module({
  imports: [],
  controllers: [AppController, AiController],
  providers: [AppService, LocalHFService],
})
export class AppModule {}
