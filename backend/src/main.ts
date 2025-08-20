import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
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
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ];
  if (process.env.FRONTEND_ORIGIN) origins.push(process.env.FRONTEND_ORIGIN);
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  app.use(cookieParser(process.env.COOKIE_SECRET || 'dev_cookie_secret'));
  // Increase body size limits to accept base64 audio data URLs
  app.use(json({ limit: process.env.BODY_LIMIT || '25mb' }));
  app.use(
    urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '25mb' }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
