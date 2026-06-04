import type {
  PresentationContent,
  PresentationTheme,
  SlideContent,
  SlideElement,
  ElementStyle,
  TableCellData,
  SlideLayout,
} from '../types/presentation';
import type { ShapeKind } from '../types/shapes';
import { defaultShapeStyle } from '../types/shapes';

let idCounter = 0;

export function newElementId(): string {
  idCounter += 1;
  return `el-${Date.now()}-${idCounter}`;
}

export function createTextElement(
  partial: Partial<SlideElement> & Pick<SlideElement, 'x' | 'y' | 'w' | 'h'>,
): SlideElement {
  return {
    id: newElementId(),
    type: 'text',
    content: '',
    style: { fontSize: 16, color: '344054', align: 'left' },
    zIndex: 1,
    ...partial,
  };
}

export function createImageElement(
  partial: Partial<SlideElement> & Pick<SlideElement, 'x' | 'y' | 'w' | 'h'>,
): SlideElement {
  return {
    id: newElementId(),
    type: 'image',
    imagePath: '',
    zIndex: 0,
    ...partial,
  };
}

export function createTableCells(rows: number, cols: number): TableCellData[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, () => ({
      text: '',
      style: r === 0
        ? { background: '2F6F66', color: 'FFFFFF', fontWeight: 'bold' as const, align: 'center' as const }
        : { background: 'E8F4F3', align: 'center' as const },
    })),
  );
}

export function createTableElement(
  rows: number,
  cols: number,
  partial?: Partial<SlideElement>,
): SlideElement {
  const w = Math.min(cols * 10 + 4, 80);
  const h = Math.min(rows * 7 + 4, 55);
  return {
    id: newElementId(),
    type: 'table',
    x: (100 - w) / 2,
    y: (100 - h) / 2,
    w,
    h,
    table: { rows, cols, cells: createTableCells(rows, cols), headerRow: true },
    style: {
      fontSize: 12,
      color: '344054',
      align: 'center',
      borderColor: 'CBD5E1',
      borderWidth: 1,
    },
    zIndex: 1,
    ...partial,
  };
}

export function createShapeElement(
  shapeKind: ShapeKind,
  partial: Partial<SlideElement> & Pick<SlideElement, 'x' | 'y' | 'w' | 'h'>,
  theme?: PresentationTheme,
  styleOverrides?: Partial<ElementStyle>,
): SlideElement {
  const t = theme ?? { primary: '1F2933', accent: '2F6F66', background: 'F8FAFC', text: '344054' };
  return {
    id: newElementId(),
    type: 'shape',
    zIndex: 0,
    style: defaultShapeStyle(shapeKind, t, styleOverrides),
    ...partial,
  };
}

function textEl(
  x: number,
  y: number,
  w: number,
  h: number,
  content: string,
  style: ElementStyle,
  zIndex = 1,
): SlideElement {
  return { id: newElementId(), type: 'text', x, y, w, h, content, style, zIndex };
}

function imgEl(
  x: number,
  y: number,
  w: number,
  h: number,
  imagePath: string,
  zIndex = 0,
): SlideElement {
  return { id: newElementId(), type: 'image', x, y, w, h, imagePath, zIndex };
}

export function layoutToElements(
  slide: SlideContent,
  theme: PresentationTheme,
  index: number,
): SlideElement[] {
  const layout = slide.layout ?? (index === 0 ? 'cover' : 'title-bullets');
  const bulletsText = slide.bullets.filter(Boolean).join('\n');

  if (layout === 'cover') {
    const els: SlideElement[] = [];
    if (slide.imagePath) {
      els.push(imgEl(0, 0, 100, 100, slide.imagePath, 0));
      els.push({
        id: newElementId(),
        type: 'text',
        x: 5,
        y: 38,
        w: 90,
        h: 14,
        content: slide.title,
        style: {
          fontSize: 32,
          fontWeight: 'bold',
          color: 'FFFFFF',
          align: 'center',
        },
        zIndex: 2,
      });
      if (slide.bullets[0]) {
        els.push(
          textEl(10, 58, 80, 8, slide.bullets[0], {
            fontSize: 16,
            color: 'DCE3EC',
            align: 'center',
          }, 2),
        );
      }
    } else {
      els.push({
        id: newElementId(),
        type: 'text',
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        content: '',
        style: { background: theme.primary },
        zIndex: 0,
      });
      els.push(
        textEl(5, 38, 90, 14, slide.title, {
          fontSize: 32,
          fontWeight: 'bold',
          color: 'FFFFFF',
          align: 'center',
        }, 1),
      );
      if (slide.bullets[0]) {
        els.push(
          textEl(10, 58, 80, 8, slide.bullets[0], {
            fontSize: 16,
            color: 'DCE3EC',
            align: 'center',
          }, 1),
        );
      }
    }
    return els;
  }

  if (layout === 'full-image') {
    const els: SlideElement[] = [];
    if (slide.imagePath) {
      els.push(imgEl(0, 0, 100, 100, slide.imagePath));
    } else {
      els.push({
        id: newElementId(),
        type: 'text',
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        content: '',
        style: { background: theme.primary },
        zIndex: 0,
      });
    }
    els.push(
      textEl(5, 72, 90, 12, slide.title, {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'FFFFFF',
        align: 'left',
      }, 1),
    );
    if (slide.bullets[0]) {
      els.push(
        textEl(5, 84, 90, 8, slide.bullets[0], {
          fontSize: 14,
          color: 'DCE3EC',
          align: 'left',
        }, 1),
      );
    }
    return els;
  }

  if (layout === 'image-left' && slide.imagePath) {
    return [
      imgEl(4, 18, 42, 72, slide.imagePath),
      textEl(5, 6, 90, 10, slide.title, {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.primary,
      }),
      textEl(50, 20, 46, 68, bulletsText, {
        fontSize: 14,
        color: theme.text,
        bullets: true,
        background: 'FFFFFF',
      }),
    ];
  }

  if (layout === 'image-right' && slide.imagePath) {
    return [
      textEl(5, 6, 90, 10, slide.title, {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.primary,
      }),
      textEl(4, 20, 46, 68, bulletsText, {
        fontSize: 14,
        color: theme.text,
        bullets: true,
        background: 'FFFFFF',
      }),
      imgEl(52, 18, 44, 72, slide.imagePath),
    ];
  }

  if (layout === 'two-column' && slide.columnB) {
    return [
      textEl(5, 6, 90, 10, slide.title, {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.primary,
      }),
      textEl(4, 18, 44, 72, bulletsText, {
        fontSize: 14,
        color: theme.text,
        bullets: true,
        background: 'FFFFFF',
      }),
      textEl(52, 18, 44, 8, slide.columnB.title, {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.primary,
        background: 'FFFFFF',
      }),
      textEl(52, 28, 44, 62, slide.columnB.bullets.join('\n'), {
        fontSize: 14,
        color: theme.text,
        bullets: true,
        background: 'FFFFFF',
      }),
    ];
  }

  if (layout === 'chart' && slide.chart) {
    const labels = slide.chart.labels.join(' · ');
    const values = slide.chart.values.join(', ');
    return [
      textEl(5, 6, 90, 10, slide.title, {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.primary,
      }),
      textEl(8, 22, 84, 68, `${labels}\n${values}`, {
        fontSize: 14,
        color: theme.text,
        align: 'center',
        background: 'FFFFFF',
      }),
    ];
  }

  // title-bullets（新建幻灯片默认布局）
  const contentX = 8;
  const contentW = 84;
  return [
    textEl(contentX, 6, contentW, 10, slide.title, {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.primary,
    }),
    textEl(contentX, 20, contentW, 72, bulletsText, {
      fontSize: 14,
      color: theme.text,
      bullets: true,
      background: 'FFFFFF',
    }),
  ];
}

export function ensureSlideElements(
  slide: SlideContent,
  theme: PresentationTheme,
  index: number,
): SlideContent {
  if (slide.elements?.length) return slide;
  return { ...slide, elements: layoutToElements(slide, theme, index) };
}

export function applySlideLayout(
  slide: SlideContent,
  layout: SlideLayout,
  theme: PresentationTheme,
  index: number,
): SlideContent {
  const next = { ...slide, layout };
  return { ...next, elements: layoutToElements(next, theme, index) };
}

export function resetSlideFromLayout(
  slide: SlideContent,
  theme: PresentationTheme,
  index: number,
): SlideContent {
  const layout = slide.layout ?? (index === 0 ? 'cover' : 'title-bullets');
  return applySlideLayout(slide, layout, theme, index);
}

function cloneSlide(slide: SlideContent): SlideContent {
  return structuredClone(slide);
}

export { cloneSlide };

export function ensurePresentationElements(content: PresentationContent): PresentationContent {
  const theme = content.theme ?? {
    primary: '1F2933',
    accent: '2F6F66',
    background: 'F8FAFC',
    text: '344054',
  };
  return {
    ...content,
    slides: content.slides.map((s, i) => ensureSlideElements(s, theme, i)),
  };
}

export function syncSlideFromElements(slide: SlideContent): SlideContent {
  const elements = slide.elements ?? [];
  const texts = elements
    .filter((e) => e.type === 'text' && e.content && !e.style?.background)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const title = texts[0]?.content?.split('\n')[0] ?? slide.title;
  const bulletSource = texts.find((t) => t.style?.bullets);
  const bullets = bulletSource
    ? bulletSource.content!.split('\n').filter(Boolean)
    : texts.slice(1).flatMap((t) => t.content!.split('\n')).filter(Boolean);

  const imageEl = elements.find((e) => e.type === 'image' && e.imagePath);
  return {
    ...slide,
    title,
    bullets: bullets.length ? bullets : slide.bullets,
    imagePath: imageEl?.imagePath ?? slide.imagePath,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
