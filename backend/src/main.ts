import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/http-exception.filter';

/**
 * Bootstraps the NestJS application.
 * Configures Helmet, exception filter, validation pipe, static assets, and starts the server.
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // HTTP security headers
  app.use(helmet());

  // Safe error handling - no internal leaks
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe - validates and sanitizes DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Reject unknown properties
      transform: true, // Auto-transform payloads to DTO types
    })
  );

  // Serve static frontend build (from backend/dist, go up to root then frontend/build)
  const frontendPath = join(__dirname, '..', '..', 'frontend', 'build');
  app.useStaticAssets(frontendPath, { index: 'index.html' });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Shorty running at http://localhost:${port}`);
}

bootstrap();
