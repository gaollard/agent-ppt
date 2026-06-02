import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { PresentationContent } from '../ai/types/slide-content';
import { PlaceholderProvider } from './providers/placeholder.provider';
import { WanxProvider } from './providers/wanx.provider';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly wanx: WanxProvider,
    private readonly placeholder: PlaceholderProvider,
  ) {}

  async resolveImages(content: PresentationContent): Promise<PresentationContent> {
    console.log('resolve images with content: ', content);
    const tmpDir = join(tmpdir(), 'ppt-agent-images', randomUUID());
    await mkdir(tmpDir, { recursive: true });

    await Promise.all(
      content.slides.map(async (slide, i) => {
        if (!slide.imagePrompt) return;
        try {
          slide.imagePath = await this.fetchToLocal(
            slide.imagePrompt,
            tmpDir,
            `slide-${i}.jpg`,
          );
        } catch (error) {
          this.logger.warn(
            `Image failed for slide ${i}: ${error instanceof Error ? error.message : error}`,
          );
        }
      }),
    );

    return content;
  }

  private async fetchToLocal(
    prompt: string,
    dir: string,
    filename: string,
  ): Promise<string> {
    const provider = this.config.get<string>('image_provider') ?? 'placeholder';
    const buffer = await this.generate(prompt, provider);
    const filePath = join(dir, filename);
    await writeFile(filePath, buffer);

    const { size } = await stat(filePath);
    if (size <= 0) {
      throw new Error('Generated image file is empty');
    }

    return filePath;
  }

  private async generate(prompt: string, provider: string): Promise<Buffer> {
    console.log('generate image with prompt: ', prompt, 'provider: ', provider);
    if (provider === 'wanx') {
      try {
        return await this.wanx.generate(prompt);
      } catch (error) {
        console.log('Wanx failed, falling back to placeholder: ', error);
        this.logger.warn(
          `Wanx failed, falling back to placeholder: ${error instanceof Error ? error.message : error}`,
        );
        return this.placeholder.generate(prompt);
      }
    }
    console.log('generate image with prompt: ', prompt, 'provider: ', provider, 'falling back to placeholder');
    return this.placeholder.generate(prompt);
  }
}
