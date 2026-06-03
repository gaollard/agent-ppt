import {
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
  onDuplicate: (index: number) => void;
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
  const bg = slide.backgroundColor ?? background;

  if (slide.elements?.length) {
    return (
      <div className="mini-preview" style={{ background: `#${bg}` }}>
        {slide.elements.map((el) => (
          <div
            key={el.id}
            className={`mini-el mini-el--${el.type}`}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
              background: el.style?.background ? `#${el.style.background}` : undefined,
              zIndex: el.zIndex,
            }}
          >
            {el.type === 'image' && el.imagePath && <img src={el.imagePath} alt="" />}
          </div>
        ))}
      </div>
    );
  }

  const layout = resolveLayout(slide, index);
  const title = slide.title || `幻灯片 ${index + 1}`;

  if (layout === 'cover' || layout === 'full-image') {
    const hasImage = Boolean(slide.imagePath);
    return (
      <div className="mini-preview" style={hasImage ? undefined : { background: `#${primary}` }}>
        {hasImage && <img className="mini-preview-cover-img" src={slide.imagePath} alt="" />}
        <span className="mini-preview-title">{title.slice(0, 12)}</span>
      </div>
    );
  }

  return (
    <div className="mini-preview mini-preview--bullets" style={{ background: `#${bg}` }}>
      <strong style={{ color: `#${primary}` }}>{title.slice(0, 14)}</strong>
      <div className="mini-preview-lines">
        <i style={{ background: `#${accent}` }} />
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
  onDuplicate,
  onAdd,
}: Props) {
  const theme = mergeTheme(content.theme);

  return (
    <aside className="slide-list">
      <div className="slide-list-items">
        {content.slides.map((slide, i) => (
          <div
            key={i}
            className={`slide-list-item ${i === activeIndex ? 'slide-list-item--active' : ''}`}
          >
            <span className="slide-list-num">{i + 1}</span>
            <button
              type="button"
              className="slide-list-thumb"
              onClick={() => onSelect(i)}
            >
              <MiniPreview
                slide={slide}
                index={i}
                primary={theme.primary}
                accent={theme.accent}
                background={theme.background}
              />
            </button>
            <div className="slide-list-actions">
              <button type="button" disabled={i === 0} onClick={() => onReorder(i, i - 1)} title="上移">↑</button>
              <button
                type="button"
                disabled={i === content.slides.length - 1}
                onClick={() => onReorder(i, i + 1)}
                title="下移"
              >
                ↓
              </button>
              <button type="button" onClick={() => onDuplicate(i)} title="复制">⎘</button>
              <button
                type="button"
                disabled={content.slides.length <= 1}
                onClick={() => onDelete(i)}
                title="删除"
                className="slide-list-delete"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="slide-list-add" onClick={onAdd}>
        + 新建幻灯片
      </button>
    </aside>
  );
}
