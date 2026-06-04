import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { PresentationTheme, SlideContent, SlideElement } from '../../types/presentation';
import {
  clamp,
  createImageElement,
  createShapeElement,
  createTableElement,
  createTextElement,
} from '../../utils/slide-elements';
import { snap, alignElements, groupElements, getElementsBounds, expandGroupSelection, isSelectableElement, withTopZIndex } from '../../utils/editor-utils';
import { SelectionToolbar } from './SelectionToolbar';
import { TableToolbar } from './TableToolbar';
import {
  cellStyleToCss,
  cellText,
  isCellVisible,
  normalizeCell,
  patchCellText,
} from '../../utils/table-utils';
import type { TableData } from '../../types/presentation';
import './freeform.css';
import './table-toolbar.css';

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

interface Props {
  slide: SlideContent;
  theme: PresentationTheme;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onCommit?: (slide: SlideContent) => void;
  readOnly?: boolean;
  snapToGrid?: boolean;
  zoom?: number;
  hideToolbar?: boolean;
  shapeTool?: 'rect' | 'ellipse' | null;
  onShapeToolChange?: (tool: 'rect' | 'ellipse' | null) => void;
}

export interface FreeformCanvasHandle {
  addTextBox: () => void;
  addImageBox: () => void;
  addTable: (rows: number, cols: number) => void;
  bringForward: () => void;
  sendBackward: () => void;
}

interface DragState {
  kind: 'move' | 'resize' | 'multi-move';
  id: string;
  startX: number;
  startY: number;
  orig: SlideElement;
  origins?: Record<string, SlideElement>;
  moveIds?: string[];
  handle?: ResizeHandle;
  pointerId: number;
}

interface ShapeDrawState {
  kind: 'rect' | 'ellipse';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pointerId: number;
}

interface MarqueeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pointerId: number;
  showMenu: boolean;
}

interface SelectionMenuState {
  visible: boolean;
  left: number;
  top: number;
}

interface PendingTableDrag {
  el: SlideElement;
  pointerId: number;
  startX: number;
  startY: number;
}

const TABLE_DRAG_THRESHOLD = 4;

function clientToCanvasPct(clientX: number, clientY: number, canvas: HTMLDivElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

function rectFromPoints(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
  };
}

function rectsIntersect(
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

function rectFromDrag(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  minSize = 4,
): { x: number; y: number; w: number; h: number } {
  let x = Math.min(x1, x2);
  let y = Math.min(y1, y2);
  let w = Math.abs(x2 - x1);
  let h = Math.abs(y2 - y1);

  if (w < 1 && h < 1) {
    w = minSize;
    h = minSize;
    x = clamp(x1 - minSize / 2, 0, 100 - minSize);
    y = clamp(y1 - minSize / 2, 0, 100 - minSize);
  } else {
    w = Math.max(w, 2);
    h = Math.max(h, 2);
    x = clamp(x, 0, 100 - w);
    y = clamp(y, 0, 100 - h);
  }

  return { x, y, w, h };
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
  return el.rotation ? `rotate(${el.rotation}deg)` : undefined;
}

function sortElements(els: SlideElement[]) {
  return [...els].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

const CanvasElement = memo(function CanvasElement({
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
}: {
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
}) {
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
    return (
      <div
        className={`freeform-el freeform-el--shape ${selected ? 'freeform-el--selected' : ''} ${el.locked ? 'freeform-el--locked' : ''}`}
        style={{
          ...commonStyle,
          background: s.fill ? `#${s.fill}` : `#${theme.accent}`,
          border: `${s.borderWidth ?? 1}px solid #${s.borderColor ?? theme.primary}`,
          borderRadius: s.shapeKind === 'ellipse' ? '50%' : '6px',
          opacity: s.opacity ?? 1,
        }}
        onPointerDown={(e) => onStartDrag(e)}
      >
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

export const FreeformCanvas = forwardRef<FreeformCanvasHandle, Props>(function FreeformCanvas(
  {
    slide,
    theme,
    selectedIds,
    onSelect,
    onCommit,
    readOnly = false,
    snapToGrid = false,
    zoom = 100,
    hideToolbar = false,
    shapeTool = null,
    onShapeToolChange,
  },
  ref,
) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const pendingTableDragRef = useRef<PendingTableDrag | null>(null);
  const shapeDrawRef = useRef<ShapeDrawState | null>(null);
  const marqueeRef = useRef<MarqueeState | null>(null);
  const movedRef = useRef(false);
  const snapRef = useRef(snapToGrid);
  const slideRef = useRef(slide);
  const onCommitRef = useRef(onCommit);
  const shapeToolRef = useRef(shapeTool);
  const onShapeToolChangeRef = useRef(onShapeToolChange);
  const selectedIdsRef = useRef(selectedIds);
  const editingCellRef = useRef<{ elId: string; row: number; col: number } | null>(null);

  const [localElements, setLocalElements] = useState<SlideElement[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ elId: string; row: number; col: number } | null>(
    null,
  );
  const [activeTableCell, setActiveTableCell] = useState<{
    elId: string;
    row: number;
    col: number;
  } | null>(null);
  const [tableToolbarAnchor, setTableToolbarAnchor] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [shapePreview, setShapePreview] = useState<Omit<ShapeDrawState, 'pointerId'> | null>(
    null,
  );
  const [marqueePreview, setMarqueePreview] = useState<Omit<MarqueeState, 'pointerId' | 'showMenu'> | null>(
    null,
  );
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuState | null>(null);

  slideRef.current = slide;
  snapRef.current = snapToGrid;
  onCommitRef.current = onCommit;
  shapeToolRef.current = shapeTool;
  onShapeToolChangeRef.current = onShapeToolChange;
  selectedIdsRef.current = selectedIds;
  editingCellRef.current = editingCell;

  useEffect(() => {
    if (!shapeTool) return;
    setEditingId(null);
    setEditingCell(null);
    setSelectionMenu(null);
  }, [shapeTool]);

  const selectedSet = new Set(selectedIds);

  const baseElements = sortElements(slide.elements ?? []);
  const elements = localElements ?? baseElements;

  const bgColor = slide.backgroundColor ?? theme.background;
  const bgImage = slide.backgroundImage;

  const applySnap = (v: number) => (snapRef.current ? snap(v, 2) : v);

  const commitElements = useCallback((next: SlideElement[]) => {
    onCommitRef.current?.({ ...slideRef.current, elements: next });
  }, []);

  const patchDuringDrag = useCallback((id: string, patch: Partial<SlideElement>) => {
    setLocalElements((prev) => {
      const base = prev ?? sortElements(slideRef.current.elements ?? []);
      return base.map((el) => (el.id === id ? { ...el, ...patch } : el));
    });
  }, []);

  const patchMultipleDuringDrag = useCallback(
    (ids: string[], origins: Record<string, SlideElement>, dx: number, dy: number) => {
      setLocalElements((prev) => {
        const base = prev ?? sortElements(slideRef.current.elements ?? []);
        return base.map((el) => {
          if (!ids.includes(el.id)) return el;
          const o = origins[el.id];
          if (!o) return el;
          return {
            ...el,
            x: applySnap(clamp(o.x + dx, 0, 100 - o.w)),
            y: applySnap(clamp(o.y + dy, 0, 100 - o.h)),
          };
        });
      });
    },
    [],
  );

  const releaseCapture = (pointerId: number) => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.releasePointerCapture(pointerId);
    } catch {
      /* already released */
    }
  };

  const finishShapeDraw = useCallback(() => {
    const draw = shapeDrawRef.current;
    shapeDrawRef.current = null;
    setShapePreview(null);

    if (!draw) return;
    releaseCapture(draw.pointerId);

    let { x, y, w, h } = rectFromDrag(
      draw.startX,
      draw.startY,
      draw.currentX,
      draw.currentY,
    );
    if (snapRef.current) {
      x = snap(x, 2);
      y = snap(y, 2);
      w = snap(w, 2);
      h = snap(h, 2);
      x = clamp(x, 0, 100 - w);
      y = clamp(y, 0, 100 - h);
    }

    const base = sortElements(slideRef.current.elements ?? []);
    const el = withTopZIndex(createShapeElement(draw.kind, { x, y, w, h }), base);
    onCommitRef.current?.({ ...slideRef.current, elements: [...base, el] });
    onSelect([el.id]);
    onShapeToolChangeRef.current?.(null);
  }, [onSelect]);

  const finishMarquee = useCallback(() => {
    const marquee = marqueeRef.current;
    marqueeRef.current = null;
    setMarqueePreview(null);

    if (!marquee) return;
    releaseCapture(marquee.pointerId);

    const box = rectFromPoints(
      marquee.startX,
      marquee.startY,
      marquee.currentX,
      marquee.currentY,
    );

    if (box.w < 1 && box.h < 1) {
      onSelect([]);
      return;
    }

    const hits = sortElements(slideRef.current.elements ?? [])
      .filter((el) => {
        if (!isSelectableElement(el)) return false;
        return rectsIntersect(box.x, box.y, box.w, box.h, el.x, el.y, el.w, el.h);
      })
      .map((el) => el.id);

    onSelect(hits);

    if (marquee.showMenu && hits.length >= 2) {
      const bounds = getElementsBounds(slideRef.current.elements ?? [], hits);
      if (bounds) {
        setSelectionMenu({ visible: true, left: bounds.centerX, top: bounds.maxY });
      }
    } else if (!marquee.showMenu || hits.length < 2) {
      setSelectionMenu(null);
    }
  }, [onSelect]);

  const cancelMarquee = useCallback(() => {
    const marquee = marqueeRef.current;
    marqueeRef.current = null;
    setMarqueePreview(null);
    if (marquee) releaseCapture(marquee.pointerId);
  }, []);

  const cancelShapeDraw = useCallback(() => {
    const draw = shapeDrawRef.current;
    shapeDrawRef.current = null;
    setShapePreview(null);
    if (draw) releaseCapture(draw.pointerId);
  }, []);

  const endDrag = useCallback(() => {
    pendingTableDragRef.current = null;

    if (shapeDrawRef.current) {
      finishShapeDraw();
      return;
    }

    if (marqueeRef.current) {
      finishMarquee();
      return;
    }

    const drag = dragRef.current;
    dragRef.current = null;
    setDraggingId(null);

    setLocalElements((prev) => {
      if (prev && movedRef.current) {
        onCommitRef.current?.({ ...slideRef.current, elements: prev });
      }
      return null;
    });

    if (drag) releaseCapture(drag.pointerId);
  }, [finishShapeDraw, finishMarquee]);

  const beginElementDrag = useCallback(
    (
      pointer: Pick<React.PointerEvent, 'clientX' | 'clientY' | 'pointerId' | 'shiftKey'>,
      el: SlideElement,
      handle?: ResizeHandle,
    ) => {
      if (readOnly || el.locked) return;

      const currentSelected = selectedIdsRef.current;

      if (pointer.shiftKey) {
        const next = currentSelected.includes(el.id)
          ? currentSelected.filter((id) => id !== el.id)
          : [...currentSelected, el.id];
        onSelect(next);
        return;
      }

      const allElements = slideRef.current.elements ?? [];
      const groupIds = expandGroupSelection([el.id], allElements);

      if (!currentSelected.includes(el.id)) {
        onSelect(groupIds);
        setSelectionMenu(null);
      }

      const activeSelection = currentSelected.includes(el.id) ? currentSelected : groupIds;
      const moveIds =
        !handle && activeSelection.includes(el.id) && activeSelection.length > 1
          ? activeSelection.filter((id) => {
              const target = allElements.find((item) => item.id === id);
              return target && isSelectableElement(target);
            })
          : groupIds.length > 1
            ? groupIds.filter((id) => {
                const target = allElements.find((item) => item.id === id);
                return target && isSelectableElement(target);
              })
            : [el.id];

      setEditingId(null);
      setEditingCell(null);
      setDraggingId(el.id);
      movedRef.current = false;
      setLocalElements(sortElements(slideRef.current.elements ?? []));

      const isMultiMove = !handle && moveIds.length > 1;
      const origins: Record<string, SlideElement> = {};
      if (isMultiMove) {
        for (const id of moveIds) {
          const target = (slideRef.current.elements ?? []).find((item) => item.id === id);
          if (target) origins[id] = { ...target };
        }
      }

      dragRef.current = {
        kind: handle ? 'resize' : isMultiMove ? 'multi-move' : 'move',
        id: el.id,
        startX: pointer.clientX,
        startY: pointer.clientY,
        orig: { ...el },
        origins: isMultiMove ? origins : undefined,
        moveIds: isMultiMove ? moveIds : undefined,
        handle,
        pointerId: pointer.pointerId,
      };

      canvasRef.current?.setPointerCapture(pointer.pointerId);
    },
    [readOnly, onSelect],
  );

  const startDrag = (e: React.PointerEvent, el: SlideElement, handle?: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();
    beginElementDrag(e, el, handle);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const shapeDraw = shapeDrawRef.current;
      if (shapeDraw && e.pointerId === shapeDraw.pointerId) {
        const { x, y } = clientToCanvasPct(e.clientX, e.clientY, canvas);
        shapeDraw.currentX = x;
        shapeDraw.currentY = y;
        setShapePreview({
          kind: shapeDraw.kind,
          startX: shapeDraw.startX,
          startY: shapeDraw.startY,
          currentX: x,
          currentY: y,
        });
        return;
      }

      const marquee = marqueeRef.current;
      if (marquee && e.pointerId === marquee.pointerId) {
        const { x, y } = clientToCanvasPct(e.clientX, e.clientY, canvas);
        marquee.currentX = x;
        marquee.currentY = y;
        setMarqueePreview({
          startX: marquee.startX,
          startY: marquee.startY,
          currentX: x,
          currentY: y,
        });
        return;
      }

      const pendingTable = pendingTableDragRef.current;
      if (pendingTable && !dragRef.current && e.pointerId === pendingTable.pointerId) {
        const dist = Math.hypot(
          e.clientX - pendingTable.startX,
          e.clientY - pendingTable.startY,
        );
        if (dist >= TABLE_DRAG_THRESHOLD) {
          const { el, startX, startY, pointerId } = pendingTable;
          pendingTableDragRef.current = null;
          beginElementDrag({ clientX: startX, clientY: startY, pointerId, shiftKey: false }, el);
        }
        return;
      }

      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;

      movedRef.current = true;
      const rect = canvas.getBoundingClientRect();
      const dx = ((e.clientX - drag.startX) / rect.width) * 100;
      const dy = ((e.clientY - drag.startY) / rect.height) * 100;
      const o = drag.orig;

      if (drag.kind === 'multi-move' && drag.moveIds && drag.origins) {
        patchMultipleDuringDrag(drag.moveIds, drag.origins, dx, dy);
        return;
      }

      if (drag.kind === 'move') {
        patchDuringDrag(drag.id, {
          x: applySnap(clamp(o.x + dx, 0, 100 - o.w)),
          y: applySnap(clamp(o.y + dy, 0, 100 - o.h)),
        });
        return;
      }

      const handle = drag.handle ?? 'se';
      let { x, y, w, h } = o;

      if (handle.includes('e')) w = applySnap(clamp(o.w + dx, 4, 100 - o.x));
      if (handle.includes('w')) {
        const nw = applySnap(clamp(o.w - dx, 4, o.x + o.w));
        x = applySnap(o.x + o.w - nw);
        w = nw;
      }
      if (handle.includes('s')) h = applySnap(clamp(o.h + dy, 4, 100 - o.y));
      if (handle.includes('n')) {
        const nh = applySnap(clamp(o.h - dy, 4, o.y + o.h));
        y = applySnap(o.y + o.h - nh);
        h = nh;
      }

      patchDuringDrag(drag.id, {
        x: clamp(x, 0, 100 - w),
        y: clamp(y, 0, 100 - h),
        w,
        h,
      });
    },
    [patchDuringDrag, patchMultipleDuringDrag, beginElementDrag],
  );

  useEffect(() => {
    if (readOnly) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (shapeDrawRef.current) {
          cancelShapeDraw();
          return;
        }
        if (marqueeRef.current) {
          cancelMarquee();
          return;
        }
        if (shapeToolRef.current) {
          onShapeToolChangeRef.current?.(null);
          return;
        }
        if (editingCellRef.current) {
          setEditingCell(null);
          return;
        }
        setSelectionMenu(null);
        setEditingId(null);
        onSelect([]);
      }
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedIdsRef.current.length &&
        !editingId &&
        !editingCellRef.current
      ) {
        const ids = new Set(selectedIdsRef.current);
        const next = elements.filter((el) => {
          if (!ids.has(el.id)) return true;
          return el.locked;
        });
        commitElements(next);
        onSelect([]);
        setSelectionMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readOnly, editingId, elements, commitElements, onSelect, cancelShapeDraw, cancelMarquee]);

  const deleteSelectedElements = useCallback(() => {
    const ids = new Set(selectedIdsRef.current);
    const next = elements.filter((el) => !ids.has(el.id) || el.locked);
    commitElements(next);
    onSelect([]);
    setSelectionMenu(null);
  }, [elements, commitElements, onSelect]);

  const handleGroupSelected = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length < 2) return;
    commitElements(groupElements(elements, ids));
  }, [elements, commitElements]);

  const handleAlignSelected = useCallback(
    (action: 'left' | 'right' | 'top' | 'bottom') => {
      const ids = selectedIdsRef.current;
      if (ids.length < 2) return;
      commitElements(alignElements(elements, ids, action));
    },
    [elements, commitElements],
  );

  const selectedTableEl =
    selectedIds.length === 1 ? elements.find((e) => e.id === selectedIds[0]) : undefined;

  useEffect(() => {
    if (readOnly || selectedIds.length !== 1) {
      setTableToolbarAnchor(null);
      return;
    }
    const el = elements.find((item) => item.id === selectedIds[0]);
    if (!el || el.type !== 'table') {
      setTableToolbarAnchor(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setTableToolbarAnchor({
      top: rect.top + (el.y / 100) * rect.height,
      left: rect.left + (el.x / 100) * rect.width,
      width: (el.w / 100) * rect.width,
    });
  }, [readOnly, selectedIds, elements, zoom, slide]);

  const updateSelectedTable = useCallback(
    (table: TableData) => {
      const id = selectedIdsRef.current[0];
      if (!id) return;
      commitElements(
        elements.map((item) => (item.id === id ? { ...item, table } : item)),
      );
    },
    [elements, commitElements],
  );

  const tableToolbarOpen =
    !readOnly && selectedTableEl?.type === 'table' && Boolean(selectedTableEl.table);
  const tableToolbarCell =
    activeTableCell && activeTableCell.elId === selectedTableEl?.id
      ? { row: activeTableCell.row, col: activeTableCell.col }
      : { row: 0, col: 0 };

  useEffect(() => {
    if (!selectionMenu?.visible || selectedIds.length < 2) return;
    const bounds = getElementsBounds(elements, selectedIds);
    if (bounds) {
      setSelectionMenu({ visible: true, left: bounds.centerX, top: bounds.maxY });
    }
  }, [selectedIds, elements, selectionMenu?.visible]);

  const canGroupSelected =
    selectedIds.length >= 2 &&
    new Set(
      selectedIds.map((id) => elements.find((el) => el.id === id)?.groupId ?? id),
    ).size > 1;

  const addTextBox = () => {
    const el = withTopZIndex(
      createTextElement({ x: 15, y: 20, w: 40, h: 20, content: '文本框' }),
      baseElements,
    );
    commitElements([...baseElements, el]);
    onSelect([el.id]);
    setEditingId(el.id);
  };

  const addImageBox = () => {
    const el = withTopZIndex(
      createImageElement({
        x: 20,
        y: 20,
        w: 35,
        h: 45,
        imagePath: slide.imagePath ?? '',
      }),
      baseElements,
    );
    commitElements([...baseElements, el]);
    onSelect([el.id]);
  };

  const addTable = (rows: number, cols: number) => {
    const el = withTopZIndex(createTableElement(rows, cols), baseElements);
    commitElements([...baseElements, el]);
    onSelect([el.id]);
  };

  const bringForward = () => {
    const ids = selectedIdsRef.current;
    if (!ids.length) return;
    const maxZ = Math.max(...elements.map((e) => e.zIndex ?? 0), 0);
    commitElements(
      elements.map((e) => (ids.includes(e.id) ? { ...e, zIndex: maxZ + 1 } : e)),
    );
  };

  const sendBackward = () => {
    const ids = selectedIdsRef.current;
    if (!ids.length) return;
    const minZ = Math.min(...elements.map((e) => e.zIndex ?? 0), 0);
    commitElements(
      elements.map((e) => (ids.includes(e.id) ? { ...e, zIndex: minZ - 1 } : e)),
    );
  };

  useImperativeHandle(
    ref,
    () => ({
      addTextBox,
      addImageBox,
      addTable,
      bringForward,
      sendBackward,
    }),
    [baseElements, elements],
  );

  const previewRect = shapePreview
    ? rectFromDrag(
        shapePreview.startX,
        shapePreview.startY,
        shapePreview.currentX,
        shapePreview.currentY,
        2,
      )
    : null;

  const marqueeRect = marqueePreview
    ? rectFromPoints(
        marqueePreview.startX,
        marqueePreview.startY,
        marqueePreview.currentX,
        marqueePreview.currentY,
      )
    : null;

  return (
    <div className="freeform-wrap">
      {!readOnly && !hideToolbar && (
        <div className="freeform-toolbar">
          <button type="button" className="btn btn-ghost btn-sm" onClick={addTextBox}>
            + 文本
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addImageBox}>
            + 图片
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onShapeToolChange?.('rect')}
          >
            ▭ 矩形
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onShapeToolChange?.('ellipse')}
          >
            ○ 椭圆
          </button>
          <span className="freeform-toolbar-divider" />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={!selectedIds.length}
            onClick={bringForward}
          >
            上移
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={!selectedIds.length}
            onClick={sendBackward}
          >
            下移
          </button>
        </div>
      )}

      <div
        className="freeform-zoom-wrap"
        style={{ transform: readOnly ? undefined : `scale(${zoom / 100})` }}
      >
        <div
          ref={canvasRef}
          className={`freeform-canvas ${snapToGrid ? 'freeform-canvas--snap' : ''} ${draggingId ? 'freeform-canvas--dragging' : ''} ${shapeTool ? 'freeform-canvas--shape-tool' : ''} ${shapePreview ? 'freeform-canvas--drawing-shape' : ''} ${marqueePreview ? 'freeform-canvas--marquee' : ''}`}
          style={{
            background: bgImage
              ? `url(${bgImage}) center/cover no-repeat`
              : `#${bgColor}`,
          }}
          onPointerDown={(e) => {
            if (readOnly || dragRef.current || shapeDrawRef.current || marqueeRef.current) return;

            const tool = shapeToolRef.current;
            const canvas = canvasRef.current;
            if (tool && canvas) {
              e.preventDefault();
              setEditingId(null);
              setEditingCell(null);
              const { x, y } = clientToCanvasPct(e.clientX, e.clientY, canvas);
              shapeDrawRef.current = {
                kind: tool,
                startX: x,
                startY: y,
                currentX: x,
                currentY: y,
                pointerId: e.pointerId,
              };
              setShapePreview({
                kind: tool,
                startX: x,
                startY: y,
                currentX: x,
                currentY: y,
              });
              canvas.setPointerCapture(e.pointerId);
              return;
            }

            if (canvas) {
              e.preventDefault();
              const { x, y } = clientToCanvasPct(e.clientX, e.clientY, canvas);
              const showMenu = e.ctrlKey || e.metaKey;

              marqueeRef.current = {
                startX: x,
                startY: y,
                currentX: x,
                currentY: y,
                pointerId: e.pointerId,
                showMenu,
              };
              setMarqueePreview({
                startX: x,
                startY: y,
                currentX: x,
                currentY: y,
              });
              setEditingId(null);
              if (!showMenu) setSelectionMenu(null);
              canvas.setPointerCapture(e.pointerId);
            }
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={() => {
            if (shapeDrawRef.current) cancelShapeDraw();
            else if (marqueeRef.current) cancelMarquee();
            else endDrag();
          }}
        >
          {marqueeRect && (
            <div
              className="freeform-marquee"
              style={{
                left: `${marqueeRect.x}%`,
                top: `${marqueeRect.y}%`,
                width: `${marqueeRect.w}%`,
                height: `${marqueeRect.h}%`,
              }}
            />
          )}
          {previewRect && shapePreview && (
            <div
              className={`freeform-shape-preview freeform-shape-preview--${shapePreview.kind}`}
              style={{
                left: `${previewRect.x}%`,
                top: `${previewRect.y}%`,
                width: `${previewRect.w}%`,
                height: `${previewRect.h}%`,
              }}
            />
          )}
          {tableToolbarOpen && selectedTableEl?.table && tableToolbarAnchor && (
            <TableToolbar
              open
              anchor={tableToolbarAnchor}
              table={selectedTableEl.table}
              activeCell={tableToolbarCell}
              theme={theme}
              onUpdate={updateSelectedTable}
            />
          )}
          {selectionMenu?.visible && selectedIds.length >= 2 && (
            <SelectionToolbar
              left={selectionMenu.left}
              top={selectionMenu.top}
              canGroup={canGroupSelected}
              onGroup={handleGroupSelected}
              onDelete={deleteSelectedElements}
              onAlignLeft={() => handleAlignSelected('left')}
              onAlignRight={() => handleAlignSelected('right')}
              onAlignTop={() => handleAlignSelected('top')}
              onAlignBottom={() => handleAlignSelected('bottom')}
            />
          )}
          {elements.map((el) => (
            <CanvasElement
              key={el.id}
              el={el}
              theme={theme}
              selected={selectedSet.has(el.id)}
              showHandles={selectedIds.length === 1}
              readOnly={readOnly}
              editing={editingId === el.id}
              editingCell={editingCell?.elId === el.id ? { row: editingCell.row, col: editingCell.col } : null}
              activeCell={
                activeTableCell?.elId === el.id
                  ? { row: activeTableCell.row, col: activeTableCell.col }
                  : null
              }
              onStartDrag={(e, handle) => startDrag(e, el, handle)}
              onStartEdit={() => {
                onSelect([el.id]);
                setEditingId(el.id);
                setEditingCell(null);
                setActiveTableCell(null);
              }}
              onEditBlur={(content) => {
                const next = elements.map((item) =>
                  item.id === el.id ? { ...item, content } : item,
                );
                setEditingId(null);
                commitElements(next);
              }}
              onStartCellEdit={(row, col) => {
                onSelect([el.id]);
                setEditingId(null);
                setEditingCell({ elId: el.id, row, col });
                setActiveTableCell({ elId: el.id, row, col });
              }}
              onTableCellPointerDown={(row, col, e) => {
                if (!selectedSet.has(el.id)) {
                  onSelect([el.id]);
                }
                setEditingId(null);
                setActiveTableCell({ elId: el.id, row, col });
                pendingTableDragRef.current = {
                  el,
                  pointerId: e.pointerId,
                  startX: e.clientX,
                  startY: e.clientY,
                };
              }}
              onCellBlur={(row, col, value) => {
                if (!el.table) return;
                const next = elements.map((item) => {
                  if (item.id !== el.id || !item.table) return item;
                  return { ...item, table: patchCellText(item.table, row, col, value) };
                });
                setEditingCell(null);
                commitElements(next);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
