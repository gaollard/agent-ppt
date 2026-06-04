import type { SlideElement } from '../types/presentation';
import { cloneTable } from './table-utils';

export function isSelectableElement(el: SlideElement): boolean {
  const isBg = el.type === 'text' && el.style?.background && el.w >= 99;
  return !isBg && !el.locked;
}

export function snap(value: number, grid = 2): number {
  return Math.round(value / grid) * grid;
}

export function alignElement(
  el: SlideElement,
  action: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom',
): SlideElement {
  switch (action) {
    case 'left':
      return { ...el, x: 0 };
    case 'center-h':
      return { ...el, x: (100 - el.w) / 2 };
    case 'right':
      return { ...el, x: 100 - el.w };
    case 'top':
      return { ...el, y: 0 };
    case 'center-v':
      return { ...el, y: (100 - el.h) / 2 };
    case 'bottom':
      return { ...el, y: 100 - el.h };
    default:
      return el;
  }
}

export function alignElements(
  elements: SlideElement[],
  ids: string[],
  action: 'left' | 'right' | 'top' | 'bottom',
): SlideElement[] {
  const selected = elements.filter((el) => ids.includes(el.id));
  if (selected.length < 2) return elements;

  const minX = Math.min(...selected.map((el) => el.x));
  const maxX = Math.max(...selected.map((el) => el.x + el.w));
  const minY = Math.min(...selected.map((el) => el.y));
  const maxY = Math.max(...selected.map((el) => el.y + el.h));
  const idSet = new Set(ids);

  return elements.map((el) => {
    if (!idSet.has(el.id)) return el;
    switch (action) {
      case 'left':
        return { ...el, x: minX };
      case 'right':
        return { ...el, x: maxX - el.w };
      case 'top':
        return { ...el, y: minY };
      case 'bottom':
        return { ...el, y: maxY - el.h };
      default:
        return el;
    }
  });
}

export function groupElements(elements: SlideElement[], ids: string[]): SlideElement[] {
  if (ids.length < 2) return elements;
  const groupId = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const idSet = new Set(ids);
  return elements.map((el) => (idSet.has(el.id) ? { ...el, groupId } : el));
}

export function getElementsBounds(elements: SlideElement[], ids: string[]) {
  const selected = elements.filter((el) => ids.includes(el.id));
  if (!selected.length) return null;

  const minX = Math.min(...selected.map((el) => el.x));
  const minY = Math.min(...selected.map((el) => el.y));
  const maxX = Math.max(...selected.map((el) => el.x + el.w));
  const maxY = Math.max(...selected.map((el) => el.y + el.h));

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

export function expandGroupSelection(ids: string[], elements: SlideElement[]): string[] {
  const expanded = new Set<string>();
  for (const id of ids) {
    const el = elements.find((item) => item.id === id);
    if (el?.groupId) {
      elements.filter((item) => item.groupId === el.groupId).forEach((item) => expanded.add(item.id));
    } else {
      expanded.add(id);
    }
  }
  return [...expanded];
}

export function nextElementZIndex(elements: SlideElement[]): number {
  if (!elements.length) return 1;
  return Math.max(...elements.map((e) => e.zIndex ?? 0)) + 1;
}

export function withTopZIndex(el: SlideElement, elements: SlideElement[]): SlideElement {
  return { ...el, zIndex: nextElementZIndex(elements) };
}

export type LayerOrderAction = 'front' | 'forward' | 'backward' | 'back';

function reassignZIndex(ordered: SlideElement[]): SlideElement[] {
  return ordered.map((el, i) => ({ ...el, zIndex: i + 1 }));
}

function findLastIndex<T>(arr: T[], pred: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) return i;
  }
  return -1;
}

export function reorderElements(
  elements: SlideElement[],
  ids: string[],
  action: LayerOrderAction,
): SlideElement[] {
  if (!ids.length || !elements.length) return elements;
  const idSet = new Set(ids);
  const ordered = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  const block = ordered.filter((el) => idSet.has(el.id));
  if (!block.length) return elements;

  if (action === 'front') {
    const rest = ordered.filter((el) => !idSet.has(el.id));
    return reassignZIndex([...rest, ...block]);
  }
  if (action === 'back') {
    const rest = ordered.filter((el) => !idSet.has(el.id));
    return reassignZIndex([...block, ...rest]);
  }

  if (action === 'forward') {
    const lastIdx = findLastIndex(ordered, (el) => idSet.has(el.id));
    if (lastIdx >= ordered.length - 1) return reassignZIndex(ordered);
    const above = ordered[lastIdx + 1];
    if (idSet.has(above.id)) return reassignZIndex(ordered);
    const next = [...ordered];
    next.splice(lastIdx + 1, 1);
    const firstIdx = next.findIndex((el) => idSet.has(el.id));
    next.splice(firstIdx, 0, above);
    return reassignZIndex(next);
  }

  const firstIdx = ordered.findIndex((el) => idSet.has(el.id));
  if (firstIdx <= 0) return reassignZIndex(ordered);
  const below = ordered[firstIdx - 1];
  if (idSet.has(below.id)) return reassignZIndex(ordered);
  const next = [...ordered];
  next.splice(firstIdx - 1, 1);
  const lastIdx = findLastIndex(next, (el) => idSet.has(el.id));
  next.splice(lastIdx + 1, 0, below);
  return reassignZIndex(next);
}

export function rotateElements(
  elements: SlideElement[],
  ids: string[],
  delta: number,
): SlideElement[] {
  const idSet = new Set(ids);
  return elements.map((el) => {
    if (!idSet.has(el.id)) return el;
    const rotation = ((el.rotation ?? 0) + delta + 360) % 360;
    return { ...el, rotation: rotation || undefined };
  });
}

export function flipElements(
  elements: SlideElement[],
  ids: string[],
  axis: 'h' | 'v',
): SlideElement[] {
  const idSet = new Set(ids);
  return elements.map((el) => {
    if (!idSet.has(el.id)) return el;
    const style = { ...el.style };
    if (axis === 'h') style.flipH = !style.flipH;
    else style.flipV = !style.flipV;
    return { ...el, style };
  });
}

export function centerElementsOnPage(
  elements: SlideElement[],
  ids: string[],
  axis: 'h' | 'v' | 'both',
): SlideElement[] {
  const idSet = new Set(ids);
  return elements.map((el) => {
    if (!idSet.has(el.id)) return el;
    let next = el;
    if (axis === 'h' || axis === 'both') next = alignElement(next, 'center-h');
    if (axis === 'v' || axis === 'both') next = alignElement(next, 'center-v');
    return next;
  });
}

export function duplicateElement(
  el: SlideElement,
  offset = 3,
  zIndex?: number,
): SlideElement {
  return {
    ...el,
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    x: Math.min(el.x + offset, 100 - el.w),
    y: Math.min(el.y + offset, 100 - el.h),
    zIndex: zIndex ?? el.zIndex,
    locked: false,
    table: el.table ? cloneTable(el.table) : undefined,
  };
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
