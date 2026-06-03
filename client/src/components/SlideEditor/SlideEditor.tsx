import {
  SLIDE_LAYOUTS,
  LAYOUT_LABELS,
  type SlideContent,
  type SlideLayout,
} from '../../types/presentation';
import './SlideEditor.css';

interface Props {
  slide: SlideContent;
  index: number;
  onChange: (slide: SlideContent) => void;
}

function TextList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {items.map((item, i) => (
        <div key={i} className="text-list-row">
          <textarea
            value={item}
            rows={2}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={`第 ${i + 1} 项`}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            disabled={items.length <= 1}
          >
            删除
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => onChange([...items, ''])}
      >
        + 添加项
      </button>
    </div>
  );
}

export function SlideEditor({ slide, index, onChange }: Props) {
  const update = (patch: Partial<SlideContent>) => onChange({ ...slide, ...patch });

  return (
    <div className="slide-editor">
      <h3>编辑 · 第 {index + 1} 页</h3>

      <div className="field">
        <label>标题</label>
        <input
          value={slide.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </div>

      <div className="field">
        <label>版式</label>
        <select
          value={slide.layout ?? (index === 0 ? 'cover' : 'title-bullets')}
          onChange={(e) => update({ layout: e.target.value as SlideLayout })}
        >
          {SLIDE_LAYOUTS.map((l) => (
            <option key={l} value={l}>
              {LAYOUT_LABELS[l]}
            </option>
          ))}
        </select>
      </div>

      <TextList
        label="要点"
        items={slide.bullets}
        onChange={(bullets) => update({ bullets })}
      />

      {['cover', 'full-image', 'image-left', 'image-right'].includes(
        slide.layout ?? '',
      ) && (
        <div className="field">
          <label>图片 URL / Base64</label>
          <textarea
            value={slide.imagePath ?? ''}
            onChange={(e) => update({ imagePath: e.target.value || undefined })}
            rows={3}
            placeholder="data:image/... 或 https://..."
          />
        </div>
      )}

      {slide.layout === 'two-column' && (
        <>
          <div className="field">
            <label>右栏标题</label>
            <input
              value={slide.columnB?.title ?? ''}
              onChange={(e) =>
                update({
                  columnB: {
                    title: e.target.value,
                    bullets: slide.columnB?.bullets ?? [''],
                  },
                })
              }
            />
          </div>
          <TextList
            label="右栏要点"
            items={slide.columnB?.bullets ?? ['']}
            onChange={(bullets) =>
              update({
                columnB: {
                  title: slide.columnB?.title ?? '右栏',
                  bullets,
                },
              })
            }
          />
        </>
      )}

      {slide.layout === 'chart' && (
        <>
          <div className="field">
            <label>图表类型</label>
            <select
              value={slide.chart?.type ?? 'bar'}
              onChange={(e) =>
                update({
                  chart: {
                    type: e.target.value as 'bar' | 'line' | 'pie',
                    labels: slide.chart?.labels ?? ['A', 'B'],
                    values: slide.chart?.values ?? [10, 20],
                  },
                })
              }
            >
              <option value="bar">柱状图</option>
              <option value="line">折线图</option>
              <option value="pie">饼图</option>
            </select>
          </div>
          <TextList
            label="标签"
            items={slide.chart?.labels ?? ['A', 'B']}
            onChange={(labels) =>
              update({
                chart: {
                  type: slide.chart?.type ?? 'bar',
                  labels,
                  values:
                    slide.chart?.values?.slice(0, labels.length) ??
                    labels.map(() => 0),
                },
              })
            }
          />
          <div className="field">
            <label>数值（逗号分隔）</label>
            <input
              value={(slide.chart?.values ?? []).join(', ')}
              onChange={(e) => {
                const values = e.target.value
                  .split(',')
                  .map((s) => parseFloat(s.trim()))
                  .filter((n) => !Number.isNaN(n));
                update({
                  chart: {
                    type: slide.chart?.type ?? 'bar',
                    labels: slide.chart?.labels ?? [],
                    values,
                  },
                });
              }}
              placeholder="10, 20, 30"
            />
          </div>
        </>
      )}
    </div>
  );
}
