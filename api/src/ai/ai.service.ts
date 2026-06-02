import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  parseOutline,
  PresentationOutline,
} from './types/presentation-outline';
import {
  normalizeContent,
  PresentationContent,
} from './types/slide-content';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService) {}

  async generateContent(
    topic: string,
    slideCount: number,
  ): Promise<PresentationContent> {
    const outline = await this.generateOutline(topic, slideCount);
    this.logger.debug(JSON.stringify(outline, null, 2));
    const draft = await this.generateSlidesFromOutline(
      topic,
      slideCount,
      outline,
    );
    this.logger.debug(JSON.stringify(draft, null, 2));
    const polished = await this.polishContent(topic, draft);
    this.logger.debug(JSON.stringify(polished, null, 2));
    return polished;
  }

  private async generateOutline(
    topic: string,
    slideCount: number,
  ): Promise<PresentationOutline> {
    this.logger.log(`generateOutline topic="${topic}" slideCount=${slideCount}`);
    const prompt = `Create a detailed ${slideCount}-slide presentation outline for "${topic}".

Return JSON:
{
  "title": "presentation title",
  "slides": [
    {
      "title": "slide title",
      "purpose": "what this slide should convey to the audience",
      "keyPoints": ["specific fact or argument 1", "specific fact 2", "specific fact 3"],
      "suggestedLayout": "cover|title-bullets|image-left|image-right|full-image|two-column|chart"
    }
  ]
}

Rules:
- Exactly ${slideCount} slides.
- Slide 1: suggestedLayout=cover.
- Last slide: suggestedLayout=full-image (summary / call to action).
- Include at least one two-column slide for comparisons and one chart slide if the topic has numeric trends.
- keyPoints: 4-6 items per slide with concrete details (numbers, names, dates, examples) — not vague placeholders.
- Use the same language as the topic.
- Cover the topic in depth: background, core concepts, cases/data, challenges, outlook.`;

    const raw = await this.callLlm(
      'You are a senior presentation strategist. Respond with valid JSON only.',
      prompt,
      0.5,
    );
    try {
      return parseOutline(raw);
    } catch {
      throw new InternalServerErrorException(
        'Failed to parse LLM outline response',
      );
    }
  }

  private async generateSlidesFromOutline(
    topic: string,
    slideCount: number,
    outline: PresentationOutline,
  ): Promise<PresentationContent> {
    const prompt = `Expand the following outline into a complete ${slideCount}-slide presentation JSON for topic "${topic}".

Outline:
${JSON.stringify(outline, null, 2)}

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
- Follow suggestedLayout from the outline when appropriate.
- Slide 1: layout=cover, include imagePrompt for background.
- At least 40% of content slides use image-left or image-right with imagePrompt.
- Comparison slides: layout=two-column with columnB (3-4 bullets per column).
- Numeric trends: layout=chart with realistic chart data.
- Closing slide: layout=full-image with imagePrompt.
- Other content slides: layout=title-bullets or image-left/image-right.

Content rules:
- Each content slide: 4-6 bullet points, each 20-50 words with specifics (data, examples, actionable insight).
- Do NOT use generic filler like "important point" or "key takeaway" without substance.
- imagePrompt: concise visual description, no text/words in the image.
- Use the same language as the topic.
- Exactly ${slideCount} slides in the slides array.`;

    const raw = await this.callLlm(
      'You are a professional presentation writer. Always respond with valid JSON only.',
      prompt,
      0.7,
    );
    return this.parseContent(raw);
  }

  private async polishContent(
    topic: string,
    content: PresentationContent,
  ): Promise<PresentationContent> {
    const prompt = `Polish this presentation about "${topic}" for depth and consistency.

Current JSON:
${JSON.stringify(content, null, 2)}

Return the SAME JSON shape with these improvements:
- Keep the same number of slides and layouts.
- Enrich bullets: add missing specifics (numbers, names, comparisons), merge duplicates, ensure each bullet teaches something new.
- Ensure two-column slides have balanced, substantive bullets in both columns.
- Ensure chart slides have plausible labels/values aligned with the topic.
- Improve imagePrompt descriptions to be vivid and layout-appropriate.
- Titles should be clear and engaging, not generic.

Respond with valid JSON only.`;

    const raw = await this.callLlm(
      'You are a presentation editor. Improve content quality without changing structure. Respond with valid JSON only.',
      prompt,
      0.4,
    );
    return this.parseContent(raw);
  }

  private async callLlm(
    systemContent: string,
    userContent: string,
    temperature: number,
  ): Promise<string> {
    const apiKey = this.config.get<string>('llm_api_key');
    const baseUrl = this.config.get<string>('llm_base_url');
    const model = this.config.get<string>('llm_model');

    if (!apiKey || !baseUrl || !model) {
      throw new BadRequestException(
        'llm_api_key or llm_base_url is not configured in dev.config.yaml',
      );
    }

    try {
      const { data } = await axios.post(
        `${baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          model,
          temperature,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: userContent },
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
      return raw;
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
