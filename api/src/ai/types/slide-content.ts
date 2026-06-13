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

export interface TextRunStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  highlight?: string;
  fontFamily?: string;
}

export interface TextRun {
  text: string;
  style?: TextRunStyle;
}

export interface RichTextContent {
  runs: TextRun[];
}

export interface ElementStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;
  highlight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  bullets?: boolean;
  lineHeight?: number;
  marginLeft?: number;
  textIndent?: number;
  background?: string;
  shapeKind?: 'rect' | 'roundRect' | 'ellipse' | 'triangle' | 'diamond' | 'line' | 'arrow';
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
}

export interface TableCellStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  background?: string;
  align?: 'left' | 'center' | 'right';
  fontFamily?: string;
}

export interface TableCellData {
  text: string;
  style?: TableCellStyle;
  colspan?: number;
  rowspan?: number;
}

export interface TableData {
  rows: number;
  cols: number;
  cells: (string | TableCellData)[][];
  headerRow?: boolean;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'table';
  x: number;
  y: number;
  w: number;
  h: number;
  content?: string;
  richText?: RichTextContent;
  style?: ElementStyle;
  imagePath?: string;
  table?: TableData;
  zIndex?: number;
  locked?: boolean;
  rotation?: number;
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
  elements?: SlideElement[];
  backgroundColor?: string;
  backgroundImage?: string;
  notes?: string;
  hidden?: boolean;
}

export interface PresentationContent {
  title: string;
  theme?: PresentationTheme;
  slides: SlideContent[];
}

export const DEFAULT_THEME: PresentationTheme = {
  primary: '1E293B',
  accent: '2563EB',
  background: 'FFFFFF',
  text: '475569',
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
