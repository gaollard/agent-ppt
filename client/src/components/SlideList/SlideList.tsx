import { useCallback, useEffect, useRef, useState } from 'react';
import {
  mergeTheme,
  type PresentationContent,
  type SlideContent,
  type SlideLayout,
} from '../../types/presentation';
import { SlideContextMenu, type SlideContextMenuState } from './SlideContextMenu';
import './SlideContextMenu.css';
import './SlideList.css';

interface Props {
  content: PresentationContent;
  activeIndex: number;
  canPasteSlide: boolean;
  onSelect: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onAdd: (layout?: SlideLayout, afterIndex?: number) => void;
  onCopySlide: (index: number) => void;
  onCutSlide: (index: number) => void;
  onPasteSlide: (afterIndex: number) => void;
  onToggleHidden: (index: number) => void;
  onChangeBackground: (index: number) => void;
  onRemoveBackground: (index: number) => void;
  onChangeLayout: (index: number, layout: SlideLayout) => void;
  onResetSlide: (index: number) => void;
}

const SLIDE_DRAG_THRESHOLD = 6;

interface DragState {
  from: number;
  over: number;
  pointerId: number;
}

function resolveLayout(slide: SlideContent, index: number): SlideLayout {
  return slide.layout ?? (index === 0 ? 'cover' : 'title-bullets');
}

function MiniPreview({
  slide,
  index,
  primary,
  accent,
  background,
}: {
  slide: SlideContent;
  index: number;
  primary: string;
  accent: string;
  background: string;
}) {
  const bg = slide.backgroundColor ?? background;

  if (slide.backgroundImage) {
    return (
      <div className="mini-preview">
        <img className="mini-preview-cover-img" src={slide.backgroundImage} alt="" />
        {slide.elements?.length ? (
          slide.elements.map((el) => (
            <div
              key={el.id}
              className={`mini-el mini-el--${el.type}`}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.w}%`,
                height: `${el.h}%`,
                zIndex: el.zIndex,
              }}
            />
          ))
        ) : null}
      </div>
    );
  }

  if (slide.elements?.length) {
    return (
      <div className="mini-preview" style={{ background: `#${bg}` }}>
        {slide.elements.map((el) => (
          <div
            key={el.id}
            className={`mini-el mini-el--${el.type}`}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
              background: el.style?.background ? `#${el.style.background}` : undefined,
              zIndex: el.zIndex,
            }}
          >
            {el.type === 'image' && el.imagePath && <img src={el.imagePath} alt="" />}
          </div>
        ))}
      </div>
    );
  }

  const layout = resolveLayout(slide, index);
  const title = slide.title || `幻灯片 ${index + 1}`;

  if (layout === 'cover' || layout === 'full-image') {
    const hasImage = Boolean(slide.imagePath);
    return (
      <div className="mini-preview" style={hasImage ? undefined : { background: `#${primary}` }}>
        {hasImage && <img className="mini-preview-cover-img" src={slide.imagePath} alt="" />}
        <span className="mini-preview-title">{title.slice(0, 12)}</span>
      </div>
    );
  }

  return (
    <div className="mini-preview mini-preview--bullets" style={{ background: `#${bg}` }}>
      <strong style={{ color: `#${primary}` }}>{title.slice(0, 14)}</strong>
      <div className="mini-preview-lines">
        <i style={{ background: `#${accent}` }} />
        <i />
      </div>
    </div>
  );
}

function useSlideDragSort(
  slideCount: number,
  onReorder: (from: number, to: number) => void,
) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const pendingRef = useRef<{ from: number; startY: number; pointerId: number } | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const computeDropIndex = useCallback((clientY: number) => {
    const items = itemRefs.current;
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return Math.max(0, slideCount - 1);
  }, [slideCount]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const pending = pendingRef.current;
      const dragging = dragStateRef.current;

      if (pending && !dragging && e.pointerId === pending.pointerId) {
        if (Math.abs(e.clientY - pending.startY) >= SLIDE_DRAG_THRESHOLD) {
          pendingRef.current = null;
          const next: DragState = {
            from: pending.from,
            over: pending.from,
            pointerId: pending.pointerId,
          };
          dragStateRef.current = next;
          setDragState(next);
          listRef.current?.setPointerCapture(e.pointerId);
        }
        return;
      }

      if (dragging && e.pointerId === dragging.pointerId) {
        const over = computeDropIndex(e.clientY);
        if (over !== dragging.over) {
          const next = { ...dragging, over };
          dragStateRef.current = next;
          setDragState(next);
        }
      }
    };

    const finish = (e: PointerEvent) => {
      const pending = pendingRef.current;
      if (pending && e.pointerId === pending.pointerId) {
        pendingRef.current = null;
        return;
      }

      const dragging = dragStateRef.current;
      if (!dragging || e.pointerId !== dragging.pointerId) return;

      const { from, over } = dragging;
      pendingRef.current = null;
      dragStateRef.current = null;
      setDragState(null);

      try {
        listRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }

      if (from !== over) {
        didDragRef.current = true;
        onReorder(from, over);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [computeDropIndex, onReorder]);

  const startDrag = useCallback((from: number, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.slide-list-actions button')) return;
    pendingRef.current = { from, startY: e.clientY, pointerId: e.pointerId };
  }, []);

  const shouldSuppressClick = useCallback(() => {
    if (!didDragRef.current) return false;
    didDragRef.current = false;
    return true;
  }, []);

  const setItemRef = useCallback((index: number, el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  const clearItemRefs = useCallback(() => {
    itemRefs.current = [];
  }, []);

  return { listRef, dragState, startDrag, shouldSuppressClick, setItemRef, clearItemRefs };
}

export function SlideList({
  content,
  activeIndex,
  canPasteSlide,
  onSelect,
  onReorder,
  onDelete,
  onDuplicate,
  onAdd,
  onCopySlide,
  onCutSlide,
  onPasteSlide,
  onToggleHidden,
  onChangeBackground,
  onRemoveBackground,
  onChangeLayout,
  onResetSlide,
}: Props) {
  const theme = mergeTheme(content.theme);
  const [sidebarTab, setSidebarTab] = useState<'slides' | 'outline'>('slides');
  const [contextMenu, setContextMenu] = useState<SlideContextMenuState | null>(null);
  const contextIndex = contextMenu?.index ?? activeIndex;
  const contextSlide = content.slides[contextIndex] ?? null;

  const dragSort = useSlideDragSort(content.slides.length, onReorder);

  useEffect(() => {
    dragSort.clearItemRefs();
  }, [sidebarTab, dragSort.clearItemRefs]);

  const openContextMenu = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(index);
    setContextMenu({ index, x: e.clientX, y: e.clientY });
  }, [onSelect]);

  const handleSelect = useCallback(
    (index: number, suppress?: () => boolean) => {
      if (suppress?.()) return;
      onSelect(index);
    },
    [onSelect],
  );

  return (
    <aside className={`slide-list ${dragSort.dragState ? 'slide-list--dragging' : ''}`}>
      <div className="slide-list-tabs">
        <button
          type="button"
          className={sidebarTab === 'outline' ? 'slide-list-tab--active' : ''}
          onClick={() => setSidebarTab('outline')}
        >
          大纲
        </button>
        <button
          type="button"
          className={sidebarTab === 'slides' ? 'slide-list-tab--active' : ''}
          onClick={() => setSidebarTab('slides')}
        >
          幻灯片
        </button>
      </div>

      {sidebarTab === 'outline' ? (
        <div
          ref={dragSort.listRef}
          className={`slide-list-outline ${dragSort.dragState ? 'slide-list-outline--dragging' : ''}`}
        >
          {content.slides.map((slide, i) => (
            <div
              key={i}
              ref={(el) => dragSort.setItemRef(i, el)}
              role="button"
              tabIndex={0}
              className={[
                'slide-list-outline-item',
                i === activeIndex ? 'slide-list-outline-item--active' : '',
                slide.hidden ? 'slide-list-outline-item--hidden' : '',
                dragSort.dragState?.from === i ? 'slide-list-outline-item--dragging' : '',
                dragSort.dragState && dragSort.dragState.from !== dragSort.dragState.over && dragSort.dragState.over === i
                  ? 'slide-list-outline-item--drop-before'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onPointerDown={(e) => dragSort.startDrag(i, e)}
              onClick={() => handleSelect(i, dragSort.shouldSuppressClick)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSelect(i);
              }}
              onContextMenu={(e) => openContextMenu(i, e)}
            >
              <span className="slide-list-outline-num">{i + 1}</span>
              <span className="slide-list-outline-title">{slide.title || `幻灯片 ${i + 1}`}</span>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={dragSort.listRef}
          className={`slide-list-items ${dragSort.dragState ? 'slide-list-items--dragging' : ''}`}
        >
          {content.slides.map((slide, i) => (
            <div
              key={i}
              ref={(el) => dragSort.setItemRef(i, el)}
              className={[
                'slide-list-item',
                i === activeIndex ? 'slide-list-item--active' : '',
                slide.hidden ? 'slide-list-item--hidden' : '',
                dragSort.dragState?.from === i ? 'slide-list-item--dragging' : '',
                dragSort.dragState && dragSort.dragState.from !== dragSort.dragState.over && dragSort.dragState.over === i
                  ? 'slide-list-item--drop-before'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onPointerDown={(e) => dragSort.startDrag(i, e)}
              onContextMenu={(e) => openContextMenu(i, e)}
            >
              <span className="slide-list-num">{i + 1}</span>
              <button
                type="button"
                className="slide-list-thumb"
                onClick={() => handleSelect(i, dragSort.shouldSuppressClick)}
              >
                <MiniPreview
                  slide={slide}
                  index={i}
                  primary={theme.primary}
                  accent={theme.accent}
                  background={theme.background}
                />
              </button>
              {slide.hidden && <span className="slide-list-hidden-badge">已隐藏</span>}
              <div className="slide-list-actions">
                <button type="button" disabled={i === 0} onClick={() => onReorder(i, i - 1)} title="上移">↑</button>
                <button
                  type="button"
                  disabled={i === content.slides.length - 1}
                  onClick={() => onReorder(i, i + 1)}
                  title="下移"
                >
                  ↓
                </button>
                <button type="button" onClick={() => onDuplicate(i)} title="复制">⎘</button>
                <button
                  type="button"
                  disabled={content.slides.length <= 1}
                  onClick={() => onDelete(i)}
                  title="删除"
                  className="slide-list-delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="slide-list-add" onClick={() => onAdd()}>
        + 新建幻灯片
      </button>

      <SlideContextMenu
        menu={contextMenu}
        slide={contextSlide}
        canDelete={content.slides.length > 1}
        canPaste={canPasteSlide}
        onClose={() => setContextMenu(null)}
        onCopy={() => onCopySlide(contextIndex)}
        onCut={() => onCutSlide(contextIndex)}
        onPaste={() => onPasteSlide(contextIndex)}
        onInsertSlide={(layout) => onAdd(layout, contextIndex)}
        onDuplicate={() => onDuplicate(contextIndex)}
        onDelete={() => onDelete(contextIndex)}
        onToggleHidden={() => onToggleHidden(contextIndex)}
        onChangeBackground={() => onChangeBackground(contextIndex)}
        onRemoveBackground={() => onRemoveBackground(contextIndex)}
        onChangeLayout={(layout) => onChangeLayout(contextIndex, layout)}
        onResetSlide={() => onResetSlide(contextIndex)}
      />
    </aside>
  );
}
