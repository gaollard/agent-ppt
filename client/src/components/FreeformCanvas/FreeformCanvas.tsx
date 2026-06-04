import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { PresentationTheme, SlideContent, SlideElement } from '../../types/presentation';
import {
  clamp,
  createImageElement,
  createShapeElement,
  createTableElement,
  createTextElement,
} from '../../utils/slide-elements';
import { snap, alignElements, groupElements, getElementsBounds, expandGroupSelection, isSelectableElement, withTopZIndex, reorderElements, rotateElements, flipElements, centerElementsOnPage, duplicateElement, nextElementZIndex } from '../../utils/editor-utils';
import { SelectionToolbar } from './SelectionToolbar';
import { TableToolbar } from './TableToolbar';
import { ShapeToolbar } from './ShapeToolbar';
import { ElementContextMenu, type ElementContextMenuState } from './ElementContextMenu';
import { CanvasElement, ShapeLineVisual, type ResizeHandle } from './CanvasElement';
import {
  clientToCanvasPct,
  hitElementAtPoint,
  rectFromPoints,
  rectsIntersect,
  sortElements,
} from './canvas-geometry';
import {
  boundsFromShapeDrag,
  getShapeClassName,
  getShapeSurfaceStyle,
} from '../../utils/shape-utils';
import { isLineLikeShape, type ShapeKind, type ShapeToolOptions } from '../../types/shapes';
import { patchCellText } from '../../utils/table-utils';
import type { TableData } from '../../types/presentation';
import './freeform.css';
import './table-toolbar.css';
import './shape-toolbar.css';

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
  shapeTool?: ShapeToolOptions | null;
  onShapeToolChange?: (tool: ShapeToolOptions | null) => void;
  onCopy?: (id?: string) => void;
  onCut?: (ids?: string[]) => void;
  onPaste?: () => void;
  canPaste?: boolean;
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
  kind: ShapeKind;
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
    onCopy,
    onCut,
    onPaste,
    canPaste = false,
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
  const [shapeToolbarAnchor, setShapeToolbarAnchor] = useState<{
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
  const [elementContextMenu, setElementContextMenu] = useState<ElementContextMenuState | null>(null);
  const contextTargetIdsRef = useRef<string[]>([]);
  const menuOpenRef = useRef(false);
  menuOpenRef.current = Boolean(elementContextMenu);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || readOnly) return;
    const onCtx = (e: MouseEvent) => {
      if (!canvas.contains(e.target as Node)) return;
      e.preventDefault();
    };
    canvas.addEventListener('contextmenu', onCtx, { capture: true });
    return () => canvas.removeEventListener('contextmenu', onCtx, { capture: true });
  }, [readOnly]);

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

    let bounds = boundsFromShapeDrag(
      draw.kind,
      draw.startX,
      draw.startY,
      draw.currentX,
      draw.currentY,
    );
    if (snapRef.current && !isLineLikeShape(draw.kind)) {
      bounds = {
        ...bounds,
        x: snap(bounds.x, 2),
        y: snap(bounds.y, 2),
        w: snap(bounds.w, 2),
        h: snap(bounds.h, 2),
      };
      bounds.x = clamp(bounds.x, 0, 100 - bounds.w);
      bounds.y = clamp(bounds.y, 0, 100 - bounds.h);
    }

    const base = sortElements(slideRef.current.elements ?? []);
    const tool = shapeToolRef.current;
    const el = withTopZIndex(
      createShapeElement(
        draw.kind,
        {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          rotation: bounds.rotation,
        },
        theme,
        tool
          ? { fill: tool.fill, borderColor: tool.borderColor, borderWidth: tool.borderWidth }
          : undefined,
      ),
      base,
    );
    onCommitRef.current?.({ ...slideRef.current, elements: [...base, el] });
    onSelect([el.id]);
    if (!tool?.keepDrawing) {
      onShapeToolChangeRef.current?.(null);
    }
  }, [onSelect, theme]);

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
      if (readOnly || el.locked || menuOpenRef.current) return;

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
    if (e.button !== 0) return;
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

  const selectedShapeEl =
    selectedIds.length === 1 ? elements.find((e) => e.id === selectedIds[0]) : undefined;

  useEffect(() => {
    if (readOnly || selectedIds.length !== 1) {
      setShapeToolbarAnchor(null);
      return;
    }
    const el = elements.find((item) => item.id === selectedIds[0]);
    if (!el || el.type !== 'shape') {
      setShapeToolbarAnchor(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setShapeToolbarAnchor({
      top: rect.top + (el.y / 100) * rect.height,
      left: rect.left + (el.x / 100) * rect.width,
      width: (el.w / 100) * rect.width,
    });
  }, [readOnly, selectedIds, elements, zoom, slide]);

  const updateSelectedShape = useCallback(
    (patch: Partial<SlideElement>) => {
      const id = selectedIdsRef.current[0];
      if (!id) return;
      commitElements(
        elements.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [elements, commitElements],
  );

  const shapeToolbarOpen = !readOnly && selectedShapeEl?.type === 'shape';

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
    commitElements(reorderElements(elements, ids, 'forward'));
  };

  const sendBackward = () => {
    const ids = selectedIdsRef.current;
    if (!ids.length) return;
    commitElements(reorderElements(elements, ids, 'backward'));
  };

  const releaseActivePointerCapture = useCallback(() => {
    if (dragRef.current) {
      releaseCapture(dragRef.current.pointerId);
      dragRef.current = null;
      setDraggingId(null);
    }
    if (marqueeRef.current) {
      releaseCapture(marqueeRef.current.pointerId);
      marqueeRef.current = null;
      setMarqueePreview(null);
    }
    if (shapeDrawRef.current) {
      releaseCapture(shapeDrawRef.current.pointerId);
      shapeDrawRef.current = null;
      setShapePreview(null);
    }
    pendingTableDragRef.current = null;
    const shouldCommit = movedRef.current;
    movedRef.current = false;
    setLocalElements((prev) => {
      if (prev && shouldCommit) {
        onCommitRef.current?.({ ...slideRef.current, elements: prev });
      }
      return null;
    });
  }, []);

  const openElementContextMenu = useCallback(
    (el: SlideElement, clientX: number, clientY: number) => {
      if (readOnly || el.locked) return;
      const isBg = el.type === 'text' && el.style?.background && el.w >= 99;
      if (isBg) return;

      releaseActivePointerCapture();

      const ids = selectedIds.includes(el.id) ? selectedIds : [el.id];
      if (!selectedIds.includes(el.id)) onSelect(ids);
      contextTargetIdsRef.current = ids;

      setSelectionMenu(null);
      setShapeToolbarAnchor(null);
      setTableToolbarAnchor(null);
      setElementContextMenu({ x: clientX, y: clientY, targetIds: ids });
    },
    [readOnly, selectedIds, onSelect, releaseActivePointerCapture],
  );

  useEffect(() => {
    if (!elementContextMenu) return;
    releaseActivePointerCapture();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const releaseAll = () => {
      for (const id of [dragRef.current?.pointerId, marqueeRef.current?.pointerId, shapeDrawRef.current?.pointerId]) {
        if (id == null) continue;
        try {
          canvas.releasePointerCapture(id);
        } catch {
          /* ignore */
        }
      }
    };
    releaseAll();
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.element-ctx-menu') || target.closest('.element-ctx-backdrop')) return;
      releaseAll();
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [elementContextMenu, releaseActivePointerCapture]);

  const handleElementContextMenu = useCallback(
    (el: SlideElement, e: React.MouseEvent) => {
      if (readOnly) return;
      e.preventDefault();
      e.stopPropagation();
      openElementContextMenu(el, e.clientX, e.clientY);
    },
    [readOnly, openElementContextMenu],
  );

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (readOnly) return;
      e.preventDefault();
      if ((e.target as HTMLElement).closest('.freeform-el')) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = clientToCanvasPct(e.clientX, e.clientY, canvas);
      const hit = hitElementAtPoint(elements, x, y);
      if (hit) openElementContextMenu(hit, e.clientX, e.clientY);
    },
    [readOnly, elements, openElementContextMenu],
  );

  const contextIds = elementContextMenu?.targetIds ?? contextTargetIdsRef.current;

  const runContextAction = useCallback(
    (fn: (ids: string[]) => void) => {
      const ids = elementContextMenu?.targetIds ?? contextTargetIdsRef.current;
      if (!ids.length) return;
      fn(ids);
    },
    [elementContextMenu],
  );

  const canDeleteContext = Boolean(
    elementContextMenu?.targetIds.some((id) => {
      const el = elements.find((item) => item.id === id);
      return el && !el.locked;
    }),
  );

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

  const previewBounds = shapePreview
    ? boundsFromShapeDrag(
        shapePreview.kind,
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
            onClick={() => onShapeToolChange?.({ kind: 'rect' })}
          >
            ▭ 矩形
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onShapeToolChange?.({ kind: 'ellipse' })}
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
          className={`freeform-canvas ${snapToGrid ? 'freeform-canvas--snap' : ''} ${draggingId ? 'freeform-canvas--dragging' : ''} ${shapeTool ? 'freeform-canvas--shape-tool' : ''} ${shapePreview ? 'freeform-canvas--drawing-shape' : ''} ${marqueePreview ? 'freeform-canvas--marquee' : ''} ${elementContextMenu ? 'freeform-canvas--menu-open' : ''}`}
          style={{
            background: bgImage
              ? `url(${bgImage}) center/cover no-repeat`
              : `#${bgColor}`,
          }}
          onPointerDown={(e) => {
            if (e.button !== 0 || menuOpenRef.current) return;
            if (readOnly || dragRef.current || shapeDrawRef.current || marqueeRef.current) return;

            const tool = shapeToolRef.current;
            const canvas = canvasRef.current;
            if (tool && canvas) {
              e.preventDefault();
              setEditingId(null);
              setEditingCell(null);
              const { x, y } = clientToCanvasPct(e.clientX, e.clientY, canvas);
              shapeDrawRef.current = {
                kind: tool.kind,
                startX: x,
                startY: y,
                currentX: x,
                currentY: y,
                pointerId: e.pointerId,
              };
              setShapePreview({
                kind: tool.kind,
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
          onContextMenu={handleCanvasContextMenu}
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
          {previewBounds && shapePreview && (
            <div
              className={`freeform-shape-preview ${getShapeClassName(shapePreview.kind)} ${isLineLikeShape(shapePreview.kind) ? 'freeform-shape-preview-line' : ''}`}
              style={{
                left: `${previewBounds.x}%`,
                top: `${previewBounds.y}%`,
                width: `${previewBounds.w}%`,
                height: `${previewBounds.h}%`,
                transform: previewBounds.rotation
                  ? `rotate(${previewBounds.rotation}deg)`
                  : undefined,
                transformOrigin: isLineLikeShape(shapePreview.kind) ? 'left center' : 'center',
                ...(isLineLikeShape(shapePreview.kind)
                  ? {}
                  : getShapeSurfaceStyle(
                      shapePreview.kind,
                      shapeTool
                        ? {
                            fill: shapeTool.fill,
                            borderColor: shapeTool.borderColor,
                            borderWidth: shapeTool.borderWidth,
                          }
                        : undefined,
                      theme,
                    )),
              }}
            >
              {isLineLikeShape(shapePreview.kind) && (
                <ShapeLineVisual
                  kind={shapePreview.kind}
                  borderColor={shapeTool?.borderColor ?? theme.primary}
                  borderWidth={shapeTool?.borderWidth ?? 2}
                />
              )}
            </div>
          )}
          {shapeToolbarOpen && selectedShapeEl && shapeToolbarAnchor && (
            <ShapeToolbar
              open
              anchor={shapeToolbarAnchor}
              element={selectedShapeEl}
              theme={theme}
              onUpdate={updateSelectedShape}
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
              onContextMenu={(e) => handleElementContextMenu(el, e)}
            />
          ))}
          <ElementContextMenu
            menu={elementContextMenu}
            canDelete={canDeleteContext}
            canPaste={canPaste}
            onClose={() => setElementContextMenu(null)}
            onCopy={() => {
              if (contextIds[0]) onCopy?.(contextIds[0]);
            }}
            onCut={() => onCut?.(contextIds)}
            onPaste={() => onPaste?.()}
            onDelete={() =>
              runContextAction((ids) => {
                const idSet = new Set(ids);
                commitElements(elements.filter((el) => !idSet.has(el.id) || el.locked));
                onSelect([]);
                setSelectionMenu(null);
              })
            }
            onDuplicate={() =>
              runContextAction((ids) => {
                const idSet = new Set(ids);
                let z = nextElementZIndex(elements);
                const copies = elements
                  .filter((item) => idSet.has(item.id))
                  .map((item) => duplicateElement(item, 3, z++));
                if (!copies.length) return;
                commitElements([...elements, ...copies]);
                onSelect(copies.map((item) => item.id));
              })
            }
            onOrder={(action) =>
              runContextAction((ids) => commitElements(reorderElements(elements, ids, action)))
            }
            onRotate={(delta) =>
              runContextAction((ids) => commitElements(rotateElements(elements, ids, delta)))
            }
            onFlip={(axis) =>
              runContextAction((ids) => commitElements(flipElements(elements, ids, axis)))
            }
            onCenter={(axis) =>
              runContextAction((ids) => commitElements(centerElementsOnPage(elements, ids, axis)))
            }
          />
        </div>
      </div>
    </div>
  );
});
