import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // Serve static files from uploads-temp directory
  app.useStaticAssets(join(process.cwd(), 'uploads-temp'), {
    prefix: '/uploads-temp/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
