import { useMemo, useState } from 'react';
import type { PresentationContent, SlideContent } from '../../types/presentation';
import { formatJsonPreview } from '../../utils/json-preview-utils';
import './JsonPreview.css';

type Scope = 'slide' | 'presentation';

interface Props {
  slide: SlideContent;
  slideIndex: number;
  presentation: PresentationContent;
}

export function JsonPreview({ slide, slideIndex, presentation }: Props) {
  const [scope, setScope] = useState<Scope>('slide');
  const [compactLargeFields, setCompactLargeFields] = useState(true);
  const [copied, setCopied] = useState(false);

  const previewData = scope === 'slide' ? slide : presentation;

  const jsonText = useMemo(
    () => formatJsonPreview(previewData, compactLargeFields),
    [previewData, compactLargeFields],
  );

  const byteSize = useMemo(() => new Blob([jsonText]).size, [jsonText]);

  const handleCopy = async () => {
    const fullText = JSON.stringify(previewData, null, 2);
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="json-preview">
      <div className="json-preview-toolbar">
        <div className="json-preview-scope">
          <button
            type="button"
            className={scope === 'slide' ? 'json-preview-scope-btn--active' : undefined}
            onClick={() => setScope('slide')}
          >
            当前页
          </button>
          <button
            type="button"
            className={scope === 'presentation' ? 'json-preview-scope-btn--active' : undefined}
            onClick={() => setScope('presentation')}
          >
            全部
          </button>
        </div>
        <button
          type="button"
          className={`btn btn-ghost btn-sm ${copied ? 'json-preview-copy--done' : ''}`}
          onClick={() => void handleCopy()}
        >
          {copied ? '已复制' : '复制'}
        </button>
        <label className="json-preview-check">
          <input
            type="checkbox"
            checked={compactLargeFields}
            onChange={(e) => setCompactLargeFields(e.target.checked)}
          />
          压缩大字段
        </label>
      </div>

      <div className="json-preview-body">
        <pre className="json-preview-pre">{jsonText}</pre>
      </div>

      <div className="json-preview-meta">
        {scope === 'slide'
          ? `幻灯片 ${slideIndex + 1} · `
          : `${presentation.slides.length} 页 · `}
        {byteSize.toLocaleString()} bytes
      </div>
    </div>
  );
}
