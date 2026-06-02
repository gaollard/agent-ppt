import {
  Body,
  Controller,
  Logger,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { AiService } from '../ai/ai.service';
import { ImageService } from '../image/image.service';
import { GeneratePptDto } from './dto/generate-ppt.dto';
import { PptService } from './ppt.service';

@Controller('ppt')
export class PptController {
  private readonly logger = new Logger(PptController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly imageService: ImageService,
    private readonly pptService: PptService,
  ) {}

  @Post('generate')
  async generate(
    @Body() dto: GeneratePptDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    this.logger.log(
      `generate ppt topic="${dto.topic}" slideCount=${dto.slideCount}`,
    );
    let content = await this.aiService.generateContent(
      dto.topic,
      dto.slideCount,
    );
    content = await this.imageService.resolveImages(content);
    const buffer = await this.pptService.buildBuffer(content);
    const filename = `${this.sanitizeFilename(content.title)}.pptx`;
    const savedPath = await this.pptService.saveBuffer(buffer, filename);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': this.buildContentDisposition(filename),
      'X-Saved-Path': savedPath,
    });

    return new StreamableFile(buffer);
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^\w\u4e00-\u9fff\-]+/g, '_').slice(0, 80) || 'presentation';
  }

  private buildContentDisposition(filename: string): string {
    const asciiFallback =
      filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_') ||
      'presentation.pptx';
    return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
  }
}
