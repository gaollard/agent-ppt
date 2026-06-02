import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import PptxGenJS from 'pptxgenjs';
import {
  mergeTheme,
  PresentationContent,
} from '../ai/types/slide-content';
import { renderSlide } from './layouts';

@Injectable()
export class PptService {
  constructor(private readonly config: ConfigService) {}

  async saveBuffer(buffer: Buffer, filename: string): Promise<string> {
    const dir =
      this.config.get<string>('output_dir') ?? join(process.cwd(), 'output');
    await mkdir(dir, { recursive: true });

    const safeName =
      filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_') ||
      'presentation.pptx';
    const filePath = resolve(join(dir, `${this.timestamp()}_${safeName}`));
    await writeFile(filePath, buffer);
    return filePath;
  }

  async buildBuffer(content: PresentationContent): Promise<Buffer> {
    const pptx = new PptxGenJS();
    pptx.author = 'ppt-agent';
    pptx.title = content.title;
    pptx.layout = 'LAYOUT_16x9';

    const theme = mergeTheme(content.theme);

    for (const [index, slide] of content.slides.entries()) {
      const page = pptx.addSlide();
      renderSlide({ pptx, slide, page, index, theme });
    }

    const output = await pptx.write({ outputType: 'nodebuffer' });
    return output as Buffer;
  }

  private timestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }
}
