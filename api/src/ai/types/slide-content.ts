export type SlideLayout =
  | 'cover'
  | 'title-bullets'
  | 'image-left'
  | 'image-right'
  | 'full-image'
  | 'two-column'
  | 'chart';

export const SLIDE_LAYOUTS: SlideLayout[] = [
  'cover',
  'title-bullets',
  'image-left',
  'image-right',
  'full-image',
  'two-column',
  'chart',
];

export interface PresentationTheme {
  primary: string;
  accent: string;
  background: string;
  text: string;
}

export interface SlideChart {
  type: 'bar' | 'line' | 'pie';
  labels: string[];
  values: number[];
}

export interface SlideColumn {
  title: string;
  bullets: string[];
}

export interface SlideContent {
  title: string;
  bullets: string[];
  layout?: SlideLayout;
  imagePrompt?: string;
  imagePath?: string;
  columnB?: SlideColumn;
  chart?: SlideChart;
  iconKeywords?: string[];
}

export interface PresentationContent {
  title: string;
  theme?: PresentationTheme;
  slides: SlideContent[];
}

export const DEFAULT_THEME: PresentationTheme = {
  primary: '1F2933',
  accent: '2F6F66',
  background: 'F8FAFC',
  text: '344054',
};

export function mergeTheme(theme?: PresentationTheme): PresentationTheme {
  return { ...DEFAULT_THEME, ...theme };
}

export function normalizeLayout(
  layout: string | undefined,
  index: number,
): SlideLayout {
  if (layout && SLIDE_LAYOUTS.includes(layout as SlideLayout)) {
    return layout as SlideLayout;
  }
  return index === 0 ? 'cover' : 'title-bullets';
}

export function normalizeSlide(slide: SlideContent, index: number): SlideContent {
  return {
    ...slide,
    title: slide.title?.trim() || `Slide ${index + 1}`,
    bullets: Array.isArray(slide.bullets) ? slide.bullets : [],
    layout: normalizeLayout(slide.layout, index),
  };
}

export function normalizeContent(content: PresentationContent): PresentationContent {
  return {
    ...content,
    theme: mergeTheme(content.theme),
    slides: content.slides.map(normalizeSlide),
  };
}
