import { useCallback, useEffect, useRef, useState } from 'react';
import type { PresentationTheme, SlideContent, SlideElement } from '../../types/presentation';
import {
  clamp,
  createImageElement,
  createTextElement,
} from '../../utils/slide-elements';
import './freeform.css';

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

interface Props {
  slide: SlideContent;
  theme: PresentationTheme;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (slide: SlideContent) => void;
}

interface DragState {
  kind: 'move' | 'resize';
  id: string;
  startX: number;
  startY: number;
  orig: SlideElement;
  handle?: ResizeHandle;
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

export function FreeformCanvas({
  slide,
  theme,
  selectedId,
  onSelect,
  onChange,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const elements = [...(slide.elements ?? [])].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
  );

  const updateElements = useCallback(
    (next: SlideElement[]) => {
      onChange({ ...slide, elements: next });
    },
    [slide, onChange],
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<SlideElement>) => {
      updateElements(
        elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
      );
    },
    [elements, updateElements],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      const canvas = canvasRef.current;
      if (!drag || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dx = ((e.clientX - drag.startX) / rect.width) * 100;
      const dy = ((e.clientY - drag.startY) / rect.height) * 100;
      const o = drag.orig;

      if (drag.kind === 'move') {
        updateElement(drag.id, {
          x: clamp(o.x + dx, 0, 100 - o.w),
          y: clamp(o.y + dy, 0, 100 - o.h),
        });
        return;
      }

      const handle = drag.handle ?? 'se';
      let { x, y, w, h } = o;

      if (handle.includes('e')) w = clamp(o.w + dx, 8, 100 - o.x);
      if (handle.includes('w')) {
        const nw = clamp(o.w - dx, 8, o.x + o.w);
        x = o.x + o.w - nw;
        w = nw;
      }
      if (handle.includes('s')) h = clamp(o.h + dy, 6, 100 - o.y);
      if (handle.includes('n')) {
        const nh = clamp(o.h - dy, 6, o.y + o.h);
        y = o.y + o.h - nh;
        h = nh;
      }

      updateElement(drag.id, {
        x: clamp(x, 0, 100 - w),
        y: clamp(y, 0, 100 - h),
        w,
        h,
      });
    },
    [updateElement],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }, [onPointerMove]);

  const startDrag = (e: React.PointerEvent, el: SlideElement, handle?: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(el.id);
    setEditingId(null);
    dragRef.current = {
      kind: handle ? 'resize' : 'move',
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...el },
      handle,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingId(null);
        onSelect(null);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !editingId) {
        updateElements(elements.filter((el) => el.id !== selectedId));
        onSelect(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, editingId, elements, updateElements, onSelect]);

  const addTextBox = () => {
    const el = createTextElement({ x: 15, y: 20, w: 40, h: 20, content: '文本框' });
    updateElements([...elements, el]);
    onSelect(el.id);
    setEditingId(el.id);
  };

  const addImageBox = () => {
    const el = createImageElement({
      x: 20,
      y: 20,
      w: 35,
      h: 45,
      imagePath: slide.imagePath ?? '',
    });
    updateElements([...elements, el]);
    onSelect(el.id);
  };

  const bringForward = () => {
    if (!selectedId) return;
    const maxZ = Math.max(...elements.map((e) => e.zIndex ?? 0), 0);
    updateElement(selectedId, { zIndex: maxZ + 1 });
  };

  const sendBackward = () => {
    if (!selectedId) return;
    const minZ = Math.min(...elements.map((e) => e.zIndex ?? 0), 0);
    updateElement(selectedId, { zIndex: minZ - 1 });
  };

  return (
    <div className="freeform-wrap">
      <div className="freeform-toolbar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={addTextBox}>
          + 文本框
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addImageBox}>
          + 图片
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={!selectedId}
          onClick={bringForward}
        >
          上移一层
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={!selectedId}
          onClick={sendBackward}
        >
          下移一层
        </button>
        <span className="freeform-toolbar-hint">拖拽移动 · 角点缩放 · Delete 删除</span>
      </div>

      <div
        ref={canvasRef}
        className="freeform-canvas"
        style={{ background: `#${theme.background}` }}
        onPointerDown={() => {
          if (!dragRef.current) {
            onSelect(null);
            setEditingId(null);
          }
        }}
      >
        {elements.map((el) => {
          const selected = el.id === selectedId;
          const isBg = el.type === 'text' && el.style?.background && el.w >= 99;

          if (el.type === 'image') {
            return (
              <div
                key={el.id}
                className={`freeform-el freeform-el--image ${selected ? 'freeform-el--selected' : ''}`}
                style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, zIndex: el.zIndex }}
                onPointerDown={(e) => startDrag(e, el)}
              >
                {el.imagePath ? (
                  <img src={el.imagePath} alt="" draggable={false} />
                ) : (
                  <div className="freeform-image-placeholder">图片</div>
                )}
                {selected && (
                  <>
                    {(['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((h) => (
                      <span
                        key={h}
                        className={`freeform-handle freeform-handle--${h}`}
                        onPointerDown={(e) => startDrag(e, el, h)}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          }

          return (
            <div
              key={el.id}
              className={`freeform-el freeform-el--text ${selected ? 'freeform-el--selected' : ''} ${isBg ? 'freeform-el--bg' : ''}`}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.w}%`,
                height: `${el.h}%`,
                zIndex: el.zIndex,
                background: el.style?.background ? `#${el.style.background}` : undefined,
              }}
              onPointerDown={(e) => {
                if (editingId === el.id) return;
                startDrag(e, el);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onSelect(el.id);
                setEditingId(el.id);
              }}
            >
              {editingId === el.id ? (
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
                  onBlur={(e) => {
                    updateElement(el.id, { content: e.target.value });
                    setEditingId(null);
                  }}
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

              {selected && !isBg && (
                <>
                  {(['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((h) => (
                    <span
                      key={h}
                      className={`freeform-handle freeform-handle--${h}`}
                      onPointerDown={(e) => startDrag(e, el, h)}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
