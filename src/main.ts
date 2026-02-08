import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers - prevents XSS, clickjacking, MIME sniffing, etc.
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable for SPA - customize per needs
    }),
  );

  // Global validation pipe - strips unknown properties, throws on invalid
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Safe error handling - no internal leaks
  app.useGlobalFilters(new HttpExceptionFilter());

  // Serve frontend static files in production
  app.useStaticAssets(join(__dirname, '..', 'client-dist'), {
    index: false,
  });

  // Enable CORS for local development (API calls from frontend)
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:5173'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Shorty running at http://localhost:${port}`);
}

bootstrap();
