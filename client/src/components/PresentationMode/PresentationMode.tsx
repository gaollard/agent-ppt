import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const rootRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const indices = useMemo(() => visibleIndices(content.slides), [content.slides]);
  const initialPos = Math.max(0, indices.indexOf(startIndex));
  const [pos, setPos] = useState(initialPos);
  const theme = mergeTheme(content.theme);
  const slideIndex = indices[pos] ?? 0;
  const slide = content.slides[slideIndex];

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const finish = () => onClose();

    if (document.fullscreenElement) {
      document.exitFullscreen().then(finish).catch(finish);
    } else {
      finish();
    }
  }, [onClose]);

  useEffect(() => {
    closingRef.current = false;
    const root = rootRef.current;
    if (!root) return;

    root.requestFullscreen?.().catch(() => {
      /* 用户拒绝或浏览器不支持时仍可使用覆盖层演示 */
    });

    return () => {
      if (document.fullscreenElement === root) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && !closingRef.current) {
        handleClose();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [handleClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setPos((i) => Math.min(i + 1, indices.length - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setPos((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [indices.length, handleClose]);

  if (!indices.length) {
    return (
      <div ref={rootRef} className="presentation-mode">
        <div className="presentation-mode-empty">
          <p>没有可演示的幻灯片（可能全部被隐藏）</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
            退出
          </button>
        </div>
      </div>
    );
  }

  if (!slide) return null;

  return (
    <div ref={rootRef} className="presentation-mode">
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
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
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
