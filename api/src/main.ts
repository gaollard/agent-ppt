import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createFileLogger } from './log/file-logger';
import { resolveLogDir } from './log/resolve-log-dir';

async function bootstrap() {
  const logger = createFileLogger(resolveLogDir());
  Logger.overrideLogger(logger);

  const app = await NestFactory.create(AppModule, { logger });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  logger.log(`ppt-agent listening on http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
