import { useEffect, useRef, useState } from 'react';
import type { PresentationTheme, SlideContent } from '../../types/presentation';
import { readImageFile } from '../../utils/editor-utils';
import '../GeneratePanel/GeneratePanel.css';
import './slide-background-dialog.css';

export interface SlideBackgroundValue {
  backgroundColor?: string;
  backgroundImage?: string;
}

interface Props {
  open: boolean;
  slide: SlideContent;
  theme: PresentationTheme;
  onClose: () => void;
  onApply: (value: SlideBackgroundValue, applyToAll: boolean) => void;
}

function normalizeHex(value: string): string {
  return value.replace(/^#/, '').toUpperCase();
}

export function SlideBackgroundDialog({ open, slide, theme, onClose, onApply }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<SlideBackgroundValue>({});

  useEffect(() => {
    if (!open) return;
    setDraft({
      backgroundColor: slide.backgroundColor,
      backgroundImage: slide.backgroundImage,
    });
  }, [open, slide.backgroundColor, slide.backgroundImage]);

  if (!open) return null;

  const displayColor = draft.backgroundColor ?? theme.background;

  const handleResetTheme = () => {
    setDraft({ backgroundColor: undefined, backgroundImage: undefined });
  };

  const handleImageFile = async (file: File) => {
    const dataUrl = await readImageFile(file);
    setDraft((prev) => ({ ...prev, backgroundImage: dataUrl }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal slide-bg-dialog"
        role="dialog"
        aria-labelledby="slide-bg-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="slide-bg-dialog-header">
          <h2 id="slide-bg-dialog-title">背景</h2>
          <button type="button" className="slide-bg-dialog-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="slide-bg-dialog-preview" style={{ backgroundColor: `#${displayColor}` }}>
          {draft.backgroundImage && (
            <img className="slide-bg-dialog-preview-img" src={draft.backgroundImage} alt="" />
          )}
        </div>

        <div className="slide-bg-dialog-row">
          <span className="slide-bg-dialog-label">颜色</span>
          <div className="slide-bg-dialog-control slide-bg-dialog-color">
            <input
              type="color"
              value={`#${displayColor}`}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  backgroundColor: normalizeHex(e.target.value),
                }))
              }
              aria-label="背景颜色"
            />
            <input
              type="text"
              value={displayColor}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  backgroundColor: normalizeHex(e.target.value),
                }))
              }
              spellCheck={false}
            />
          </div>
        </div>

        <div className="slide-bg-dialog-row">
          <span className="slide-bg-dialog-label">图片</span>
          <div className="slide-bg-dialog-control slide-bg-dialog-image">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileRef.current?.click()}
            >
              选择图片
            </button>
            {draft.backgroundImage && (
              <>
                <img className="slide-bg-dialog-thumb" src={draft.backgroundImage} alt="" />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, backgroundImage: undefined }))
                  }
                >
                  删除图片
                </button>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void handleImageFile(file);
              }}
            />
          </div>
        </div>

        <div className="slide-bg-dialog-row">
          <span className="slide-bg-dialog-label">重置主题</span>
          <div className="slide-bg-dialog-control">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleResetTheme}>
              重置
            </button>
          </div>
        </div>

        <div className="modal-actions slide-bg-dialog-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onApply(draft, true)}
          >
            应用到全部
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onApply(draft, false)}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
