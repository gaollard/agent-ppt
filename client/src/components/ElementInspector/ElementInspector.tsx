import type { SlideContent, SlideElement } from '../../types/presentation';
import { createTextElement, createImageElement } from '../../utils/slide-elements';
import './ElementInspector.css';

interface Props {
  slide: SlideContent;
  selectedId: string | null;
  onChange: (slide: SlideContent) => void;
  onSelect: (id: string | null) => void;
}

export function ElementInspector({ slide, selectedId, onChange, onSelect }: Props) {
  const elements = slide.elements ?? [];
  const selected = elements.find((e) => e.id === selectedId);

  const updateElement = (patch: Partial<SlideElement>) => {
    if (!selected) return;
    onChange({
      ...slide,
      elements: elements.map((e) => (e.id === selected.id ? { ...e, ...patch } : e)),
    });
  };

  const updateStyle = (patch: Partial<NonNullable<SlideElement['style']>>) => {
    updateElement({ style: { ...selected?.style, ...patch } });
  };

  const deleteSelected = () => {
    onChange({
      ...slide,
      elements: elements.filter((e) => e.id !== selectedId),
    });
    onSelect(null);
  };

  if (!selected) {
    return (
      <div className="element-inspector">
        <h3>属性</h3>
        <p className="element-inspector-empty">
          点击画布上的元素进行编辑，或使用工具栏添加文本框 / 图片。
        </p>
        <div className="element-inspector-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const el = createTextElement({ x: 15, y: 20, w: 40, h: 20, content: '文本框' });
              onChange({ ...slide, elements: [...elements, el] });
              onSelect(el.id);
            }}
          >
            + 文本框
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const el = createImageElement({ x: 20, y: 20, w: 35, h: 45 });
              onChange({ ...slide, elements: [...elements, el] });
              onSelect(el.id);
            }}
          >
            + 图片
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="element-inspector">
      <div className="element-inspector-header">
        <h3>{selected.type === 'text' ? '文本框' : '图片'}</h3>
        <button type="button" className="btn btn-ghost btn-sm element-inspector-delete" onClick={deleteSelected}>
          删除
        </button>
      </div>

      <div className="field-row">
        <label>X</label>
        <input
          type="number"
          value={Math.round(selected.x)}
          onChange={(e) => updateElement({ x: Number(e.target.value) })}
        />
        <label>Y</label>
        <input
          type="number"
          value={Math.round(selected.y)}
          onChange={(e) => updateElement({ y: Number(e.target.value) })}
        />
      </div>
      <div className="field-row">
        <label>宽</label>
        <input
          type="number"
          value={Math.round(selected.w)}
          onChange={(e) => updateElement({ w: Number(e.target.value) })}
        />
        <label>高</label>
        <input
          type="number"
          value={Math.round(selected.h)}
          onChange={(e) => updateElement({ h: Number(e.target.value) })}
        />
      </div>

      {selected.type === 'text' && (
        <>
          <div className="field">
            <label>内容</label>
            <textarea
              rows={5}
              value={selected.content ?? ''}
              onChange={(e) => updateElement({ content: e.target.value })}
            />
          </div>
          <div className="field-row">
            <label>字号</label>
            <input
              type="number"
              min={8}
              max={72}
              value={selected.style?.fontSize ?? 16}
              onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
            />
            <label>颜色</label>
            <input
              type="text"
              value={selected.style?.color ?? '344054'}
              onChange={(e) => updateStyle({ color: e.target.value.replace('#', '') })}
              placeholder="344054"
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
        <div className="field">
          <label>图片 URL / Base64</label>
          <textarea
            rows={4}
            value={selected.imagePath ?? ''}
            onChange={(e) => updateElement({ imagePath: e.target.value })}
            placeholder="data:image/... 或 https://..."
          />
        </div>
      )}
    </div>
  );
}
