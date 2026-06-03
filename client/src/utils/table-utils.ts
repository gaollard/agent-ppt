import type { SlideElement, TableCellData, TableCellStyle, TableData } from '../types/presentation';

export function normalizeCell(cell: string | TableCellData): TableCellData {
  if (typeof cell === 'string') return { text: cell };
  return { ...cell, text: cell.text ?? '' };
}

export function normalizeTable(table: TableData): TableData {
  return {
    ...table,
    cells: table.cells.map((row) => row.map(normalizeCell)),
  };
}

export function normalizeTableElement(el: SlideElement): SlideElement {
  if (el.type !== 'table' || !el.table) return el;
  return { ...el, table: normalizeTable(el.table) };
}

export function cellText(cell: string | TableCellData): string {
  return typeof cell === 'string' ? cell : cell.text ?? '';
}

export function emptyCell(style?: TableCellStyle): TableCellData {
  return { text: '', style: style ? { ...style } : undefined };
}

export function cloneTable(table: TableData): TableData {
  return {
    ...table,
    cells: table.cells.map((row) =>
      row.map((cell) => {
        const c = normalizeCell(cell);
        return { text: c.text, style: c.style ? { ...c.style } : undefined, colspan: c.colspan, rowspan: c.rowspan };
      }),
    ),
  };
}

function defaultRowStyle(rowIdx: number, headerRow: boolean): TableCellStyle | undefined {
  if (!headerRow) return { background: 'F8FAFC' };
  if (rowIdx === 0) return { background: '2F6F66', color: 'FFFFFF', fontWeight: 'bold' as const };
  return { background: 'E8F4F3' };
}

export function insertRow(table: TableData, index: number, where: 'above' | 'below'): TableData {
  const t = normalizeTable(table);
  const at = where === 'above' ? index : index + 1;
  const newRow = Array.from({ length: t.cols }, () =>
    emptyCell(defaultRowStyle(at, Boolean(t.headerRow))),
  );
  const cells = [...t.cells];
  cells.splice(at, 0, newRow);
  return { ...t, rows: cells.length, cells };
}

export function insertCol(table: TableData, index: number, where: 'left' | 'right'): TableData {
  const t = normalizeTable(table);
  const at = where === 'left' ? index : index + 1;
  const cells = t.cells.map((row, rowIdx) => {
    const next = [...row];
    next.splice(at, 0, emptyCell(defaultRowStyle(rowIdx, Boolean(t.headerRow))));
    return next;
  });
  return { ...t, cols: cells[0]?.length ?? t.cols + 1, cells };
}

export function deleteRow(table: TableData, index: number): TableData | null {
  const t = normalizeTable(table);
  if (t.rows <= 1) return null;
  const cells = t.cells.filter((_, i) => i !== index);
  return { ...t, rows: cells.length, cells };
}

export function deleteCol(table: TableData, index: number): TableData | null {
  const t = normalizeTable(table);
  if (t.cols <= 1) return null;
  const cells = t.cells.map((row) => row.filter((_, i) => i !== index));
  return { ...t, cols: cells[0]?.length ?? 0, cells };
}

export function mergeRight(table: TableData, row: number, col: number): TableData {
  const t = normalizeTable(table);
  const cell = t.cells[row]?.[col];
  const right = t.cells[row]?.[col + 1];
  if (!cell || !right || normalizeCell(right).colspan === 0) return t;

  const left = normalizeCell(cell);
  const span = (left.colspan ?? 1) + (normalizeCell(right).colspan ?? 1);
  const cells = t.cells.map((r, ri) =>
    r.map((c, ci) => {
      if (ri !== row) return normalizeCell(c);
      if (ci === col) return { ...normalizeCell(c), colspan: span };
      if (ci === col + 1) return { ...normalizeCell(c), text: '', colspan: 0 };
      return normalizeCell(c);
    }),
  );
  return { ...t, cells };
}

export function isCellVisible(cell: TableCellData): boolean {
  return cell.colspan !== 0;
}

export function patchCellStyle(
  table: TableData,
  row: number,
  col: number,
  patch: Partial<TableCellStyle>,
  all = false,
): TableData {
  const t = normalizeTable(table);
  const cells = t.cells.map((r, ri) =>
    r.map((c, ci) => {
      const cell = normalizeCell(c);
      if (!isCellVisible(cell)) return cell;
      if (all) {
        return { ...cell, style: { ...cell.style, ...patch } };
      }
      if (ri === row && ci === col) {
        return { ...cell, style: { ...cell.style, ...patch } };
      }
      return cell;
    }),
  );
  return { ...t, cells };
}

export function patchCellText(table: TableData, row: number, col: number, text: string): TableData {
  const t = normalizeTable(table);
  const cells = t.cells.map((r, ri) =>
    r.map((c, ci) => {
      const cell = normalizeCell(c);
      if (ri === row && ci === col) return { ...cell, text };
      return cell;
    }),
  );
  return { ...t, cells };
}

export function toggleCellFlag(
  table: TableData,
  row: number,
  col: number,
  key: 'fontWeight' | 'fontStyle' | 'underline' | 'strikethrough',
): TableData {
  const t = normalizeTable(table);
  const cell = normalizeCell(t.cells[row]?.[col] ?? { text: '' });
  const style = { ...cell.style };
  if (key === 'fontWeight') {
    style.fontWeight = style.fontWeight === 'bold' ? 'normal' : 'bold';
  } else if (key === 'fontStyle') {
    style.fontStyle = style.fontStyle === 'italic' ? 'normal' : 'italic';
  } else if (key === 'underline') {
    style.underline = !style.underline;
  } else if (key === 'strikethrough') {
    style.strikethrough = !style.strikethrough;
  }
  return patchCellStyle(t, row, col, style);
}

export function applyHeaderRow(table: TableData, enabled: boolean): TableData {
  const t = normalizeTable(table);
  const cells = t.cells.map((row, rowIdx) =>
    row.map((cell) => {
      const c = normalizeCell(cell);
      const base = defaultRowStyle(rowIdx, enabled) ?? {};
      return {
        ...c,
        style: {
          ...base,
          ...c.style,
          ...(enabled && rowIdx === 0
            ? { background: '2F6F66', color: 'FFFFFF', fontWeight: 'bold' as const }
            : {}),
        },
      };
    }),
  );
  return { ...t, headerRow: enabled, cells };
}

export function cellStyleToCss(style: TableCellStyle | undefined) {
  if (!style) return {};
  const deco = [style.underline ? 'underline' : '', style.strikethrough ? 'line-through' : '']
    .filter(Boolean)
    .join(' ');
  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    color: style.color ? `#${style.color}` : undefined,
    background: style.background ? `#${style.background}` : undefined,
    textAlign: style.align,
    textDecoration: deco || undefined,
    fontFamily: style.fontFamily,
  };
}
