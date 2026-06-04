import { memo } from 'react';
import type { PresentationTheme, SlideElement } from '../../types/presentation';
import { isLineLikeShape, type ShapeKind } from '../../types/shapes';
import {
  cellStyleToCss,
  cellText,
  isCellVisible,
  normalizeCell,
} from '../../utils/table-utils';
import { getShapeClassName, getShapeSurfaceStyle } from '../../utils/shape-utils';

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

export interface CanvasElementProps {
  el: SlideElement;
  theme: PresentationTheme;
  selected: boolean;
  showHandles: boolean;
  readOnly: boolean;
  editing: boolean;
  editingCell: { row: number; col: number } | null;
  activeCell: { row: number; col: number } | null;
  onStartDrag: (e: React.PointerEvent, handle?: ResizeHandle) => void;
  onStartEdit: () => void;
  onEditBlur: (content: string) => void;
  onStartCellEdit: (row: number, col: number) => void;
  onCellBlur: (row: number, col: number, value: string) => void;
  onTableCellPointerDown: (row: number, col: number, e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function renderTextContent(el: SlideElement) {
  const lines = (el.content ?? '').split('\n');
  if (el.style?.bullets) {
    return (
      <ul className="freeform-text-bullets">
        {lines.filter(Boolean).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
        {!lines.filter(Boolean).length && <li>&nbsp;</li>}
      </ul>
    );
  }
  return <div className="freeform-text-plain">{el.content || '双击编辑文本'}</div>;
}

function elementTransform(el: SlideElement) {
  const parts: string[] = [];
  const sx = el.style?.flipH ? -1 : 1;
  const sy = el.style?.flipV ? -1 : 1;
  if (sx !== 1 || sy !== 1) parts.push(`scale(${sx}, ${sy})`);
  if (el.rotation) parts.push(`rotate(${el.rotation}deg)`);
  return parts.length ? parts.join(' ') : undefined;
}

export function ShapeLineVisual({
  kind,
  borderColor,
  borderWidth,
}: {
  kind: ShapeKind;
  borderColor: string;
  borderWidth: number;
}) {
  const css = {
    ['--line-color' as string]: `#${borderColor}`,
    ['--line-width' as string]: `${borderWidth}px`,
  };
  return (
    <>
      <span
        className={`freeform-shape-line-body freeform-shape-line-body--${kind}`}
        style={css}
      />
      {kind === 'arrow' && <span className="freeform-shape-line-head" style={css} />}
    </>
  );
}

export const CanvasElement = memo(function CanvasElement({
  el,
  theme,
  selected,
  showHandles,
  readOnly,
  editing,
  editingCell,
  activeCell,
  onStartDrag,
  onStartEdit,
  onEditBlur,
  onStartCellEdit,
  onCellBlur,
  onTableCellPointerDown,
  onContextMenu,
}: CanvasElementProps) {
  const isBg = el.type === 'text' && el.style?.background && el.w >= 99;
  const handles =
    showHandles && selected && !readOnly && !el.locked && !isBg
      ? (['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((h) => (
          <span
            key={h}
            className={`freeform-handle freeform-handle--${h}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartDrag(e, h);
            }}
          />
        ))
      : null;

  const commonStyle = {
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
    zIndex: el.zIndex,
    transform: elementTransform(el),
  };

  if (el.type === 'shape') {
    const s = el.style ?? {};
    const kind = s.shapeKind ?? 'rect';
    const lineLike = isLineLikeShape(kind);
    const borderColor = s.borderColor ?? theme.primary;
    const borderWidth = s.borderWidth ?? (lineLike ? 2 : 1);
    return (
      <div
        className={`freeform-el freeform-el--shape ${getShapeClassName(kind)} ${selected ? 'freeform-el--selected' : ''} ${el.locked ? 'freeform-el--locked' : ''}`}
        style={{
          ...commonStyle,
          ...getShapeSurfaceStyle(kind, s, theme),
        }}
        onPointerDown={(e) => onStartDrag(e)}
        onContextMenu={onContextMenu}
      >
        {lineLike && (
          <ShapeLineVisual kind={kind} borderColor={borderColor} borderWidth={borderWidth} />
        )}
        {el.locked && <span className="freeform-lock-badge">🔒</span>}
        {handles}
      </div>
    );
  }

  if (el.type === 'image') {
    return (
      <div
        className={`freeform-el freeform-el--image ${selected ? 'freeform-el--selected' : ''} ${el.locked ? 'freeform-el--locked' : ''}`}
        style={commonStyle}
        onPointerDown={(e) => onStartDrag(e)}
        onContextMenu={onContextMenu}
      >
        {el.imagePath ? (
          <img src={el.imagePath} alt="" draggable={false} />
        ) : (
          <div className="freeform-image-placeholder">图片</div>
        )}
        {el.locked && <span className="freeform-lock-badge">🔒</span>}
        {handles}
      </div>
    );
  }

  if (el.type === 'table' && el.table) {
    const s = el.style ?? {};
    const border = s.borderColor ?? theme.primary;
    return (
      <div
        className={`freeform-el freeform-el--table ${selected ? 'freeform-el--selected' : ''} ${el.locked ? 'freeform-el--locked' : ''}`}
        style={commonStyle}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('td')) return;
          onStartDrag(e);
        }}
        onContextMenu={onContextMenu}
      >
        <table
          className="freeform-table"
          style={{
            fontSize: s.fontSize,
            borderColor: `#${border}`,
          }}
        >
          <tbody>
            {el.table.cells.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((rawCell, colIdx) => {
                  const cell = normalizeCell(rawCell);
                  if (!isCellVisible(cell)) return null;
                  const isEditing =
                    editingCell?.row === rowIdx && editingCell?.col === colIdx;
                  const isActive =
                    activeCell?.row === rowIdx && activeCell?.col === colIdx;
                  const cellCss = cellStyleToCss(cell.style);
                  return (
                    <td
                      key={colIdx}
                      colSpan={cell.colspan && cell.colspan > 1 ? cell.colspan : undefined}
                      className={isActive ? 'freeform-table-cell--active' : undefined}
                      style={cellCss}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        if (e.button !== 0) return;
                        if (readOnly || el.locked || isEditing) return;
                        onTableCellPointerDown(rowIdx, colIdx, e);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (readOnly || el.locked || isEditing) return;
                        if (selected) onStartCellEdit(rowIdx, colIdx);
                      }}
                      onDoubleClick={(e) => {
                        if (readOnly || el.locked) return;
                        e.stopPropagation();
                        e.preventDefault();
                        onStartCellEdit(rowIdx, colIdx);
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        onContextMenu(e);
                      }}
                    >
                      {isEditing ? (
                        <input
                          key={`${rowIdx}-${colIdx}`}
                          className="freeform-table-cell-input"
                          autoFocus
                          defaultValue={cellText(cell)}
                          style={cellCss}
                          onBlur={(e) => onCellBlur(rowIdx, colIdx, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            if (e.key === 'Escape') e.currentTarget.blur();
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        cellText(cell) || '\u00a0'
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {el.locked && <span className="freeform-lock-badge">🔒</span>}
        {handles}
      </div>
    );
  }

  return (
    <div
      className={`freeform-el freeform-el--text ${selected ? 'freeform-el--selected' : ''} ${isBg ? 'freeform-el--bg' : ''} ${el.locked ? 'freeform-el--locked' : ''}`}
      style={{
        ...commonStyle,
        background: el.style?.background ? `#${el.style.background}` : undefined,
      }}
      onPointerDown={(e) => {
        if (editing) return;
        onStartDrag(e);
      }}
      onDoubleClick={(e) => {
        if (readOnly || el.locked || isBg) return;
        e.stopPropagation();
        onStartEdit();
      }}
      onContextMenu={onContextMenu}
    >
      {editing ? (
        <textarea
          className="freeform-text-editor"
          autoFocus
          defaultValue={el.content ?? ''}
          style={{
            fontSize: el.style?.fontSize,
            fontWeight: el.style?.fontWeight,
            color: el.style?.color ? `#${el.style.color}` : `#${theme.text}`,
            textAlign: el.style?.align ?? 'left',
          }}
          onBlur={(e) => onEditBlur(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="freeform-text-display"
          style={{
            fontSize: el.style?.fontSize,
            fontWeight: el.style?.fontWeight,
            color: el.style?.color ? `#${el.style.color}` : `#${theme.text}`,
            textAlign: el.style?.align ?? 'left',
          }}
        >
          {renderTextContent(el)}
        </div>
      )}
      {el.locked && <span className="freeform-lock-badge">🔒</span>}
      {handles}
    </div>
  );
});
