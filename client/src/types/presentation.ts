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

export const LAYOUT_LABELS: Record<SlideLayout, string> = {
  cover: '封面',
  'title-bullets': '标题 + 要点',
  'image-left': '左图右文',
  'image-right': '左文右图',
  'full-image': '全屏图片',
  'two-column': '双栏对比',
  chart: '图表',
};

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

export interface ElementStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  bullets?: boolean;
  background?: string;
  shapeKind?: 'rect' | 'roundRect' | 'ellipse' | 'triangle' | 'diamond' | 'line' | 'arrow';
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
  strikethrough?: boolean;
  flipH?: boolean;
  flipV?: boolean;
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

export type SlideElementType = 'text' | 'image' | 'shape' | 'table';

export interface TableData {
  rows: number;
  cols: number;
  cells: (string | TableCellData)[][];
  headerRow?: boolean;
}

export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  content?: string;
  style?: ElementStyle;
  imagePath?: string;
  table?: TableData;
  zIndex?: number;
  locked?: boolean;
  rotation?: number;
  groupId?: string;
}

export interface SlideContent {
  title: string;
  bullets: string[];
  layout?: SlideLayout;
  imagePrompt?: string;
  imagePath?: string;
  columnB?: SlideColumn;
  chart?: SlideChart;
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
  primary: '1F2933',
  accent: '2F6F66',
  background: 'F8FAFC',
  text: '344054',
};

export function mergeTheme(theme?: PresentationTheme): PresentationTheme {
  return { ...DEFAULT_THEME, ...theme };
}

export function createEmptySlide(index: number): SlideContent {
  return {
    title: `幻灯片 ${index + 1}`,
    bullets: ['要点 1', '要点 2'],
    layout: index === 0 ? 'cover' : 'title-bullets',
  };
}

export function createEmptyPresentation(): PresentationContent {
  return {
    title: '未命名演示',
    slides: [createEmptySlide(0)],
  };
}
