import { addBullets, LayoutContext } from './helpers';
import { SlideElement, TableCellData } from '../../ai/types/slide-content';

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

function normalizeCell(cell: string | TableCellData): TableCellData {
  if (typeof cell === 'string') return { text: cell };
  return { ...cell, text: cell.text ?? '' };
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

    if (el.type === 'table' && el.table?.cells?.length) {
      const rows = el.table.cells.map((row) =>
        row
          .map((raw) => {
            const cell = normalizeCell(raw);
            if (cell.colspan === 0) return null;
            const cs = cell.style ?? {};
            return {
              text: cell.text || '',
              options: {
                fontSize: cs.fontSize ?? style.fontSize ?? 11,
                color: cs.color ?? style.color ?? theme.text,
                align: cs.align ?? style.align ?? 'center',
                valign: 'middle' as const,
                bold: cs.fontWeight === 'bold',
                italic: cs.fontStyle === 'italic',
                underline: cs.underline ? { style: 'sng' as const } : undefined,
                strike: cs.strikethrough ? 'sngStrike' as const : undefined,
                fontFace: cs.fontFamily && cs.fontFamily !== 'inherit' ? cs.fontFamily : undefined,
                fill: cs.background ? { color: cs.background } : undefined,
                colspan: cell.colspan && cell.colspan > 1 ? cell.colspan : undefined,
                rowspan: cell.rowspan && cell.rowspan > 1 ? cell.rowspan : undefined,
              },
            };
          })
          .filter((cell): cell is NonNullable<typeof cell> => cell !== null),
      );
      page.addTable(rows, {
        ...box,
        border: {
          type: 'solid',
          color: style.borderColor ?? 'CBD5E1',
          pt: style.borderWidth ?? 1,
        },
      });
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
