import { memo, useLayoutEffect, useRef, type RefObject } from 'react';
import { isLayoutBackgroundElement } from '../../utils/editor-utils';
import type { PresentationTheme, SlideElement } from '../../types/presentation';
import { isLineLikeShape, type ShapeKind } from '../../types/shapes';
import {
  cellStyleToCss,
  cellText,
  isCellVisible,
  normalizeCell,
} from '../../utils/table-utils';
import { getShapeClassName, getShapeSurfaceStyle } from '../../utils/shape-utils';
import { elementTextStyle } from '../../utils/text-format';
import {
  hasRichInlineText,
  parseEditorToRichText,
  richTextToEditorHtml,
  runStyleToReactCss,
} from '../../utils/rich-text';
import { elementBoxStyle } from '../TextFormat/FillBorderControls';
import { elementTransform, fitTextElementHeight, measureTextEditorHeightPct, measureTextElementHeightPct, textHeightNeedsUpdate } from './canvas-geometry';

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
export type DragHandle = ResizeHandle | 'rotate';

export interface CanvasElementProps {
  el: SlideElement;
  theme: PresentationTheme;
  selected: boolean;
  hovered: boolean;
  showHandles: boolean;
  showRotateHandle?: boolean;
  readOnly: boolean;
  editing: boolean;
  editingCell: { row: number; col: number } | null;
  activeCell: { row: number; col: number } | null;
  onStartDrag: (e: React.PointerEvent, handle?: DragHandle) => void;
  onStartEdit: () => void;
  onEditBlur: (payload: {
    content: string;
    richText?: import('../../types/presentation').RichTextContent;
    h?: number;
    y?: number;
  }) => void;
  onAutoHeight?: (patch: { h: number; y: number }) => void;
  autoHeightEnabled?: boolean;
  onStartCellEdit: (row: number, col: number) => void;
  onCellBlur: (row: number, col: number, value: string) => void;
  onTableCellPointerDown: (row: number, col: number, e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onHoverChange?: (hovered: boolean) => void;
}

function renderTextContent(el: SlideElement, theme: PresentationTheme) {
  if (el.richText?.runs?.length && hasRichInlineText(el) && !el.style?.bullets) {
    return (
      <div className={`freeform-text-plain ${el.content ? '' : 'freeform-text-placeholder'}`}>
        {el.richText.runs.map((run, i) => (
          <span key={i} style={runStyleToReactCss(run.style, theme)}>
            {run.text.split('\n').map((part, j, arr) => (
              <span key={j}>
                {part || (arr.length > 1 ? '\u00a0' : '')}
                {j < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </span>
        ))}
      </div>
    );
  }

  const lines = (el.content ?? '').split('\n');
  if (el.style?.bullets) {
    const items = lines.length ? lines : [''];
    return (
      <ul className="freeform-text-bullets">
        {items.map((line, i) => (
          <li key={i}>{line || '\u00a0'}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className={`freeform-text-plain ${el.content ? '' : 'freeform-text-placeholder'}`}>
      {el.content || '双击编辑文本'}
    </div>
  );
}

function initTextEditorContent(node: HTMLElement, el: SlideElement, theme: PresentationTheme) {
  node.innerHTML = richTextToEditorHtml(el, theme);
}

function extractTextFromEditor(node: HTMLElement): {
  content: string;
  richText?: import('../../types/presentation').RichTextContent;
} {
  return parseEditorToRichText(node, '双击编辑文本');
}

function textStyle(el: SlideElement, theme: PresentationTheme) {
  return elementTextStyle(el, theme);
}

function elementFocusRing(
  selected: boolean,
  hovered: boolean,
  readOnly: boolean,
  isBg: boolean,
) {
  if (readOnly || isBg || (!selected && !hovered)) return null;
  return (
    <span
      className={`freeform-focus-ring ${selected ? 'freeform-focus-ring--selected' : 'freeform-focus-ring--hover'}`}
      aria-hidden
    />
  );
}

function elementPointerHoverProps(onHoverChange?: (hovered: boolean) => void) {
  if (!onHoverChange) return {};
  return {
    onPointerEnter: () => onHoverChange(true),
    onPointerLeave: () => onHoverChange(false),
  };
}

function syncTextHeight(
  el: SlideElement,
  canvas: Element,
  onAutoHeight: (patch: { h: number; y: number }) => void,
  editorNode?: HTMLElement | null,
) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.height) return;
  const measuredPct = editorNode
    ? measureTextEditorHeightPct(editorNode, rect.height)
    : measureTextElementHeightPct(el, rect.width, rect.height);
  const fitted = fitTextElementHeight(el, measuredPct);
  if (textHeightNeedsUpdate(el, fitted)) {
    onAutoHeight(fitted);
  }
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
  hovered,
  showHandles,
  showRotateHandle = false,
  readOnly,
  editing,
  editingCell,
  activeCell,
  onStartDrag,
  onStartEdit,
  onEditBlur,
  onAutoHeight,
  autoHeightEnabled = true,
  onStartCellEdit,
  onCellBlur,
  onTableCellPointerDown,
  onContextMenu,
  onHoverChange,
}: CanvasElementProps) {
  const isBg = isLayoutBackgroundElement(el);
  const editRef = useRef<HTMLDivElement>(null);
  const textBoxRef = useRef<HTMLDivElement>(null);
  const hoverProps = elementPointerHoverProps(onHoverChange);
  const focusRing = elementFocusRing(selected, hovered, readOnly, isBg);

  useLayoutEffect(() => {
    if (isBg || !autoHeightEnabled || !onAutoHeight || editing) return;
    const canvas = textBoxRef.current?.closest('.freeform-canvas');
    if (!canvas) return;
    syncTextHeight(el, canvas, onAutoHeight);
  }, [
    autoHeightEnabled,
    editing,
    el.id,
    el.content,
    el.w,
    el.h,
    el.x,
    el.y,
    el.style?.fontSize,
    el.style?.fontWeight,
    el.style?.bullets,
    el.style?.align,
    el.style?.lineHeight,
    el.style?.marginLeft,
    el.richText,
    isBg,
    onAutoHeight,
  ]);

  const selectedClass = selected ? 'freeform-el--selected' : '';
  const editingClass = editing ? 'freeform-el--editing' : '';
  const showResizeHandles =
    showHandles && selected && !editing && !readOnly && !el.locked && !isBg;
  const handles = showResizeHandles
    ? (['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as ResizeHandle[]).map((h) => (
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
  const rotateHandle =
    showResizeHandles && showRotateHandle ? (
      <span
        className="freeform-handle freeform-handle--rotate"
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartDrag(e, 'rotate');
        }}
      />
    ) : null;

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
        className={`freeform-el freeform-el--shape ${getShapeClassName(kind)} ${selectedClass} ${el.locked ? 'freeform-el--locked' : ''}`}
        style={{
          ...commonStyle,
          ...getShapeSurfaceStyle(kind, s, theme),
        }}
        onPointerDown={(e) => onStartDrag(e)}
        onContextMenu={onContextMenu}
        {...hoverProps}
      >
        {lineLike && (
          <ShapeLineVisual kind={kind} borderColor={borderColor} borderWidth={borderWidth} />
        )}
        {el.locked && <span className="freeform-lock-badge">🔒</span>}
        {focusRing}
        {handles}
        {rotateHandle}
      </div>
    );
  }

  if (el.type === 'image') {
    return (
      <div
        className={`freeform-el freeform-el--image ${selectedClass} ${el.locked ? 'freeform-el--locked' : ''}`}
        style={{ ...commonStyle, ...elementBoxStyle(el.style) }}
        onPointerDown={(e) => onStartDrag(e)}
        onContextMenu={onContextMenu}
        {...hoverProps}
      >
        {el.imagePath ? (
          <img src={el.imagePath} alt="" draggable={false} />
        ) : (
          <div className="freeform-image-placeholder">图片</div>
        )}
        {el.locked && <span className="freeform-lock-badge">🔒</span>}
        {focusRing}
        {handles}
        {rotateHandle}
      </div>
    );
  }

  if (el.type === 'table' && el.table) {
    const s = el.style ?? {};
    const border = s.borderColor ?? theme.primary;
    return (
      <div
        className={`freeform-el freeform-el--table ${selectedClass} ${el.locked ? 'freeform-el--locked' : ''}`}
        style={commonStyle}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('td')) return;
          onStartDrag(e);
        }}
        onContextMenu={onContextMenu}
        {...hoverProps}
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
        {focusRing}
        {handles}
        {rotateHandle}
      </div>
    );
  }

  return (
    <div
      ref={textBoxRef}
      className={`freeform-el freeform-el--text ${selectedClass} ${editingClass} ${isBg ? 'freeform-el--bg' : ''} ${el.locked ? 'freeform-el--locked' : ''}`}
      style={{
        ...commonStyle,
        ...elementBoxStyle(el.style),
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
      {...hoverProps}
    >
      {editing ? (
        <TextEditor
          editorRef={editRef}
          el={el}
          theme={theme}
          onEditBlur={onEditBlur}
        />
      ) : (
        <div className="freeform-text-display" style={textStyle(el, theme)}>
          {renderTextContent(el, theme)}
        </div>
      )}
      {el.locked && <span className="freeform-lock-badge">🔒</span>}
      {focusRing}
      {handles}
      {rotateHandle}
    </div>
  );
});

const TextEditor = memo(function TextEditor({
  el,
  theme,
  onEditBlur,
  editorRef,
}: {
  el: SlideElement;
  theme: PresentationTheme;
  onEditBlur: (payload: {
    content: string;
    richText?: import('../../types/presentation').RichTextContent;
    h?: number;
    y?: number;
  }) => void;
  editorRef: RefObject<HTMLDivElement | null>;
}) {
  const elRef = useRef(el);
  elRef.current = el;
  const onEditBlurRef = useRef(onEditBlur);
  onEditBlurRef.current = onEditBlur;

  useLayoutEffect(() => {
    const node = editorRef.current;
    if (!node) return;
    initTextEditorContent(node, elRef.current, theme);
    node.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [el.id, editorRef, theme]);

  const commitEdit = (node: HTMLElement) => {
    const currentEl = elRef.current;
    const parsed = extractTextFromEditor(node);
    const canvas = node.closest('.freeform-canvas');
    if (!canvas) {
      onEditBlurRef.current(parsed);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    if (!rect.height) {
      onEditBlurRef.current(parsed);
      return;
    }
    const fitted = fitTextElementHeight(
      currentEl,
      measureTextEditorHeightPct(node, rect.height),
    );
    onEditBlurRef.current({ ...parsed, h: fitted.h, y: fitted.y });
  };

  return (
    <div className="freeform-text-display" style={textStyle(el, theme)}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="freeform-text-editor"
        onBlur={(e) => commitEdit(e.currentTarget)}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.currentTarget.blur();
            return;
          }
          if (e.key !== 'Enter') return;
          e.stopPropagation();
          e.preventDefault();
          if (elRef.current.style?.bullets) {
            document.execCommand('insertParagraph');
          } else {
            document.execCommand('insertLineBreak');
          }
        }}
      />
    </div>
  );
});
