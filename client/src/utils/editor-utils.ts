import type { SlideElement } from '../types/presentation';

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

export function duplicateElement(el: SlideElement, offset = 3): SlideElement {
  return {
    ...el,
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    x: Math.min(el.x + offset, 100 - el.w),
    y: Math.min(el.y + offset, 100 - el.h),
    locked: false,
    table: el.table
      ? { ...el.table, cells: el.table.cells.map((row) => [...row]) }
      : undefined,
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
