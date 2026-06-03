import { useEffect, useMemo, useState } from 'react';
import type { PresentationContent } from '../../types/presentation';
import { mergeTheme } from '../../types/presentation';
import { FreeformCanvas } from '../FreeformCanvas/FreeformCanvas';
import './presentation-mode.css';

interface Props {
  content: PresentationContent;
  startIndex?: number;
  onClose: () => void;
}

function visibleIndices(slides: PresentationContent['slides']) {
  return slides.map((s, i) => (s.hidden ? -1 : i)).filter((i) => i >= 0);
}

export function PresentationMode({ content, startIndex = 0, onClose }: Props) {
  const indices = useMemo(() => visibleIndices(content.slides), [content.slides]);
  const initialPos = Math.max(0, indices.indexOf(startIndex));
  const [pos, setPos] = useState(initialPos);
  const theme = mergeTheme(content.theme);
  const slideIndex = indices[pos] ?? 0;
  const slide = content.slides[slideIndex];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setPos((i) => Math.min(i + 1, indices.length - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setPos((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [indices.length, onClose]);

  if (!slide || !indices.length) return null;

  return (
    <div className="presentation-mode">
      <div className="presentation-mode-stage">
        <FreeformCanvas
          slide={slide}
          theme={theme}
          selectedIds={[]}
          onSelect={() => {}}
          readOnly
        />
      </div>
      <div className="presentation-mode-bar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          退出 (Esc)
        </button>
        <span>
          {pos + 1} / {indices.length}
        </span>
        <div className="presentation-mode-nav">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={pos === 0}
            onClick={() => setPos((i) => i - 1)}
          >
            上一页
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={pos === indices.length - 1}
            onClick={() => setPos((i) => i + 1)}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
