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
  if (slide.backgroundImage) {
    page.background = { path: slide.backgroundImage };
  } else {
    page.background = { color: slide.backgroundColor ?? theme.background };
  }

  const elements = [...(slide.elements ?? [])].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
  );

  for (const el of elements) {
    const box = toInches(el);
    const style = el.style ?? {};
    const rotate = el.rotation ?? 0;

    if (el.type === 'shape') {
      const shapeName = style.shapeKind === 'ellipse' ? 'ellipse' : 'rect';
      page.addShape(shapeName, {
        ...box,
        fill: { color: style.fill ?? theme.accent, transparency: style.opacity ? (1 - style.opacity) * 100 : 0 },
        line: {
          color: style.borderColor ?? theme.primary,
          pt: style.borderWidth ?? 1,
        },
        rotate,
      });
      continue;
    }

    if (el.type === 'image' && el.imagePath) {
      page.addImage({ path: el.imagePath, ...box, rounding: true, rotate });
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
      rotate,
    });
  }
}
