import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createEmptyPresentation,
  createEmptySlide,
  mergeTheme,
  type ElementStyle,
  type PresentationContent,
  type SlideContent,
  type SlideElement,
  type SlideLayout,
} from './types/presentation';
import { generateContent, exportPptx, downloadBlob } from './api/ppt';
import { SlideList } from './components/SlideList/SlideList';
import type { SlideListActions } from './components/SlideList/slide-list-actions';
import {
  FreeformCanvas,
  type FreeformCanvasHandle,
} from './components/FreeformCanvas/FreeformCanvas';
import { SlideBackgroundDialog, type SlideBackgroundValue } from './components/SlideBackgroundDialog/SlideBackgroundDialog';
import { EditorSidebar } from './components/EditorSidebar/EditorSidebar';
import { Ribbon, type RibbonTab } from './components/Ribbon/Ribbon';
import { PresentationMode } from './components/PresentationMode/PresentationMode';
import { useHistory } from './hooks/useHistory';
import {
  clearDraft,
  restoreDraftOnMount,
  useLocalDraft,
} from './hooks/useLocalDraft';
import {
  applySlideLayout,
  cloneSlide,
  ensurePresentationElements,
  ensureSlideElements,
  resetSlideFromLayout,
  syncSlideFromElements,
} from './utils/slide-elements';
import { duplicateElement, isLayoutBackgroundElement, isSelectableElement, nextElementZIndex } from './utils/editor-utils';
import type { ShapeToolOptions } from './types/shapes';
import { shapeLabel } from './types/shapes';
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
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showDraftBanner, setShowDraftBanner] = useState(Boolean(draft));
  const [shapeTool, setShapeTool] = useState<ShapeToolOptions | null>(null);

  const clipboardRef = useRef<SlideElement | null>(null);
  const slideClipboardRef = useRef<{
    slide: SlideContent;
    cut: boolean;
    cutIndex?: number;
  } | null>(null);
  const [bgDialogIndex, setBgDialogIndex] = useState<number | null>(null);
  const [canPasteSlide, setCanPasteSlide] = useState(false);
  const [canPasteElement, setCanPasteElement] = useState(false);
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

  const selectedTextElement = useMemo(() => {
    if (!activeSlide || selectedElementIds.length !== 1) return null;
    const el = activeSlide.elements?.find((item) => item.id === selectedElementIds[0]);
    if (!el || el.type !== 'text' || isLayoutBackgroundElement(el)) return null;
    return el;
  }, [activeSlide, selectedElementIds]);

  const updateSelectedTextStyle = useCallback(
    (patch: Partial<ElementStyle>) => {
      if (!activeSlide || !selectedTextElement) return;
      commitSlide(activeIndex, {
        ...activeSlide,
        elements: (activeSlide.elements ?? []).map((el) => {
          if (el.id !== selectedTextElement.id) return el;
          const next: SlideElement = {
            ...el,
            style: { ...el.style, ...patch },
          };
          if ('bullets' in patch) {
            next.richText = undefined;
          }
          return next;
        }),
      });
    },
    [activeIndex, activeSlide, commitSlide, selectedTextElement],
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
    if (from === to) return;
    setContent((prev) => {
      const slides = [...prev.slides];
      const [item] = slides.splice(from, 1);
      slides.splice(to, 0, item);
      return { ...prev, slides };
    }, true);
    setActiveIndex((current) => {
      if (current === from) return to;
      if (from < current && to >= current) return current - 1;
      if (from > current && to <= current) return current + 1;
      return current;
    });
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

  const handleAdd = (layout?: SlideLayout, afterIndex?: number) => {
    setContent((prev) => {
      const insertAt = afterIndex !== undefined ? afterIndex + 1 : prev.slides.length;
      const slide = ensureSlideElements(
        { ...createEmptySlide(insertAt), ...(layout ? { layout } : {}) },
        mergeTheme(prev.theme),
        insertAt,
      );
      const slides = [...prev.slides];
      slides.splice(insertAt, 0, slide);
      return { ...prev, slides };
    }, true);
    const nextIndex = afterIndex !== undefined ? afterIndex + 1 : content.slides.length;
    setActiveIndex(nextIndex);
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

  const handleCopySlide = (index: number) => {
    const slide = ensureSlideElements(content.slides[index], theme, index);
    slideClipboardRef.current = { slide: cloneSlide(slide), cut: false };
    setCanPasteSlide(true);
  };

  const handleCutSlide = (index: number) => {
    if (content.slides.length <= 1) return;
    const slide = ensureSlideElements(content.slides[index], theme, index);
    slideClipboardRef.current = { slide: cloneSlide(slide), cut: true, cutIndex: index };
    setCanPasteSlide(true);
  };

  const handlePasteSlide = (afterIndex: number) => {
    const clip = slideClipboardRef.current;
    if (!clip) return;

    setContent((prev) => {
      const slides = [...prev.slides];
      let insertAt = afterIndex + 1;

      if (clip.cut && clip.cutIndex !== undefined) {
        const [removed] = slides.splice(clip.cutIndex, 1);
        if (clip.cutIndex <= afterIndex) insertAt -= 1;
        slides.splice(insertAt, 0, removed);
        slideClipboardRef.current = null;
        setCanPasteSlide(false);
      } else {
        slides.splice(insertAt, 0, cloneSlide(clip.slide));
      }

      return { ...prev, slides };
    }, true);
    setActiveIndex(afterIndex + 1);
    setSelectedElementIds([]);
  };

  const handleToggleHidden = (index: number) => {
    setContent(
      (prev) => ({
        ...prev,
        slides: prev.slides.map((s, i) =>
          i === index ? { ...s, hidden: !s.hidden } : s,
        ),
      }),
      true,
    );
  };

  const handleOpenBackground = (index: number) => {
    setActiveIndex(index);
    setSelectedElementIds([]);
    setBgDialogIndex(index);
  };

  const handleApplyBackground = (
    index: number,
    value: SlideBackgroundValue,
    applyToAll: boolean,
  ) => {
    setContent(
      (prev) => ({
        ...prev,
        slides: prev.slides.map((s, i) => {
          if (!applyToAll && i !== index) return s;
          return {
            ...s,
            backgroundColor: value.backgroundColor,
            backgroundImage: value.backgroundImage,
          };
        }),
      }),
      true,
    );
    setActiveIndex(index);
    setSelectedElementIds([]);
    setBgDialogIndex(null);
  };

  const handleChangeLayout = (index: number, layout: SlideLayout) => {
    setContent(
      (prev) => ({
        ...prev,
        slides: prev.slides.map((s, i) =>
          i === index ? applySlideLayout(s, layout, mergeTheme(prev.theme), i) : s,
        ),
      }),
      true,
    );
    setSelectedElementIds([]);
  };

  const handleResetSlide = (index: number) => {
    setContent(
      (prev) => ({
        ...prev,
        slides: prev.slides.map((s, i) =>
          i === index ? resetSlideFromLayout(s, mergeTheme(prev.theme), i) : s,
        ),
      }),
      true,
    );
    setSelectedElementIds([]);
  };

  const slideListActions: SlideListActions = {
    onReorder: handleReorder,
    onDelete: handleDelete,
    onDuplicate: handleDuplicateSlide,
    onAdd: handleAdd,
    onCopySlide: handleCopySlide,
    onCutSlide: handleCutSlide,
    onPasteSlide: handlePasteSlide,
    onToggleHidden: handleToggleHidden,
    onOpenBackground: handleOpenBackground,
    onChangeLayout: handleChangeLayout,
    onResetSlide: handleResetSlide,
  };

  const copyElement = useCallback((id?: string) => {
    const targetId = id ?? selectedElementIds[0];
    const el = activeSlide?.elements?.find((e) => e.id === targetId);
    if (el) {
      clipboardRef.current = el;
      setCanPasteElement(true);
    }
  }, [activeSlide, selectedElementIds]);

  const cutElement = useCallback((ids?: string[]) => {
    const targetIds = ids ?? selectedElementIds;
    if (!activeSlide || !targetIds.length) return;
    copyElement(targetIds[0]);
    const idSet = new Set(targetIds);
    commitSlide(activeIndex, {
      ...activeSlide,
      elements: (activeSlide.elements ?? []).filter((el) => !idSet.has(el.id) || el.locked),
    });
    setSelectedElementIds([]);
  }, [activeSlide, activeIndex, selectedElementIds, commitSlide, copyElement]);

  const pasteElement = useCallback(() => {
    const source = clipboardRef.current;
    if (!source || !activeSlide) return;
    const existing = activeSlide.elements ?? [];
    const el = duplicateElement(source, 3, nextElementZIndex(existing));
    commitSlide(activeIndex, {
      ...activeSlide,
      elements: [...existing, el],
    });
    setSelectedElementIds([el.id]);
  }, [activeSlide, activeIndex, commitSlide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const editing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

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
        const existing = activeSlide.elements ?? [];
        let z = nextElementZIndex(existing);
        const copies = existing
          .filter((el) => idSet.has(el.id))
          .map((el) => duplicateElement(el, 3, z++));
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
      <Ribbon
        titleBar={
          <>
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
          </>
        }
        activeTab={ribbonTab}
        onTabChange={setRibbonTab}
        theme={theme}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onAddSlide={handleAdd}
        onDuplicateSlide={() => handleDuplicateSlide(activeIndex)}
        onDeleteSlide={() => handleDelete(activeIndex)}
        onAddText={() => canvasRef.current?.addTextBox()}
        onAddImage={() => canvasRef.current?.addImageBox()}
        onSelectShape={(tool) => {
          setSelectedElementIds([]);
          setShapeTool(tool);
        }}
        onInsertTable={(rows, cols) => canvasRef.current?.addTable(rows, cols)}
        onBringForward={() => canvasRef.current?.bringForward()}
        onSendBackward={() => canvasRef.current?.sendBackward()}
        onCopy={copyElement}
        onPaste={pasteElement}
        onPresent={() => {
          setSelectedElementIds([]);
          setShapeTool(null);
          setPresenting(true);
        }}
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
        selectedTextElement={selectedTextElement}
        onUpdateTextStyle={updateSelectedTextStyle}
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

      {bgDialogIndex != null && content.slides[bgDialogIndex] && (
        <SlideBackgroundDialog
          open
          slide={content.slides[bgDialogIndex]}
          theme={theme}
          onClose={() => setBgDialogIndex(null)}
          onApply={(value, applyToAll) =>
            handleApplyBackground(bgDialogIndex, value, applyToAll)
          }
        />
      )}

      <div className={`app-body ${presenting ? 'app-body--hidden' : ''}`}>
        <SlideList
          content={content}
          activeIndex={activeIndex}
          canPasteSlide={canPasteSlide}
          onSelect={handleSelectSlide}
          actions={slideListActions}
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
                onCopy={copyElement}
                onCut={cutElement}
                onPaste={pasteElement}
                canPaste={canPasteElement}
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

        {activeSlide && (
          <EditorSidebar
            slide={activeSlide}
            slideIndex={activeIndex}
            presentation={content}
            theme={theme}
            selectedIds={selectedElementIds}
            onChange={(s) => updateSlideLive(activeIndex, s)}
            onCommit={(s) => commitSlide(activeIndex, s)}
            onSelect={setSelectedElementIds}
          />
        )}
      </div>

      <div className="app-statusbar">
        <span>幻灯片 {activeIndex + 1} / {content.slides.length}</span>
        <span>
          {shapeTool
            ? `绘制${shapeLabel(shapeTool.kind)} · 在画布拖动${shapeTool.keepDrawing ? '（连续插入）' : '一次'} · Esc 取消`
            : selectedElementIds.length > 1
              ? `已选中 ${selectedElementIds.length} 个元素`
              : `${zoom}% · 拖动框选 · Ctrl 框选显示菜单 · ${snapToGrid ? '网格吸附开' : '网格吸附关'}`}
        </span>
      </div>
    </div>
  );
}
