import { type ReactNode } from 'react';
import { GeneratePanel } from '../GeneratePanel/GeneratePanel';
import { TablePicker } from './TablePicker';
import { ShapePicker } from './ShapePicker';
import { TextFormatControls } from '../TextFormat/TextFormatControls';
import type { ElementStyle, PresentationTheme, SlideElement } from '../../types/presentation';
import type { ShapeToolOptions } from '../../types/shapes';
import './ribbon.css';

export type RibbonTab = 'start' | 'insert' | 'view';

interface Props {
  titleBar?: ReactNode;
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  theme: PresentationTheme;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onAddText: () => void;
  onAddImage: () => void;
  onSelectShape: (tool: ShapeToolOptions) => void;
  onInsertTable: (rows: number, cols: number) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onPresent: () => void;
  onExport: () => void;
  exporting: boolean;
  onGenerate: (topic: string, slideCount: number) => Promise<void>;
  generating: boolean;
  snapToGrid: boolean;
  onSnapChange: (v: boolean) => void;
  zoom: number;
  onZoomChange: (v: number) => void;
  hasSelection: boolean;
  activeShapeTool?: ShapeToolOptions | null;
  selectedTextElement?: SlideElement | null;
  onUpdateTextStyle?: (patch: Partial<ElementStyle>) => void;
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ribbon-group">
      <div className="ribbon-group-body">{children}</div>
      <span className="ribbon-group-label">{label}</span>
    </div>
  );
}

function Tool({
  icon,
  label,
  onClick,
  disabled,
  accent,
  active,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  accent?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`ribbon-tool ${accent ? 'ribbon-tool--accent' : ''} ${active ? 'ribbon-tool--active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      <span className="ribbon-tool-icon">{icon}</span>
      <span className="ribbon-tool-label">{label}</span>
    </button>
  );
}

export function Ribbon({
  titleBar,
  activeTab,
  onTabChange,
  theme,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onAddText,
  onAddImage,
  onSelectShape,
  onInsertTable,
  onBringForward,
  onSendBackward,
  onCopy,
  onPaste,
  onPresent,
  onExport,
  exporting,
  onGenerate,
  generating,
  snapToGrid,
  onSnapChange,
  zoom,
  onZoomChange,
  hasSelection,
  activeShapeTool,
  selectedTextElement,
  onUpdateTextStyle,
}: Props) {
  const tabs: { id: RibbonTab; label: string }[] = [
    { id: 'start', label: '开始' },
    { id: 'insert', label: '插入' },
    { id: 'view', label: '视图' },
  ];

  return (
    <div className="ribbon">
      <div className="ribbon-header">
        {titleBar && <div className="ribbon-title">{titleBar}</div>}
        <div className="ribbon-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ribbon-tab ${activeTab === t.id ? 'ribbon-tab--active' : ''}`}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ribbon-panel">
        {activeTab === 'start' && (
          <>
            {selectedTextElement && onUpdateTextStyle && (
              <Group label="文本">
                <TextFormatControls
                  style={selectedTextElement.style ?? {}}
                  theme={theme}
                  onChange={onUpdateTextStyle}
                  variant="ribbon"
                />
              </Group>
            )}
            <Group label="剪贴板">
              <Tool icon="↩" label="撤销" onClick={onUndo} disabled={!canUndo} />
              <Tool icon="↪" label="重做" onClick={onRedo} disabled={!canRedo} />
              <Tool icon="⎘" label="复制" onClick={onCopy} disabled={!hasSelection} />
              <Tool icon="📋" label="粘贴" onClick={onPaste} />
            </Group>
            <Group label="幻灯片">
              <Tool icon="＋" label="新建" onClick={onAddSlide} />
              <Tool icon="📄" label="复制页" onClick={onDuplicateSlide} />
              <Tool icon="🗑" label="删除页" onClick={onDeleteSlide} />
            </Group>
            <Group label="排列">
              <Tool icon="↑" label="上移" onClick={onBringForward} disabled={!hasSelection} />
              <Tool icon="↓" label="下移" onClick={onSendBackward} disabled={!hasSelection} />
            </Group>
            <Group label="输出">
              <Tool icon="▶" label="演示" onClick={onPresent} />
              <Tool icon="⬇" label={exporting ? '导出中' : '导出'} onClick={onExport} disabled={exporting} />
            </Group>
            <div className="ribbon-ai">
              <GeneratePanel onGenerate={onGenerate} loading={generating} />
            </div>
          </>
        )}

        {activeTab === 'insert' && (
          <>
            <Group label="文本">
              <Tool icon="T" label="文本框" onClick={onAddText} accent />
            </Group>
            <Group label="图像">
              <Tool icon="🖼" label="图片" onClick={onAddImage} accent />
            </Group>
            <Group label="形状">
              <ShapePicker theme={theme} activeTool={activeShapeTool ?? null} onSelect={onSelectShape} />
            </Group>
            <Group label="表格">
              <TablePicker onInsert={onInsertTable} />
            </Group>
          </>
        )}

        {activeTab === 'view' && (
          <>
            <Group label="显示">
              <label className="ribbon-check">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => onSnapChange(e.target.checked)}
                />
                吸附网格
              </label>
            </Group>
            <Group label="缩放">
              <select
                className="ribbon-select"
                value={zoom}
                onChange={(e) => onZoomChange(Number(e.target.value))}
              >
                <option value={75}>75%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
              </select>
            </Group>
          </>
        )}
      </div>
    </div>
  );
}
