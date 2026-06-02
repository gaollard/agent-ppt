import { SlideLayout } from '../../ai/types/slide-content';
import { renderChart } from './chart.layout';
import { renderCover } from './cover.layout';
import { renderFullImage } from './full-image.layout';
import { effectiveLayout, LayoutContext } from './helpers';
import { renderImageLeft, renderImageRight } from './image-side.layout';
import { renderTitleBullets } from './title-bullets.layout';
import { renderTwoColumn } from './two-column.layout';

const renderers: Record<SlideLayout, (ctx: LayoutContext) => void> = {
  cover: renderCover,
  'title-bullets': renderTitleBullets,
  'image-left': renderImageLeft,
  'image-right': renderImageRight,
  'full-image': renderFullImage,
  'two-column': renderTwoColumn,
  chart: renderChart,
};

export function renderSlide(ctx: LayoutContext): void {
  const layout = effectiveLayout(ctx);
  const fn = renderers[layout] ?? renderTitleBullets;
  fn(ctx);
}

export type { LayoutContext } from './helpers';
