// Robust .env loading: try current working dir, then project root/backends
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
const envTried: string[] = [];
const candidateEnvPaths = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'backend/.env'),
  resolve(process.cwd(), '../backend/.env'),
];
let loaded = false;
for (const p of candidateEnvPaths) {
  try {
    const r = dotenvConfig({ path: p });
    envTried.push(`${p}:${r.error ? 'err' : 'ok'}`);
    if (!r.error) {
      loaded = true;
      break;
    }
  } catch {
    envTried.push(`${p}:throw`);
  }
}
// Fallback manual parse if key still missing but file exists
import { readFileSync, existsSync, mkdirSync } from 'fs';
if (!process.env.ELEVENLABS_API_KEY) {
  for (const p of candidateEnvPaths) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, 'utf8');
        raw.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const idx = trimmed.indexOf('=');
          if (idx === -1) return;
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (!(k in process.env)) process.env[k] = v;
        });
        if (process.env.ELEVENLABS_API_KEY) {
          envTried.push(`${p}:manualLoaded`);
          break;
        }
      } catch {
        envTried.push(`${p}:manualErr`);
      }
    }
  }
}
(global as unknown as Record<string, unknown>).__ENV_DIAG = { envTried, loaded };
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { join } from 'path';

// Reduce ONNX Runtime console noise (0=verbose,1=info,2=warning,3=error,4=fatal)
if (!process.env.ORT_LOG_SEVERITY_LEVEL) {
  process.env.ORT_LOG_SEVERITY_LEVEL = '3';
}
if (!process.env.ORT_LOG_VERBOSITY_LEVEL) {
  process.env.ORT_LOG_VERBOSITY_LEVEL = '0';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  try {
    console.log(
      `[env] loaded=${loaded} tried=${envTried.join(',')} ELEVENLABS_API_KEY=$${
        process.env.ELEVENLABS_API_KEY ? 'set' : 'missing'
      } VOICE_ID=${process.env.ELEVENLABS_VOICE_ID || 'missing'}`,
    );
  } catch {
    /* ignore logging errors */
  }
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
  // Static serve uploads
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', (await import('express')).default.static(uploadsDir));
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
