import type { ElementStyle, PresentationTheme } from './presentation';

export type ShapeKind =
  | 'rect'
  | 'roundRect'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'line'
  | 'arrow';

export interface ShapeCatalogItem {
  kind: ShapeKind;
  label: string;
}

export const SHAPE_CATALOG: ShapeCatalogItem[] = [
  { kind: 'rect', label: '矩形' },
  { kind: 'roundRect', label: '圆角矩形' },
  { kind: 'ellipse', label: '椭圆' },
  { kind: 'triangle', label: '三角形' },
  { kind: 'diamond', label: '菱形' },
  { kind: 'line', label: '直线' },
  { kind: 'arrow', label: '箭头' },
];

export interface ShapeToolOptions {
  kind: ShapeKind;
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  keepDrawing?: boolean;
}

export function shapeLabel(kind: ShapeKind): string {
  return SHAPE_CATALOG.find((s) => s.kind === kind)?.label ?? kind;
}

export function isLineLikeShape(kind: ShapeKind | undefined): boolean {
  return kind === 'line' || kind === 'arrow';
}

export function defaultShapeStyle(
  kind: ShapeKind,
  theme: PresentationTheme,
  overrides?: Partial<ElementStyle>,
): ElementStyle {
  const line = isLineLikeShape(kind);
  return {
    shapeKind: kind,
    fill: line ? undefined : theme.accent,
    borderColor: theme.primary,
    borderWidth: line ? 2 : 1,
    opacity: 1,
    ...overrides,
  };
}
