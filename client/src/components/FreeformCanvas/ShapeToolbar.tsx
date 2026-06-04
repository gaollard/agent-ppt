import { createPortal } from 'react-dom';
import type { ElementStyle, PresentationTheme, SlideElement } from '../../types/presentation';
import { SHAPE_CATALOG, isLineLikeShape, type ShapeKind } from '../../types/shapes';
import './shape-toolbar.css';

interface Props {
  open: boolean;
  anchor: { top: number; left: number; width: number };
  element: SlideElement;
  theme: PresentationTheme;
  onUpdate: (patch: Partial<SlideElement>) => void;
}

export function ShapeToolbar({ open, anchor, element, theme, onUpdate }: Props) {
  if (!open || element.type !== 'shape') return null;

  const style = element.style ?? {};
  const kind = (style.shapeKind ?? 'rect') as ShapeKind;
  const lineLike = isLineLikeShape(kind);

  const applyStyle = (patch: Partial<ElementStyle>) => {
    onUpdate({ style: { ...style, ...patch } });
  };

  const toolbar = (
    <div
      className="shape-toolbar"
      style={{
        top: Math.max(8, anchor.top - 52),
        left: anchor.left + anchor.width / 2,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <select
        className="shape-toolbar-select"
        value={kind}
        onChange={(e) => applyStyle({ shapeKind: e.target.value as ShapeKind })}
      >
        {SHAPE_CATALOG.map((s) => (
          <option key={s.kind} value={s.kind}>
            {s.label}
          </option>
        ))}
      </select>

      {!lineLike && (
        <label className="shape-toolbar-color" title="填充色">
          <span className="shape-toolbar-swatch" style={{ background: `#${style.fill ?? theme.accent}` }} />
          <input
            type="color"
            value={`#${style.fill ?? theme.accent}`}
            onChange={(e) => applyStyle({ fill: e.target.value.replace('#', '') })}
          />
        </label>
      )}

      <label className="shape-toolbar-color" title={lineLike ? '线条颜色' : '边框色'}>
        <span
          className="shape-toolbar-swatch shape-toolbar-swatch--border"
          style={{ background: `#${style.borderColor ?? theme.primary}` }}
        />
        <input
          type="color"
          value={`#${style.borderColor ?? theme.primary}`}
          onChange={(e) => applyStyle({ borderColor: e.target.value.replace('#', '') })}
        />
      </label>

      <label className="shape-toolbar-field" title="线宽">
        <input
          type="number"
          min={0}
          max={12}
          value={style.borderWidth ?? (lineLike ? 2 : 1)}
          onChange={(e) => applyStyle({ borderWidth: Number(e.target.value) })}
        />
        px
      </label>

      <label className="shape-toolbar-field" title="透明度">
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={style.opacity ?? 1}
          onChange={(e) => applyStyle({ opacity: Number(e.target.value) })}
        />
      </label>
    </div>
  );

  return createPortal(toolbar, document.body);
}
