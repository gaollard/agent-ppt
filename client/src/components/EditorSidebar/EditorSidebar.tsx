import { useState } from 'react';
import type { PresentationContent, PresentationTheme, SlideContent } from '../../types/presentation';
import { ElementInspector } from '../ElementInspector/ElementInspector';
import { JsonPreview } from '../JsonPreview/JsonPreview';
import './EditorSidebar.css';

type PanelTab = 'inspector' | 'json';

interface Props {
  slide: SlideContent;
  slideIndex: number;
  presentation: PresentationContent;
  theme: PresentationTheme;
  selectedIds: string[];
  onChange: (slide: SlideContent) => void;
  onCommit: (slide: SlideContent) => void;
  onSelect: (ids: string[]) => void;
}

export function EditorSidebar({
  slide,
  slideIndex,
  presentation,
  theme,
  selectedIds,
  onChange,
  onCommit,
  onSelect,
}: Props) {
  const [tab, setTab] = useState<PanelTab>('inspector');

  return (
    <aside className="editor-pane">
      <div className="editor-pane-tabs">
        <button
          type="button"
          className={`editor-pane-tab ${tab === 'inspector' ? 'editor-pane-tab--active' : ''}`}
          onClick={() => setTab('inspector')}
        >
          属性
        </button>
        <button
          type="button"
          className={`editor-pane-tab ${tab === 'json' ? 'editor-pane-tab--active' : ''}`}
          onClick={() => setTab('json')}
        >
          JSON
        </button>
      </div>

      <div className="editor-pane-content">
        {tab === 'inspector' ? (
          <ElementInspector
            slide={slide}
            theme={theme}
            selectedIds={selectedIds}
            onChange={onChange}
            onCommit={onCommit}
            onSelect={onSelect}
          />
        ) : (
          <JsonPreview slide={slide} slideIndex={slideIndex} presentation={presentation} />
        )}
      </div>
    </aside>
  );
}
