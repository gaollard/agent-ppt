import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createEmptyPresentation,
  createEmptySlide,
  mergeTheme,
  type PresentationContent,
  type SlideContent,
  type SlideElement,
} from './types/presentation';
import { generateContent, exportPptx, downloadBlob } from './api/ppt';
import { SlideList } from './components/SlideList/SlideList';
import {
  FreeformCanvas,
  type FreeformCanvasHandle,
} from './components/FreeformCanvas/FreeformCanvas';
import { ElementInspector } from './components/ElementInspector/ElementInspector';
import { Ribbon, type RibbonTab } from './components/Ribbon/Ribbon';
import { PresentationMode } from './components/PresentationMode/PresentationMode';
import { useHistory } from './hooks/useHistory';
import {
  clearDraft,
  restoreDraftOnMount,
  useLocalDraft,
} from './hooks/useLocalDraft';
import {
  ensurePresentationElements,
  ensureSlideElements,
  syncSlideFromElements,
} from './utils/slide-elements';
import { duplicateElement, isSelectableElement } from './utils/editor-utils';
import './App.css';

export default function App() {
  const draft = restoreDraftOnMount();
  const {
    state: content,
    set: setContent,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  } = useHistory<PresentationContent>(
    ensurePresentationElements(draft ?? createEmptyPresentation()),
  );

  const canvasRef = useRef<FreeformCanvasHandle>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('start');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null as string | null);
  const [presenting, setPresenting] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [showDraftBanner, setShowDraftBanner] = useState(Boolean(draft));
  const [shapeTool, setShapeTool] = useState<'rect' | 'ellipse' | null>(null);

  const clipboardRef = useRef<SlideElement | null>(null);
  useLocalDraft(content);

  const theme = mergeTheme(content.theme);
  const activeSlide = content.slides[activeIndex];

  const commitContent = useCallback(
    (next: PresentationContent) => setContent(next, true),
    [setContent],
  );

  const updateSlideLive = useCallback(
    (index: number, slide: SlideContent) => {
      setContent(
        (prev) => ({
          ...prev,
          slides: prev.slides.map((s, i) =>
            i === index ? syncSlideFromElements(slide) : s,
          ),
        }),
        false,
      );
    },
    [setContent],
  );

  const commitSlide = useCallback(
    (index: number, slide: SlideContent) => {
      setContent(
        (prev) => ({
          ...prev,
          slides: prev.slides.map((s, i) =>
            i === index ? syncSlideFromElements(slide) : s,
          ),
        }),
        true,
      );
    },
    [setContent],
  );

  const handleGenerate = async (topic: string, slideCount: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateContent(topic, slideCount);
      reset(ensurePresentationElements(result));
      setActiveIndex(0);
      setSelectedElementIds([]);
      clearDraft();
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
      const blob = await exportPptx(ensurePresentationElements(content));
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
    }, true);
    setActiveIndex(to);
    setSelectedElementIds([]);
  };

  const handleDelete = (index: number) => {
    setContent(
      (prev) => ({ ...prev, slides: prev.slides.filter((_, i) => i !== index) }),
      true,
    );
    setActiveIndex((i) => Math.max(0, Math.min(i, content.slides.length - 2)));
    setSelectedElementIds([]);
  };

  const handleDuplicateSlide = (index: number) => {
    setContent((prev) => {
      const slide = ensureSlideElements(prev.slides[index], mergeTheme(prev.theme), index);
      const copy = {
        ...slide,
        title: `${slide.title} (副本)`,
        elements: slide.elements?.map((el) => duplicateElement(el, 0)),
      };
      const slides = [...prev.slides];
      slides.splice(index + 1, 0, copy);
      return { ...prev, slides };
    }, true);
    setActiveIndex(index + 1);
    setSelectedElementIds([]);
  };

  const handleAdd = () => {
    setContent((prev) => {
      const slide = ensureSlideElements(
        createEmptySlide(prev.slides.length),
        mergeTheme(prev.theme),
        prev.slides.length,
      );
      return { ...prev, slides: [...prev.slides, slide] };
    }, true);
    setActiveIndex(content.slides.length);
    setSelectedElementIds([]);
  };

  const handleSelectSlide = (index: number) => {
    setActiveIndex(index);
    setSelectedElementIds([]);
    setContent(
      (prev) => ({
        ...prev,
        slides: prev.slides.map((s, i) =>
          i === index ? ensureSlideElements(s, mergeTheme(prev.theme), i) : s,
        ),
      }),
      false,
    );
  };

  const copyElement = useCallback(() => {
    const id = selectedElementIds[0];
    const el = activeSlide?.elements?.find((e) => e.id === id);
    if (el) clipboardRef.current = el;
  }, [activeSlide, selectedElementIds]);

  const pasteElement = useCallback(() => {
    const source = clipboardRef.current;
    if (!source || !activeSlide) return;
    const el = duplicateElement(source);
    commitSlide(activeIndex, {
      ...activeSlide,
      elements: [...(activeSlide.elements ?? []), el],
    });
    setSelectedElementIds([el.id]);
  }, [activeSlide, activeIndex, commitSlide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement).tagName;
      const editing = tag === 'INPUT' || tag === 'TEXTAREA';

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (editing) return;
      if (mod && e.key === 'a') {
        e.preventDefault();
        if (!activeSlide) return;
        const ids = (activeSlide.elements ?? [])
          .filter(isSelectableElement)
          .map((el) => el.id);
        setSelectedElementIds(ids);
        return;
      }
      if (mod && e.key === 'c') { e.preventDefault(); copyElement(); }
      if (mod && e.key === 'v') { e.preventDefault(); pasteElement(); }
      if (mod && e.key === 'd') {
        e.preventDefault();
        if (!activeSlide || !selectedElementIds.length) return;
        const idSet = new Set(selectedElementIds);
        const copies = (activeSlide.elements ?? [])
          .filter((el) => idSet.has(el.id))
          .map((el) => duplicateElement(el));
        if (!copies.length) return;
        commitSlide(activeIndex, {
          ...activeSlide,
          elements: [...(activeSlide.elements ?? []), ...copies],
        });
        setSelectedElementIds(copies.map((el) => el.id));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, copyElement, pasteElement, selectedElementIds, activeSlide, activeIndex, commitSlide]);

  return (
    <div className="app">
      <div className="app-titlebar">
        <div className="app-titlebar-left">
          <span className="app-titlebar-logo">P</span>
          <input
            className="app-title-input"
            value={content.title}
            onChange={(e) =>
              setContent((prev) => ({ ...prev, title: e.target.value }), false)
            }
            onBlur={(e) =>
              commitContent({ ...content, title: e.target.value })
            }
            placeholder="未命名演示"
          />
        </div>
        <span className="app-titlebar-right">Smart PPT Editor</span>
      </div>

      <Ribbon
        activeTab={ribbonTab}
        onTabChange={setRibbonTab}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onAddSlide={handleAdd}
        onDuplicateSlide={() => handleDuplicateSlide(activeIndex)}
        onDeleteSlide={() => handleDelete(activeIndex)}
        onAddText={() => canvasRef.current?.addTextBox()}
        onAddImage={() => canvasRef.current?.addImageBox()}
        onAddRect={() => setShapeTool('rect')}
        onAddEllipse={() => setShapeTool('ellipse')}
        onBringForward={() => canvasRef.current?.bringForward()}
        onSendBackward={() => canvasRef.current?.sendBackward()}
        onCopy={copyElement}
        onPaste={pasteElement}
        onPresent={() => setPresenting(true)}
        onExport={handleExport}
        exporting={exporting}
        onGenerate={handleGenerate}
        generating={loading}
        snapToGrid={snapToGrid}
        onSnapChange={setSnapToGrid}
        zoom={zoom}
        onZoomChange={setZoom}
        hasSelection={selectedElementIds.length > 0}
        activeShapeTool={shapeTool}
      />

      {showDraftBanner && (
        <div className="app-draft-banner">
          已恢复上次编辑的草稿
          <button type="button" onClick={() => { clearDraft(); setShowDraftBanner(false); }}>
            清除
          </button>
        </div>
      )}

      {error && (
        <div className="app-error">
          {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading && (
        <div className="app-loading">
          <div className="spinner" />
          <p>AI 正在生成内容与配图…</p>
        </div>
      )}

      {presenting && (
        <PresentationMode
          content={content}
          startIndex={activeIndex}
          onClose={() => setPresenting(false)}
        />
      )}

      <div className="app-body">
        <SlideList
          content={content}
          activeIndex={activeIndex}
          onSelect={handleSelectSlide}
          onReorder={handleReorder}
          onDelete={handleDelete}
          onDuplicate={handleDuplicateSlide}
          onAdd={handleAdd}
        />

        <div className="app-workspace">
          <div className="app-canvas-area">
            {activeSlide && (
              <FreeformCanvas
                ref={canvasRef}
                slide={activeSlide}
                theme={theme}
                selectedIds={selectedElementIds}
                onSelect={setSelectedElementIds}
                onCommit={(s) => commitSlide(activeIndex, s)}
                snapToGrid={snapToGrid}
                zoom={zoom}
                hideToolbar
                shapeTool={shapeTool}
                onShapeToolChange={setShapeTool}
              />
            )}
          </div>

          <div className="app-notes">
            <div className="app-notes-label">单击此处添加备注</div>
            <textarea
              rows={2}
              value={activeSlide?.notes ?? ''}
              onChange={(e) =>
                updateSlideLive(activeIndex, { ...activeSlide!, notes: e.target.value })
              }
              onBlur={() =>
                activeSlide && commitSlide(activeIndex, activeSlide)
              }
              placeholder="演讲者备注（仅编辑器可见）"
            />
          </div>
        </div>

        <aside className="editor-pane">
          {activeSlide && (
            <ElementInspector
              slide={activeSlide}
              theme={theme}
              selectedIds={selectedElementIds}
              onChange={(s) => updateSlideLive(activeIndex, s)}
              onCommit={(s) => commitSlide(activeIndex, s)}
              onSelect={setSelectedElementIds}
            />
          )}
        </aside>
      </div>

      <div className="app-statusbar">
        <span>幻灯片 {activeIndex + 1} / {content.slides.length}</span>
        <span>
          {shapeTool
            ? `绘制${shapeTool === 'rect' ? '矩形' : '椭圆'} · 在画布拖动一次 · Esc 取消`
            : selectedElementIds.length > 1
              ? `已选中 ${selectedElementIds.length} 个元素`
              : `${zoom}% · 拖动框选 · Ctrl 框选显示菜单 · ${snapToGrid ? '网格吸附开' : '网格吸附关'}`}
        </span>
      </div>
    </div>
  );
}
