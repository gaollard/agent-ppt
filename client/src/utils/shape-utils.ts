import type { CSSProperties } from 'react';
import type { ElementStyle, PresentationTheme } from '../types/presentation';
import { isLineLikeShape, type ShapeKind } from '../types/shapes';

export function boundsFromShapeDrag(
  kind: ShapeKind,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  minSize = 4,
): { x: number; y: number; w: number; h: number; rotation?: number } {
  if (isLineLikeShape(kind)) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const length = Math.max(len, minSize);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return {
      x: x1,
      y: y1,
      w: length,
      h: 0.35,
      rotation: angle,
    };
  }

  let x = Math.min(x1, x2);
  let y = Math.min(y1, y2);
  let w = Math.abs(x2 - x1);
  let h = Math.abs(y2 - y1);

  if (w < 1 && h < 1) {
    w = minSize;
    h = minSize;
    x = Math.max(0, Math.min(x1 - minSize / 2, 100 - minSize));
    y = Math.max(0, Math.min(y1 - minSize / 2, 100 - minSize));
  } else {
    w = Math.max(w, 2);
    h = Math.max(h, 2);
    x = Math.max(0, Math.min(x, 100 - w));
    y = Math.max(0, Math.min(y, 100 - h));
  }

  return { x, y, w, h };
}

export function getShapeClassName(kind: ShapeKind | undefined): string {
  return `freeform-el--shape-${kind ?? 'rect'}`;
}

export function getShapeSurfaceStyle(
  kind: ShapeKind | undefined,
  style: ElementStyle | undefined,
  theme: PresentationTheme,
): CSSProperties {
  const k = kind ?? 'rect';
  const fill = style?.fill ?? theme.accent;
  const borderColor = style?.borderColor ?? theme.primary;
  const borderWidth = style?.borderWidth ?? (isLineLikeShape(k) ? 2 : 1);
  const opacity = style?.opacity ?? 1;

  if (isLineLikeShape(k)) {
    return {
      background: 'transparent',
      border: 'none',
      opacity,
      overflow: 'visible',
    };
  }

  const base: CSSProperties = {
    opacity,
    border: `${borderWidth}px solid #${borderColor}`,
    background: `#${fill}`,
  };

  switch (k) {
    case 'ellipse':
      return { ...base, borderRadius: '50%' };
    case 'roundRect':
      return { ...base, borderRadius: '16%' };
    case 'triangle':
      return {
        opacity,
        backgroundColor: `#${fill}`,
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        border: 'none',
      };
    case 'diamond':
      return {
        opacity,
        backgroundColor: `#${fill}`,
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        border: 'none',
      };
    default:
      return { ...base, borderRadius: '2px' };
  }
}

export function pptxShapeName(kind: ShapeKind | undefined): string {
  switch (kind) {
    case 'ellipse':
      return 'ellipse';
    case 'roundRect':
      return 'roundRect';
    case 'triangle':
      return 'triangle';
    case 'diamond':
      return 'diamond';
    case 'line':
    case 'arrow':
      return 'line';
    default:
      return 'rect';
  }
}
