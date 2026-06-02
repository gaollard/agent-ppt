import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHash } from 'crypto';

/** 1×1 PNG fallback when remote placeholder is unavailable. */
const FALLBACK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

@Injectable()
export class PlaceholderProvider {
  async generate(prompt: string): Promise<Buffer> {
    const seed = createHash('md5').update(prompt).digest('hex').slice(0, 12);
    try {
      const { data } = await axios.get(
        `https://picsum.photos/seed/${seed}/1280/720`,
        { responseType: 'arraybuffer', timeout: 15_000, maxRedirects: 5 },
      );
      if (data.byteLength > 100) {
        return Buffer.from(data);
      }
    } catch {
      // fall through
    }
    return FALLBACK_PNG;
  }
}
