import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  normalizeContent,
  PresentationContent,
} from './types/slide-content';

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async generateContent(
    topic: string,
    slideCount: number,
  ): Promise<PresentationContent> {
    const apiKey = this.config.get<string>('llm_api_key');
    const baseUrl = this.config.get<string>('llm_base_url');
    const model = this.config.get<string>('llm_model');

    if (!apiKey || !baseUrl || !model) {
      throw new BadRequestException(
        'llm_api_key or llm_base_url is not configured in dev.config.yaml',
      );
    }

    const prompt = this.buildPrompt(topic, slideCount);

    try {
      const { data } = await axios.post(
        `${baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          model,
          temperature: 0.7,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a professional presentation writer. Always respond with valid JSON only.',
            },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120_000,
        },
      );

      const raw = data.choices?.[0]?.message?.content;
      if (!raw) {
        throw new InternalServerErrorException('Empty response from LLM');
      }

      return this.parseContent(raw);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.error?.message ?? error.message;
        throw new InternalServerErrorException(
          `LLM request failed: ${message}`,
        );
      }
      throw error;
    }
  }

  private buildPrompt(topic: string, slideCount: number): string {
    return `Create a ${slideCount}-slide presentation about "${topic}".

Return JSON with this exact shape:
{
  "title": "presentation title",
  "theme": {
    "primary": "1E3A5F",
    "accent": "3B82F6",
    "background": "F8FAFC",
    "text": "334155"
  },
  "slides": [
    {
      "title": "slide title",
      "layout": "cover",
      "bullets": ["subtitle or empty"],
      "imagePrompt": "visual description for image generation, no text in image",
      "columnB": { "title": "right column title", "bullets": ["point"] },
      "chart": { "type": "bar", "labels": ["2023", "2024"], "values": [10, 20] }
    }
  ]
}

Layout rules:
- Slide 1: layout=cover, include imagePrompt for background.
- At least 40% of content slides use image-left or image-right with imagePrompt.
- Comparison topics: layout=two-column with columnB (right column title + bullets).
- Numeric trends: layout=chart with chart object (type: bar|line|pie).
- Closing slide: layout=full-image with imagePrompt.
- Other content slides: layout=title-bullets or image-left/image-right.
- Each content slide has 3-5 concise bullet points (chart slide may have empty bullets).
- imagePrompt: concise visual description, no text/words in the image.
- Use the same language as the topic.
- Exactly ${slideCount} slides in the slides array.`;
  }

  private parseContent(raw: string): PresentationContent {
    try {
      const parsed = JSON.parse(raw) as PresentationContent;
      if (!parsed.title || !Array.isArray(parsed.slides)) {
        throw new Error('Invalid structure');
      }
      return normalizeContent(parsed);
    } catch {
      throw new InternalServerErrorException(
        'Failed to parse LLM response as presentation JSON',
      );
    }
  }
}
