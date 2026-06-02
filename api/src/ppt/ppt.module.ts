import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ImageModule } from '../image/image.module';
import { PptController } from './ppt.controller';
import { PptService } from './ppt.service';

@Module({
  imports: [AiModule, ImageModule],
  controllers: [PptController],
  providers: [PptService],
})
export class PptModule {}
