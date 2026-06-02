import PptxGenJS from 'pptxgenjs';
import {
  PresentationTheme,
  SlideContent,
  SlideLayout,
} from '../../ai/types/slide-content';

export interface LayoutContext {
  pptx: PptxGenJS;
  slide: SlideContent;
  page: PptxGenJS.Slide;
  index: number;
  theme: PresentationTheme;
}

export function addBullets(
  page: PptxGenJS.Slide,
  bullets: string[],
  box: { x: number; y: number; w: number; h: number },
  color: string,
): void {
  if (!bullets.length) return;
  page.addText(
    bullets.map((b) => ({ text: b, options: { bullet: true } })),
    {
      ...box,
      fontSize: 14,
      color,
      valign: 'top',
      breakLine: false,
      fit: 'shrink',
      paraSpaceAfter: 10,
      margin: 2,
    },
  );
}

export function addImageIfPresent(
  page: PptxGenJS.Slide,
  imagePath: string | undefined,
  box: { x: number; y: number; w: number; h: number },
  rounding = false,
): void {
  if (!imagePath) return;
  page.addImage({ path: imagePath, ...box, rounding });
}

const IMAGE_LAYOUTS: SlideLayout[] = [
  'image-left',
  'image-right',
  'full-image',
];

export function effectiveLayout(ctx: LayoutContext): SlideLayout {
  const { slide, index } = ctx;
  const layout = slide.layout ?? (index === 0 ? 'cover' : 'title-bullets');

  if (IMAGE_LAYOUTS.includes(layout) && !slide.imagePath && layout !== 'cover') {
    return 'title-bullets';
  }

  if (layout === 'chart') {
    const chart = slide.chart;
    if (
      !chart?.values?.length ||
      !chart.labels?.length ||
      chart.values.length !== chart.labels.length
    ) {
      return 'title-bullets';
    }
  }

  if (layout === 'two-column' && !slide.columnB?.bullets?.length) {
    return 'title-bullets';
  }

  return layout;
}
