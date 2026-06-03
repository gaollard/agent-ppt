import { useRef } from 'react';
import type {
  PresentationTheme,
  SlideContent,
  SlideElement,
} from '../../types/presentation';
import {
  createTextElement,
  createImageElement,
  createShapeElement,
} from '../../utils/slide-elements';
import { alignElement, readImageFile } from '../../utils/editor-utils';
import './ElementInspector.css';

interface Props {
  slide: SlideContent;
  theme: PresentationTheme;
  selectedIds: string[];
  onChange: (slide: SlideContent) => void;
  onCommit: (slide: SlideContent) => void;
  onSelect: (ids: string[]) => void;
}

export function ElementInspector({
  slide,
  theme,
  selectedIds,
  onChange,
  onCommit,
  onSelect,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const elements = slide.elements ?? [];
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selected = selectedId ? elements.find((e) => e.id === selectedId) : undefined;

  const updateSlide = (patch: Partial<SlideContent>, record = true) => {
    const next = { ...slide, ...patch };
    onChange(next);
    if (record) onCommit(next);
  };

  const updateElement = (patch: Partial<SlideElement>, record = false) => {
    if (!selected) return;
    const next = {
      ...slide,
      elements: elements.map((e) => (e.id === selected.id ? { ...e, ...patch } : e)),
    };
    onChange(next);
    if (record) onCommit(next);
  };

  const updateStyle = (patch: Partial<NonNullable<SlideElement['style']>>, record = false) => {
    updateElement({ style: { ...selected?.style, ...patch } }, record);
  };

  const deleteSelected = () => {
    const idSet = new Set(selectedIds);
    const next = {
      ...slide,
      elements: elements.filter((e) => !idSet.has(e.id)),
    };
    onChange(next);
    onCommit(next);
    onSelect([]);
  };

  const handleAlign = (action: Parameters<typeof alignElement>[1]) => {
    if (!selected) return;
    updateElement(alignElement(selected, action), true);
  };

  const handleImageUpload = async (file: File) => {
    const dataUrl = await readImageFile(file);
    if (selected?.type === 'image') {
      updateElement({ imagePath: dataUrl });
    } else {
      updateSlide({ backgroundImage: dataUrl });
    }
  };

  if (selectedIds.length > 1) {
    return (
      <div className="element-inspector">
        <h3>已选中 {selectedIds.length} 个元素</h3>
        <p className="element-inspector-hint">拖动可批量移动，Delete 删除全部选中元素</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={deleteSelected}>
          删除选中
        </button>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="element-inspector">
        <h3>幻灯片</h3>

        <div className="field">
          <label>背景色</label>
          <div className="color-input-row">
            <input
              type="color"
              value={`#${slide.backgroundColor ?? theme.background}`}
              onChange={(e) =>
                updateSlide({ backgroundColor: e.target.value.replace('#', '') })
              }
            />
            <input
              type="text"
              value={slide.backgroundColor ?? theme.background}
              onChange={(e) =>
                updateSlide({ backgroundColor: e.target.value.replace('#', '') })
              }
            />
          </div>
        </div>

        <div className="field">
          <label>背景图 URL</label>
          <textarea
            rows={2}
            value={slide.backgroundImage ?? ''}
            onChange={(e) =>
              updateSlide({ backgroundImage: e.target.value || undefined })
            }
            placeholder="https://... 或 data:image/..."
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => fileRef.current?.click()}
          >
            上传背景图
          </button>
        </div>

        <div className="field">
          <label>演讲者备注</label>
          <textarea
            rows={3}
            value={slide.notes ?? ''}
            onChange={(e) => updateSlide({ notes: e.target.value })}
            placeholder="仅编辑器可见，不出现在幻灯片上"
          />
        </div>

        <h3 className="element-inspector-sub">添加元素</h3>
        <div className="element-inspector-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const el = createTextElement({ x: 15, y: 20, w: 40, h: 20, content: '文本框' });
              const next = { ...slide, elements: [...elements, el] };
              onChange(next);
              onCommit(next);
              onSelect([el.id]);
            }}
          >
            + 文本框
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const el = createImageElement({ x: 20, y: 20, w: 35, h: 45 });
              const next = { ...slide, elements: [...elements, el] };
              onChange(next);
              onCommit(next);
              onSelect([el.id]);
            }}
          >
            + 图片
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const el = createShapeElement('rect', { x: 30, y: 30, w: 25, h: 25 });
              const next = { ...slide, elements: [...elements, el] };
              onChange(next);
              onCommit(next);
              onSelect([el.id]);
            }}
          >
            + 矩形
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const el = createShapeElement('ellipse', { x: 30, y: 30, w: 25, h: 25 });
              const next = { ...slide, elements: [...elements, el] };
              onChange(next);
              onCommit(next);
              onSelect([el.id]);
            }}
          >
            + 椭圆
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImageUpload(file);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  const typeLabel =
    selected.type === 'text'
      ? '文本框'
      : selected.type === 'image'
        ? '图片'
        : selected.type === 'table'
          ? '表格'
          : '形状';

  return (
    <div className="element-inspector">
      <div className="element-inspector-header">
        <h3>{typeLabel}</h3>
        <button
          type="button"
          className="btn btn-ghost btn-sm element-inspector-delete"
          onClick={deleteSelected}
          disabled={selected.locked}
        >
          删除
        </button>
      </div>

      <div className="align-grid">
        {(
          [
            ['left', '←'],
            ['center-h', '↔'],
            ['right', '→'],
            ['top', '↑'],
            ['center-v', '↕'],
            ['bottom', '↓'],
          ] as const
        ).map(([action, label]) => (
          <button
            key={action}
            type="button"
            className="align-btn"
            title={action}
            onClick={() => handleAlign(action)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="field-row field-row--check">
        <label>
          <input
            type="checkbox"
            checked={Boolean(selected.locked)}
            onChange={(e) => updateElement({ locked: e.target.checked }, true)}
          />
          锁定位置
        </label>
      </div>

      <div className="field-row">
        <label>旋转</label>
        <input
          type="range"
          min={-180}
          max={180}
          value={selected.rotation ?? 0}
          onChange={(e) => updateElement({ rotation: Number(e.target.value) }, false)}
          onMouseUp={(e) => updateElement({ rotation: Number((e.target as HTMLInputElement).value) }, true)}
          onTouchEnd={(e) => updateElement({ rotation: Number((e.target as HTMLInputElement).value) }, true)}
        />
        <span className="field-row-value">{selected.rotation ?? 0}°</span>
      </div>

      <div className="field-row">
        <label>X</label>
        <input
          type="number"
          value={Math.round(selected.x)}
          onChange={(e) => updateElement({ x: Number(e.target.value) }, false)}
          onBlur={(e) => updateElement({ x: Number(e.target.value) }, true)}
        />
        <label>Y</label>
        <input
          type="number"
          value={Math.round(selected.y)}
          onChange={(e) => updateElement({ y: Number(e.target.value) }, false)}
          onBlur={(e) => updateElement({ y: Number(e.target.value) }, true)}
        />
      </div>
      <div className="field-row">
        <label>宽</label>
        <input
          type="number"
          value={Math.round(selected.w)}
          onChange={(e) => updateElement({ w: Number(e.target.value) }, false)}
          onBlur={(e) => updateElement({ w: Number(e.target.value) }, true)}
        />
        <label>高</label>
        <input
          type="number"
          value={Math.round(selected.h)}
          onChange={(e) => updateElement({ h: Number(e.target.value) }, false)}
          onBlur={(e) => updateElement({ h: Number(e.target.value) }, true)}
        />
      </div>

      {selected.type === 'text' && (
        <>
          <div className="field">
            <label>内容</label>
            <textarea
              rows={5}
              value={selected.content ?? ''}
              onChange={(e) => updateElement({ content: e.target.value }, false)}
              onBlur={(e) => updateElement({ content: e.target.value }, true)}
            />
          </div>
          <div className="field-row">
            <label>字号</label>
            <input
              type="number"
              min={8}
              max={96}
              value={selected.style?.fontSize ?? 16}
              onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
            />
            <label>颜色</label>
            <input
              type="color"
              value={`#${selected.style?.color ?? theme.text}`}
              onChange={(e) => updateStyle({ color: e.target.value.replace('#', '') })}
            />
          </div>
          <div className="field-row">
            <label>对齐</label>
            <select
              value={selected.style?.align ?? 'left'}
              onChange={(e) =>
                updateStyle({ align: e.target.value as 'left' | 'center' | 'right' })
              }
            >
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
          </div>
          <div className="field-row field-row--check">
            <label>
              <input
                type="checkbox"
                checked={selected.style?.fontWeight === 'bold'}
                onChange={(e) =>
                  updateStyle({ fontWeight: e.target.checked ? 'bold' : 'normal' })
                }
              />
              粗体
            </label>
            <label>
              <input
                type="checkbox"
                checked={Boolean(selected.style?.bullets)}
                onChange={(e) => updateStyle({ bullets: e.target.checked })}
              />
              项目符号
            </label>
          </div>
        </>
      )}

      {selected.type === 'image' && (
        <>
          <div className="field">
            <label>图片 URL / Base64</label>
            <textarea
              rows={3}
              value={selected.imagePath ?? ''}
              onChange={(e) => updateElement({ imagePath: e.target.value })}
            />
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => fileRef.current?.click()}
          >
            上传图片
          </button>
        </>
      )}

      {selected.type === 'shape' && (
        <>
          <div className="field-row">
            <label>填充</label>
            <input
              type="color"
              value={`#${selected.style?.fill ?? theme.accent}`}
              onChange={(e) => updateStyle({ fill: e.target.value.replace('#', '') })}
            />
            <label>边框</label>
            <input
              type="color"
              value={`#${selected.style?.borderColor ?? theme.primary}`}
              onChange={(e) => updateStyle({ borderColor: e.target.value.replace('#', '') })}
            />
          </div>
          <div className="field-row">
            <label>线宽</label>
            <input
              type="number"
              min={0}
              max={10}
              value={selected.style?.borderWidth ?? 1}
              onChange={(e) => updateStyle({ borderWidth: Number(e.target.value) })}
            />
            <label>透明度</label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={selected.style?.opacity ?? 1}
              onChange={(e) => updateStyle({ opacity: Number(e.target.value) })}
            />
          </div>
        </>
      )}

      {selected.type === 'table' && selected.table && (
        <>
          <p className="element-inspector-hint">
            {selected.table.cols} 列 × {selected.table.rows} 行 · 双击单元格编辑
          </p>
          <div className="field-row">
            <label>字号</label>
            <input
              type="number"
              min={8}
              max={48}
              value={selected.style?.fontSize ?? 12}
              onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
            />
            <label>对齐</label>
            <select
              value={selected.style?.align ?? 'center'}
              onChange={(e) =>
                updateStyle({ align: e.target.value as 'left' | 'center' | 'right' })
              }
            >
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
          </div>
          <div className="field-row">
            <label>边框</label>
            <input
              type="color"
              value={`#${selected.style?.borderColor ?? 'CBD5E1'}`}
              onChange={(e) => updateStyle({ borderColor: e.target.value.replace('#', '') })}
            />
          </div>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImageUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
