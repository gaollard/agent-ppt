import { addBullets, LayoutContext } from './helpers';
import { SlideElement } from '../../ai/types/slide-content';

const SLIDE_W = 10;
const SLIDE_H = 5.625;

function toInches(el: SlideElement) {
  return {
    x: (el.x / 100) * SLIDE_W,
    y: (el.y / 100) * SLIDE_H,
    w: (el.w / 100) * SLIDE_W,
    h: (el.h / 100) * SLIDE_H,
  };
}

export function renderFreeform({ slide, page, theme }: LayoutContext): void {
  page.background = { color: theme.background };

  const elements = [...(slide.elements ?? [])].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
  );

  for (const el of elements) {
    const box = toInches(el);
    const style = el.style ?? {};

    if (el.type === 'image' && el.imagePath) {
      page.addImage({ path: el.imagePath, ...box, rounding: true });
      continue;
    }

    if (el.type !== 'text') continue;

    if (style.background && el.w >= 99 && el.h >= 99) {
      page.background = { color: style.background };
      continue;
    }

    const color = style.color ?? theme.text;
    const content = el.content ?? '';

    if (style.bullets) {
      const bullets = content.split('\n').filter(Boolean);
      addBullets(page, bullets, box, color);
      continue;
    }

    page.addText(content, {
      ...box,
      fontSize: style.fontSize ?? 14,
      bold: style.fontWeight === 'bold',
      color,
      align: style.align ?? 'left',
      valign: 'top',
      fit: 'shrink',
    });
  }
}
