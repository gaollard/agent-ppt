import { createPortal } from 'react-dom';
import type { PresentationTheme, TableCellStyle, TableData } from '../../types/presentation';
import {
  applyHeaderRow,
  deleteCol,
  deleteRow,
  insertCol,
  insertRow,
  mergeRight,
  normalizeCell,
  patchCellStyle,
  toggleCellFlag,
} from '../../utils/table-utils';
import './table-toolbar.css';

interface Props {
  open: boolean;
  anchor: { top: number; left: number; width: number };
  table: TableData;
  activeCell: { row: number; col: number };
  theme: PresentationTheme;
  onUpdate: (table: TableData) => void;
}

const FONT_SIZES = [10, 11, 12, 14, 16, 18, 20, 24];
const FONT_FAMILIES = [
  { label: '默认', value: 'inherit' },
  { label: '宋体', value: 'SimSun, serif' },
  { label: '黑体', value: 'SimHei, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
];

function ToolBtn({
  label,
  active,
  onClick,
  title,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={`table-toolbar-btn ${active ? 'table-toolbar-btn--active' : ''}`}
      onClick={onClick}
      title={title ?? label}
    >
      {label}
    </button>
  );
}

export function TableToolbar({ open, anchor, table, activeCell, theme, onUpdate }: Props) {
  if (!open) return null;

  const { row, col } = activeCell;
  const cell = normalizeCell(table.cells[row]?.[col] ?? { text: '' });
  const style = cell.style ?? {};

  const applyStyle = (patch: Partial<TableCellStyle>) => {
    onUpdate(patchCellStyle(table, row, col, patch));
  };

  const toolbar = (
    <div
      className="table-toolbar"
      style={{
        top: Math.max(8, anchor.top - 52),
        left: anchor.left + anchor.width / 2,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="table-toolbar-section">
        <select
          className="table-toolbar-select"
          value="row"
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'row-above') onUpdate(insertRow(table, row, 'above'));
            if (v === 'row-below') onUpdate(insertRow(table, row, 'below'));
            if (v === 'col-left') onUpdate(insertCol(table, col, 'left'));
            if (v === 'col-right') onUpdate(insertCol(table, col, 'right'));
            e.target.value = 'row';
          }}
        >
          <option value="row">插入</option>
          <option value="row-above">在上方插入行</option>
          <option value="row-below">在下方插入行</option>
          <option value="col-left">在左侧插入列</option>
          <option value="col-right">在右侧插入列</option>
        </select>
        <ToolBtn
          label="删行"
          title="删除当前行"
          onClick={() => {
            const next = deleteRow(table, row);
            if (next) onUpdate(next);
          }}
        />
        <ToolBtn
          label="删列"
          title="删除当前列"
          onClick={() => {
            const next = deleteCol(table, col);
            if (next) onUpdate(next);
          }}
        />
        <ToolBtn label="合并" title="向右合并单元格" onClick={() => onUpdate(mergeRight(table, row, col))} />
        <label className="table-toolbar-color" title="单元格背景色">
          <span className="table-toolbar-color-icon">🪣</span>
          <input
            type="color"
            value={`#${style.background ?? 'E8F4F3'}`}
            onChange={(e) => applyStyle({ background: e.target.value.replace('#', '') })}
          />
        </label>
      </div>

      <span className="table-toolbar-divider" />

      <div className="table-toolbar-section">
        <ToolBtn
          label="B"
          active={style.fontWeight === 'bold'}
          onClick={() => onUpdate(toggleCellFlag(table, row, col, 'fontWeight'))}
        />
        <ToolBtn
          label="I"
          active={style.fontStyle === 'italic'}
          onClick={() => onUpdate(toggleCellFlag(table, row, col, 'fontStyle'))}
        />
        <ToolBtn
          label="U"
          active={Boolean(style.underline)}
          onClick={() => onUpdate(toggleCellFlag(table, row, col, 'underline'))}
        />
        <ToolBtn
          label="S"
          active={Boolean(style.strikethrough)}
          onClick={() => onUpdate(toggleCellFlag(table, row, col, 'strikethrough'))}
        />
        <select
          className="table-toolbar-select table-toolbar-select--sm"
          value={style.fontSize ?? 12}
          onChange={(e) => applyStyle({ fontSize: Number(e.target.value) })}
        >
          {FONT_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}px
            </option>
          ))}
        </select>
        <select
          className="table-toolbar-select"
          value={style.fontFamily ?? 'inherit'}
          onChange={(e) => applyStyle({ fontFamily: e.target.value })}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <label className="table-toolbar-color" title="文字颜色">
          <span className="table-toolbar-color-letter" style={{ color: `#${style.color ?? theme.text}` }}>
            A
          </span>
          <input
            type="color"
            value={`#${style.color ?? theme.text}`}
            onChange={(e) => applyStyle({ color: e.target.value.replace('#', '') })}
          />
        </label>
        <select
          className="table-toolbar-select table-toolbar-select--sm"
          value={style.align ?? 'center'}
          onChange={(e) => applyStyle({ align: e.target.value as TableCellStyle['align'] })}
        >
          <option value="left">左对齐</option>
          <option value="center">居中</option>
          <option value="right">右对齐</option>
        </select>
        <label className="table-toolbar-check" title="首行表头样式">
          <input
            type="checkbox"
            checked={Boolean(table.headerRow)}
            onChange={(e) => onUpdate(applyHeaderRow(table, e.target.checked))}
          />
          表头
        </label>
      </div>
    </div>
  );

  return createPortal(toolbar, document.body);
}
