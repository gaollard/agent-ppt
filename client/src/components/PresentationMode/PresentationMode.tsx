import { useEffect, useState } from 'react';
import type { PresentationContent } from '../../types/presentation';
import { mergeTheme } from '../../types/presentation';
import { FreeformCanvas } from '../FreeformCanvas/FreeformCanvas';
import './presentation-mode.css';

interface Props {
  content: PresentationContent;
  startIndex?: number;
  onClose: () => void;
}

export function PresentationMode({ content, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const theme = mergeTheme(content.theme);
  const slide = content.slides[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, content.slides.length - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [content.slides.length, onClose]);

  if (!slide) return null;

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
          {index + 1} / {content.slides.length}
        </span>
        <div className="presentation-mode-nav">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            上一页
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={index === content.slides.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
