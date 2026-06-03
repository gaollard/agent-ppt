import { useCallback, useState } from 'react';
import {
  createEmptyPresentation,
  createEmptySlide,
  mergeTheme,
  type PresentationContent,
  type SlideContent,
} from './types/presentation';
import { generateContent, exportPptx, downloadBlob } from './api/ppt';
import { SlideList } from './components/SlideList/SlideList';
import { FreeformCanvas } from './components/FreeformCanvas/FreeformCanvas';
import { ElementInspector } from './components/ElementInspector/ElementInspector';
import { GeneratePanel } from './components/GeneratePanel/GeneratePanel';
import {
  ensurePresentationElements,
  ensureSlideElements,
  syncSlideFromElements,
} from './utils/slide-elements';
import './App.css';

export default function App() {
  const [content, setContent] = useState<PresentationContent>(() =>
    ensurePresentationElements(createEmptyPresentation()),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = mergeTheme(content.theme);
  const activeSlide = content.slides[activeIndex];

  const updateSlide = useCallback((index: number, slide: SlideContent) => {
    setContent((prev) => {
      const slides = [...prev.slides];
      slides[index] = syncSlideFromElements(slide);
      return { ...prev, slides };
    });
  }, []);

  const handleGenerate = async (topic: string, slideCount: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateContent(topic, slideCount);
      setContent(ensurePresentationElements(result));
      setActiveIndex(0);
      setSelectedElementId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const exportContent = ensurePresentationElements(content);
      const blob = await exportPptx(exportContent);
      const safeName = content.title.replace(/[^\w\u4e00-\u9fff\-]+/g, '_') || 'presentation';
      downloadBlob(blob, `${safeName}.pptx`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleReorder = (from: number, to: number) => {
    setContent((prev) => {
      const slides = [...prev.slides];
      const [item] = slides.splice(from, 1);
      slides.splice(to, 0, item);
      return { ...prev, slides };
    });
    setActiveIndex(to);
    setSelectedElementId(null);
  };

  const handleDelete = (index: number) => {
    setContent((prev) => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index),
    }));
    setActiveIndex((i) => Math.max(0, Math.min(i, content.slides.length - 2)));
    setSelectedElementId(null);
  };

  const handleAdd = () => {
    setContent((prev) => {
      const slide = ensureSlideElements(
        createEmptySlide(prev.slides.length),
        mergeTheme(prev.theme),
        prev.slides.length,
      );
      return { ...prev, slides: [...prev.slides, slide] };
    });
    setActiveIndex(content.slides.length);
    setSelectedElementId(null);
  };

  const handleSelectSlide = (index: number) => {
    setActiveIndex(index);
    setSelectedElementId(null);
    setContent((prev) => {
      const slides = [...prev.slides];
      slides[index] = ensureSlideElements(slides[index], mergeTheme(prev.theme), index);
      return { ...prev, slides };
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo">◆</span>
          <div>
            <h1>Smart PPT Editor</h1>
            <input
              className="app-title-input"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              placeholder="演示标题"
            />
          </div>
        </div>
        <div className="app-actions">
          <GeneratePanel onGenerate={handleGenerate} loading={loading} />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={exporting || loading}
          >
            {exporting ? '导出中…' : '导出 PPTX'}
          </button>
        </div>
      </header>

      {error && (
        <div className="app-error">
          {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading && (
        <div className="app-loading">
          <div className="spinner" />
          <p>AI 正在生成内容与配图，可能需要 1–3 分钟…</p>
        </div>
      )}

      <main className="app-main">
        <SlideList
          content={content}
          activeIndex={activeIndex}
          onSelect={handleSelectSlide}
          onReorder={handleReorder}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />

        <section className="preview-pane">
          <div className="preview-toolbar">
            <span>
              编辑 · {activeIndex + 1} / {content.slides.length}
            </span>
            <span className="preview-hint">自由拖拽 · 角点缩放 · 双击编辑文本</span>
          </div>
          <div className="preview-stage">
            {activeSlide && (
              <FreeformCanvas
                slide={activeSlide}
                theme={theme}
                selectedId={selectedElementId}
                onSelect={setSelectedElementId}
                onChange={(s) => updateSlide(activeIndex, s)}
              />
            )}
          </div>
        </section>

        <aside className="editor-pane">
          {activeSlide && (
            <ElementInspector
              slide={activeSlide}
              selectedId={selectedElementId}
              onChange={(s) => updateSlide(activeIndex, s)}
              onSelect={setSelectedElementId}
            />
          )}
        </aside>
      </main>
    </div>
  );
}
