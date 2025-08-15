import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

// Reduce ONNX Runtime console noise (0=verbose,1=info,2=warning,3=error,4=fatal)
if (!process.env.ORT_LOG_SEVERITY_LEVEL) {
  process.env.ORT_LOG_SEVERITY_LEVEL = '3';
}
if (!process.env.ORT_LOG_VERBOSITY_LEVEL) {
  process.env.ORT_LOG_VERBOSITY_LEVEL = '0';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // Increase body size limits to accept base64 audio data URLs
  app.use(json({ limit: process.env.BODY_LIMIT || '25mb' }));
  app.use(
    urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '25mb' }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
