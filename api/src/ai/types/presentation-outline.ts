export interface SlideOutline {
  title: string;
  purpose: string;
  keyPoints: string[];
  suggestedLayout?: string;
}

export interface PresentationOutline {
  title: string;
  slides: SlideOutline[];
}

export function parseOutline(raw: string): PresentationOutline {
  const parsed = JSON.parse(raw) as PresentationOutline;
  if (!parsed.title || !Array.isArray(parsed.slides)) {
    throw new Error('Invalid outline structure');
  }
  return {
    title: parsed.title.trim(),
    slides: parsed.slides.map((s, i) => ({
      title: s.title?.trim() || `Slide ${i + 1}`,
      purpose: s.purpose?.trim() || '',
      keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints : [],
      suggestedLayout: s.suggestedLayout,
    })),
  };
}
