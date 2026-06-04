import { clamp } from '../../utils/slide-elements';
import type { SlideElement } from '../../types/presentation';

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
