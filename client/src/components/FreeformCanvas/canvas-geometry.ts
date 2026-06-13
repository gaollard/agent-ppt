import { clamp } from '../../utils/slide-elements';
import { isLayoutBackgroundElement } from '../../utils/editor-utils';
import type { SlideElement } from '../../types/presentation';

export const TEXT_BOX_PADDING_X = 24;
export const TEXT_BOX_PADDING_Y = 20;
const TEXT_HEIGHT_EPSILON = 0.05;

export function elementTransform(el: SlideElement): string | undefined {
  const parts: string[] = [];
  const sx = el.style?.flipH ? -1 : 1;
  const sy = el.style?.flipV ? -1 : 1;
  if (sx !== 1 || sy !== 1) parts.push(`scale(${sx}, ${sy})`);
  if (el.rotation) parts.push(`rotate(${el.rotation}deg)`);
  return parts.length ? parts.join(' ') : undefined;
}

export const SLIDE_INSET = 6;

export function clampElementPosition(x: number, y: number, w: number, h: number) {
  const maxX = 100 - SLIDE_INSET - w;
  const maxY = 100 - SLIDE_INSET - h;
  return {
    x: clamp(x, SLIDE_INSET, Math.max(SLIDE_INSET, maxX)),
    y: clamp(y, SLIDE_INSET, Math.max(SLIDE_INSET, maxY)),
  };
}

export function clampElementSize(
  x: number,
  y: number,
  w: number,
  h: number,
): { x: number; y: number; w: number; h: number } {
  const minW = 4;
  const minH = 4;
  const maxW = 100 - SLIDE_INSET * 2;
  const maxH = 100 - SLIDE_INSET * 2;
  let nw = clamp(w, minW, maxW);
  let nh = clamp(h, minH, maxH);
  let nx = clamp(x, SLIDE_INSET, 100 - SLIDE_INSET - nw);
  let ny = clamp(y, SLIDE_INSET, 100 - SLIDE_INSET - nh);
  if (nx + nw > 100 - SLIDE_INSET) nw = 100 - SLIDE_INSET - nx;
  if (ny + nh > 100 - SLIDE_INSET) nh = 100 - SLIDE_INSET - ny;
  return { x: nx, y: ny, w: nw, h: nh };
}

export function applyElementInsets(elements: SlideElement[]): SlideElement[] {
  return elements.map((el) => {
    if (isLayoutBackgroundElement(el)) return el;
    return { ...el, ...clampElementPosition(el.x, el.y, el.w, el.h) };
  });
}

export function elementsNeedInsetCorrection(elements: SlideElement[]): boolean {
  return elements.some((el) => {
    if (isLayoutBackgroundElement(el)) return false;
    const pos = clampElementPosition(el.x, el.y, el.w, el.h);
    return pos.x !== el.x || pos.y !== el.y;
  });
}

export function clientToCanvasPct(clientX: number, clientY: number, canvas: HTMLDivElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

export function hitElementAtPoint(elements: SlideElement[], x: number, y: number): SlideElement | null {
  const sorted = [...elements].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
  for (const el of sorted) {
    if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) return el;
  }
  return null;
}

export function rectFromPoints(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
  };
}

export function rectsIntersect(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function sortElements(els: SlideElement[]) {
  return [...els].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

function escapeMeasureHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function pxToHeightPct(px: number, canvasHeightPx: number): number {
  if (canvasHeightPx <= 0) return 4;
  return (px / canvasHeightPx) * 100;
}

export function fitTextElementHeight(
  el: SlideElement,
  contentHeightPct: number,
): { h: number; y: number } {
  const fitted = clampElementSize(el.x, el.y, el.w, contentHeightPct);
  return { h: fitted.h, y: fitted.y };
}

export function textHeightNeedsUpdate(
  el: SlideElement,
  next: { h: number; y: number },
): boolean {
  return (
    Math.abs(next.h - el.h) > TEXT_HEIGHT_EPSILON || Math.abs(next.y - el.y) > TEXT_HEIGHT_EPSILON
  );
}

export function measureTextElementHeightPct(
  el: SlideElement,
  canvasWidthPx: number,
  canvasHeightPx: number,
): number {
  if (canvasWidthPx <= 0 || canvasHeightPx <= 0) return el.h;

  const innerWidthPx = Math.max(1, (el.w / 100) * canvasWidthPx - TEXT_BOX_PADDING_X);
  const fontSize = el.style?.fontSize ?? 16;
  const fontWeight = el.style?.fontWeight ?? 'normal';
  const fontStyle = el.style?.fontStyle ?? 'normal';
  const fontFamily = el.style?.fontFamily?.trim();
  const textAlign = el.style?.align ?? 'left';
  const lineHeight = el.style?.lineHeight ?? 1.25;
  const content = el.content ?? '';

  const measureRoot = document.createElement('div');
  measureRoot.style.cssText = [
    'position:absolute',
    'left:-9999px',
    'top:0',
    'visibility:hidden',
    'pointer-events:none',
    `width:${innerWidthPx}px`,
    'box-sizing:border-box',
    `font-size:${fontSize}px`,
    `font-weight:${fontWeight}`,
    `font-style:${fontStyle}`,
    fontFamily ? `font-family:${fontFamily}` : '',
    `line-height:${lineHeight}`,
    'white-space:pre-wrap',
    'word-break:break-word',
    `text-align:${textAlign}`,
    el.style?.marginLeft ? `padding-left:${el.style.marginLeft}px` : '',
    el.style?.textIndent ? `text-indent:${el.style.textIndent}px` : '',
  ]
    .filter(Boolean)
    .join(';');

  if (el.style?.bullets) {
    const lines = content.split('\n');
    const items = lines.length ? lines : [''];
    measureRoot.innerHTML = `<ul style="margin:0;padding-left:1.2em">${items
      .map((line) => `<li style="margin-bottom:0.25em">${escapeMeasureHtml(line) || '&nbsp;'}</li>`)
      .join('')}</ul>`;
  } else {
    measureRoot.textContent = content || '双击编辑文本';
  }

  document.body.appendChild(measureRoot);
  const contentHeightPx = measureRoot.scrollHeight;
  document.body.removeChild(measureRoot);

  return pxToHeightPct(contentHeightPx + TEXT_BOX_PADDING_Y, canvasHeightPx);
}

export function measureTextEditorHeightPct(
  editorNode: HTMLElement,
  canvasHeightPx: number,
): number {
  if (canvasHeightPx <= 0) return 4;
  const displayRoot = editorNode.closest('.freeform-text-display') as HTMLElement | null;
  const target = displayRoot ?? editorNode;
  return pxToHeightPct(target.scrollHeight, canvasHeightPx);
}

export function applyTextAutoHeights(
  elements: SlideElement[],
  canvasWidthPx: number,
  canvasHeightPx: number,
): SlideElement[] {
  if (canvasWidthPx <= 0 || canvasHeightPx <= 0) return elements;

  let changed = false;
  const next = elements.map((el) => {
    if (el.type !== 'text' || isLayoutBackgroundElement(el)) return el;
    const measured = measureTextElementHeightPct(el, canvasWidthPx, canvasHeightPx);
    const fitted = fitTextElementHeight(el, measured);
    if (!textHeightNeedsUpdate(el, fitted)) return el;
    changed = true;
    return { ...el, h: fitted.h, y: fitted.y };
  });

  return changed ? next : elements;
}
