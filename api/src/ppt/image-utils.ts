import { readFile, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { PresentationContent } from '../ai/types/slide-content';

export async function embedImagesAsDataUrls(
  content: PresentationContent,
): Promise<PresentationContent> {
  const slides = await Promise.all(
    content.slides.map(async (slide) => {
      if (!slide.imagePath || slide.imagePath.startsWith('data:')) {
        return slide;
      }
      const buffer = await readFile(slide.imagePath);
      const ext = slide.imagePath.endsWith('.png') ? 'png' : 'jpeg';
      return {
        ...slide,
        imagePath: `data:image/${ext};base64,${buffer.toString('base64')}`,
      };
    }),
  );
  return { ...content, slides };
}

export async function resolveDataUrlImages(
  content: PresentationContent,
): Promise<{ content: PresentationContent; tmpDir: string }> {
  const tmpDir = join(tmpdir(), 'ppt-agent-export', randomUUID());
  await mkdir(tmpDir, { recursive: true });

  const slides = await Promise.all(
    content.slides.map(async (slide, i) => {
      if (!slide.imagePath?.startsWith('data:')) {
        return slide;
      }
      const match = slide.imagePath.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) return slide;

      const ext = match[1] === 'png' ? 'png' : 'jpg';
      const filePath = join(tmpDir, `slide-${i}.${ext}`);
      await writeFile(filePath, Buffer.from(match[2], 'base64'));
      return { ...slide, imagePath: filePath };
    }),
  );

  return { content: { ...content, slides }, tmpDir };
}
