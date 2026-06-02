import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { loadYamlConfig } from './config/yaml.config';
import { PptModule } from './ppt/ppt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadYamlConfig],
    }),
    AiModule,
    PptModule,
  ],
})
export class AppModule {}
