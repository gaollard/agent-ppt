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
import {
  normalizeContent,
  PresentationContent,
} from '../ai/types/slide-content';
import { ImageService } from '../image/image.service';
import { GeneratePptDto } from './dto/generate-ppt.dto';
import { PresentationContentDto } from './dto/presentation-content.dto';
import {
  embedImagesAsDataUrls,
  resolveDataUrlImages,
} from './image-utils';
import { PptService } from './ppt.service';

@Controller('ppt')
export class PptController {
  private readonly logger = new Logger(PptController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly imageService: ImageService,
    private readonly pptService: PptService,
  ) {}

  @Post('generate-content')
  async generateContent(
    @Body() dto: GeneratePptDto,
  ): Promise<PresentationContent> {
    this.logger.log(
      `generate-content topic="${dto.topic}" slideCount=${dto.slideCount}`,
    );
    let content = await this.aiService.generateContent(
      dto.topic,
      dto.slideCount,
    );
    content = await this.imageService.resolveImages(content);
    return embedImagesAsDataUrls(normalizeContent(content));
  }

  @Post('export')
  async export(
    @Body() dto: PresentationContentDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    this.logger.log(`export title="${dto.title}" slides=${dto.slides.length}`);
    const { content, tmpDir } = await resolveDataUrlImages(
      normalizeContent(dto as PresentationContent),
    );
    const buffer = await this.pptService.buildBuffer(content);
    const filename = `${this.sanitizeFilename(content.title)}.pptx`;
    const savedPath = await this.pptService.saveBuffer(buffer, filename);
    this.logger.log(`PPT exported path=${savedPath} tmpDir=${tmpDir}`);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': this.buildContentDisposition(filename),
      'X-Saved-Path': savedPath,
    });

    return new StreamableFile(buffer);
  }

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
    this.logger.log('AI content ready, resolving images…');
    content = await this.imageService.resolveImages(content);
    this.logger.log('Images resolved, building pptx…');
    const buffer = await this.pptService.buildBuffer(content);
    const filename = `${this.sanitizeFilename(content.title)}.pptx`;
    const savedPath = await this.pptService.saveBuffer(buffer, filename);
    this.logger.log(`PPT saved path=${savedPath}`);

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
