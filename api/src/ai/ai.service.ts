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
  SlideOutline,
} from './types/presentation-outline';
import {
  DEFAULT_THEME,
  normalizeContent,
  normalizeSlide,
  PresentationContent,
  SlideContent,
} from './types/slide-content';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService) {}

  async generateContent(
    topic: string,
    slideCount: number,
  ): Promise<PresentationContent> {
    this.logger.log(`generateContent start topic="${topic}" slideCount=${slideCount}`);
    const outline = await this.generateOutline(topic, slideCount);
    this.logger.log(`generateOutline done slides=${outline.slides.length}`);
    this.logger.debug(JSON.stringify(outline, null, 2));

    const draft = await this.expandSlidesFromOutline(
      topic,
      slideCount,
      outline,
    );
    this.logger.log(`expandSlidesFromOutline done title="${draft.title}" slides=${draft.slides.length}`);
    this.logger.debug(JSON.stringify(draft, null, 2));

    const polished = await this.polishContent(topic, draft);
    polished.theme = { ...DEFAULT_THEME };
    this.logger.log(`polishContent done slides=${polished.slides.length}`);
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
      'outline',
      'You are a senior presentation strategist. Respond with valid JSON only.',
      prompt,
      0.5,
      slideCount,
    );
    try {
      return parseOutline(raw);
    } catch {
      throw new InternalServerErrorException(
        'Failed to parse LLM outline response',
      );
    }
  }

  private async expandSlidesFromOutline(
    topic: string,
    slideCount: number,
    outline: PresentationOutline,
  ): Promise<PresentationContent> {
    const slides = await Promise.all(
      outline.slides.map(async (slideOutline, index) => {
        this.logger.log(
          `expandSlide ${index + 1}/${slideCount} title="${slideOutline.title}"`,
        );
        return this.expandSingleSlide(
          topic,
          index,
          slideCount,
          slideOutline,
        );
      }),
    );

    return normalizeContent({ title: outline.title, slides });
  }

  private async expandSingleSlide(
    topic: string,
    index: number,
    slideCount: number,
    slideOutline: SlideOutline,
  ): Promise<SlideContent> {
    const slideNo = index + 1;
    const prompt = `Expand this outline entry into ONE presentation slide JSON for topic "${topic}".
This is slide ${slideNo} of ${slideCount}.

Outline entry:
${JSON.stringify(slideOutline, null, 2)}

Return JSON with this shape:
{
  "title": "slide title",
  "layout": "cover|title-bullets|image-left|image-right|full-image|two-column|chart",
  "bullets": ["point 1", "point 2"],
  "imagePrompt": "optional visual description, no text in image",
  "columnB": { "title": "right column title", "bullets": ["point"] },
  "chart": { "type": "bar", "labels": ["2023", "2024"], "values": [10, 20] }
}

Layout rules:
- Use suggestedLayout from the outline when valid.
- Slide 1: layout=cover, include imagePrompt for background.
- Last slide: layout=full-image with imagePrompt.
- Comparison: layout=two-column with columnB (3-4 bullets per column).
- Numeric trends: layout=chart with realistic chart data.
- Content slides: prefer image-left/image-right when imagePrompt is present.

Content rules:
- 4-6 bullet points, each 20-50 words with specifics (data, examples, actionable insight).
- Do NOT use generic filler without substance.
- imagePrompt: realistic photography style, natural lighting, clean composition, no text/words in image, avoid abstract illustration style.
- Visual style: technical sharing minimalist, clean corporate look, restrained palette, avoid playful or decorative aesthetics.
- Use the same language as the topic.`;

    const raw = await this.callLlm(
      `expand-slide-${slideNo}`,
      'You are a professional presentation writer. Always respond with valid JSON only.',
      prompt,
      0.7,
      1,
    );
    return this.parseSlide(raw, index);
  }

  private parseSlide(raw: string, index: number): SlideContent {
    try {
      const parsed = JSON.parse(raw) as SlideContent | { slide: SlideContent };
      const slide =
        'slide' in parsed && parsed.slide ? parsed.slide : (parsed as SlideContent);
      if (!slide.title) {
        throw new Error('Invalid slide structure');
      }
      return normalizeSlide(slide, index);
    } catch {
      throw new InternalServerErrorException(
        `Failed to parse LLM slide response for slide ${index + 1}`,
      );
    }
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
- Keep theme technical minimalist: primary=1F2933, accent=2F6F66, background=F8FAFC, text=344054.
- Enrich bullets: add missing specifics (numbers, names, comparisons), merge duplicates, ensure each bullet teaches something new.
- Ensure two-column slides have balanced, substantive bullets in both columns.
- Ensure chart slides have plausible labels/values aligned with the topic.
- Improve imagePrompt descriptions to be realistic photo style and avoid abstract/illustration effects.
- Titles should be clear and engaging, not generic.

Respond with valid JSON only.`;

    const raw = await this.callLlm(
      'polish',
      'You are a presentation editor. Improve content quality without changing structure. Respond with valid JSON only.',
      prompt,
      0.4,
      content.slides.length,
    );
    return this.parseContent(raw);
  }

  private resolveTimeoutMs(slideCount: number): number {
    const base = this.config.get<number>('llm_timeout_ms') ?? 180_000;
    const max = this.config.get<number>('llm_timeout_max_ms') ?? 600_000;
    const perSlide = this.config.get<number>('llm_timeout_per_slide_ms') ?? 10_000;
    return Math.min(base + slideCount * perSlide, max);
  }

  private async callLlm(
    phase: string,
    systemContent: string,
    userContent: string,
    temperature: number,
    slideCount = 1,
  ): Promise<string> {
    const apiKey = this.config.get<string>('llm_api_key');
    const baseUrl = this.config.get<string>('llm_base_url');
    const model = this.config.get<string>('llm_model');

    if (!apiKey || !baseUrl || !model) {
      throw new BadRequestException(
        'llm_api_key or llm_base_url is not configured in dev.config.yaml',
      );
    }

    const timeoutMs = this.resolveTimeoutMs(slideCount);
    const startedAt = Date.now();
    this.logger.log(
      `LLM ${phase} request start model=${model} timeoutMs=${timeoutMs} slideCount=${slideCount}`,
    );

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
          timeout: timeoutMs,
        },
      );

      const raw = data.choices?.[0]?.message?.content;
      if (!raw) {
        throw new InternalServerErrorException('Empty response from LLM');
      }

      const elapsedMs = Date.now() - startedAt;
      this.logger.log(
        `LLM ${phase} request done elapsedMs=${elapsedMs} chars=${raw.length}`,
      );
      return raw;
    } catch (error) {
      const elapsedMs = Date.now() - startedAt;
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.error?.message ?? error.message;
        this.logger.error(
          `LLM ${phase} request failed elapsedMs=${elapsedMs}: ${message}`,
        );
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
