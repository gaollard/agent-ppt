import {
  LAYOUT_LABELS,
  mergeTheme,
  type PresentationContent,
  type SlideContent,
  type SlideLayout,
} from '../../types/presentation';
import './SlideList.css';

interface Props {
  content: PresentationContent;
  activeIndex: number;
  onSelect: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}

function resolveLayout(slide: SlideContent, index: number): SlideLayout {
  return slide.layout ?? (index === 0 ? 'cover' : 'title-bullets');
}

function MiniPreview({
  slide,
  index,
  primary,
  accent,
  background,
}: {
  slide: SlideContent;
  index: number;
  primary: string;
  accent: string;
  background: string;
}) {
  const layout = resolveLayout(slide, index);
  const title = slide.title || `幻灯片 ${index + 1}`;

  if (layout === 'cover' || layout === 'full-image') {
    const hasImage = Boolean(slide.imagePath);
    return (
      <div
        className="mini-preview mini-preview--cover"
        style={hasImage ? undefined : { background: `#${primary}` }}
      >
        {hasImage && <img src={slide.imagePath} alt="" />}
        <span>{title}</span>
      </div>
    );
  }

  if (layout === 'image-left' || layout === 'image-right') {
    return (
      <div className="mini-preview mini-preview--split" style={{ background: `#${background}` }}>
        <div className={`mini-preview-split ${layout === 'image-right' ? 'mini-preview-split--reverse' : ''}`}>
          <div className="mini-preview-image">
            {slide.imagePath ? <img src={slide.imagePath} alt="" /> : null}
          </div>
          <div className="mini-preview-lines">
            <i style={{ background: `#${accent}` }} />
            <i />
            <i />
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'two-column') {
    return (
      <div className="mini-preview mini-preview--two-col" style={{ background: `#${background}` }}>
        <div />
        <div style={{ background: `#${accent}` }} />
        <div />
      </div>
    );
  }

  if (layout === 'chart') {
    return (
      <div className="mini-preview mini-preview--chart" style={{ background: `#${background}` }}>
        <div className="mini-preview-bars">
          {[0.6, 0.9, 0.45, 0.75].map((h, i) => (
            <span
              key={i}
              style={{
                height: `${h * 100}%`,
                background: i % 2 === 0 ? `#${primary}` : `#${accent}`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mini-preview mini-preview--bullets" style={{ background: `#${background}` }}>
      <strong style={{ color: `#${primary}` }}>{title.slice(0, 18)}</strong>
      <div className="mini-preview-lines">
        <i style={{ background: `#${accent}` }} />
        <i />
        <i />
      </div>
    </div>
  );
}

export function SlideList({
  content,
  activeIndex,
  onSelect,
  onReorder,
  onDelete,
  onAdd,
}: Props) {
  const theme = mergeTheme(content.theme);

  return (
    <aside className="slide-list">
      <div className="slide-list-header">
        <h3>幻灯片</h3>
        <span className="slide-list-count">{content.slides.length} 页</span>
      </div>

      <div className="slide-list-items">
        {content.slides.map((slide, i) => {
          const layout = resolveLayout(slide, i);
          return (
            <div
              key={i}
              className={`slide-list-item ${i === activeIndex ? 'slide-list-item--active' : ''}`}
            >
              <button
                type="button"
                className="slide-list-card"
                onClick={() => onSelect(i)}
              >
                <span className="slide-list-num">{i + 1}</span>
                <MiniPreview
                  slide={slide}
                  index={i}
                  primary={theme.primary}
                  accent={theme.accent}
                  background={theme.background}
                />
                <div className="slide-list-info">
                  <span className="slide-list-title">{slide.title}</span>
                  <span className="slide-list-layout">{LAYOUT_LABELS[layout]}</span>
                </div>
              </button>

              <div className="slide-list-actions">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => onReorder(i, i - 1)}
                  title="上移"
                  aria-label="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === content.slides.length - 1}
                  onClick={() => onReorder(i, i + 1)}
                  title="下移"
                  aria-label="下移"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={content.slides.length <= 1}
                  onClick={() => onDelete(i)}
                  title="删除"
                  aria-label="删除"
                  className="slide-list-delete"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" className="slide-list-add" onClick={onAdd}>
        + 添加幻灯片
      </button>
    </aside>
  );
}
