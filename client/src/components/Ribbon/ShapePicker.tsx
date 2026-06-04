import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PresentationTheme } from '../../types/presentation';
import {
  SHAPE_CATALOG,
  type ShapeKind,
  type ShapeToolOptions,
} from '../../types/shapes';
import './shape-picker.css';

interface Props {
  theme: PresentationTheme;
  activeTool: ShapeToolOptions | null;
  onSelect: (tool: ShapeToolOptions) => void;
}

function ShapePreview({
  kind,
  fill,
  borderColor,
}: {
  kind: ShapeKind;
  fill: string;
  borderColor: string;
}) {
  const cls = `shape-picker-preview shape-picker-preview--${kind}`;
  return (
    <span
      className={cls}
      style={{
        ['--shape-fill' as string]: `#${fill}`,
        ['--shape-border' as string]: `#${borderColor}`,
      }}
    />
  );
}

export function ShapePicker({ theme, activeTool, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [fill, setFill] = useState(theme.accent);
  const [borderColor, setBorderColor] = useState(theme.primary);
  const [keepDrawing, setKeepDrawing] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open]);

  const pick = (kind: ShapeKind) => {
    onSelect({ kind, fill, borderColor, borderWidth: kind === 'line' || kind === 'arrow' ? 2 : 1, keepDrawing });
    setOpen(false);
  };

  const popover =
    open &&
    createPortal(
      <div
        ref={popoverRef}
        className="shape-picker-popover"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="shape-picker-header">
          <span className="shape-picker-title">形状</span>
          <span className="shape-picker-hint">选择后在画布拖动绘制</span>
        </div>
        <div className="shape-picker-grid">
          {SHAPE_CATALOG.map((item) => (
            <button
              key={item.kind}
              type="button"
              className={`shape-picker-item ${activeTool?.kind === item.kind ? 'shape-picker-item--active' : ''}`}
              title={item.label}
              onClick={() => pick(item.kind)}
            >
              <ShapePreview kind={item.kind} fill={fill} borderColor={borderColor} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="shape-picker-options">
          <label className="shape-picker-color">
            填充
            <input type="color" value={`#${fill}`} onChange={(e) => setFill(e.target.value.replace('#', ''))} />
          </label>
          <label className="shape-picker-color">
            边框
            <input
              type="color"
              value={`#${borderColor}`}
              onChange={(e) => setBorderColor(e.target.value.replace('#', ''))}
            />
          </label>
          <label className="shape-picker-check">
            <input
              type="checkbox"
              checked={keepDrawing}
              onChange={(e) => setKeepDrawing(e.target.checked)}
            />
            连续插入
          </label>
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="shape-picker">
      <button
        ref={btnRef}
        type="button"
        className={`ribbon-tool ribbon-tool--accent ${activeTool ? 'ribbon-tool--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title="形状"
      >
        <span className="ribbon-tool-icon">⬚</span>
        <span className="ribbon-tool-label">形状</span>
      </button>
      {popover}
    </div>
  );
}
