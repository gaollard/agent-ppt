import type { ElementStyle, PresentationTheme } from '../../types/presentation';
import {
  TEXT_FONT_FAMILIES,
  TEXT_FONT_SIZES,
  LINE_HEIGHT_OPTIONS,
  INDENT_STEP,
  clampFontSize,
} from '../../utils/text-format';
import {
  applySelectionFormat,
  getActiveEditor,
  hasTextSelection,
  toggleSelectionFormat,
} from '../../utils/rich-text';
import { FillBorderControls } from './FillBorderControls';
import './text-format.css';

export interface TextFormatControlsProps {
  style: ElementStyle;
  theme: PresentationTheme;
  onChange: (patch: Partial<ElementStyle>) => void;
  variant?: 'ribbon' | 'floating';
  showFillBorder?: boolean;
  /** @deprecated Auto-detected from active text editor; kept for API compatibility */
  selectionMode?: boolean;
}

function ToggleBtn({
  label,
  active,
  onClick,
  className,
  title,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={`text-format-btn ${active ? 'text-format-btn--active' : ''} ${className ?? ''}`}
      onClick={onClick}
      title={title ?? label}
    >
      {label}
    </button>
  );
}

export function TextFormatControls({
  style,
  theme,
  onChange,
  variant = 'ribbon',
  showFillBorder = true,
}: TextFormatControlsProps) {
  const fontSize = style.fontSize ?? 16;
  const textColor = style.color ?? theme.text;
  const highlight = style.highlight ?? 'FFFF00';
  const lineHeight = style.lineHeight ?? 1.25;
  const marginLeft = style.marginLeft ?? 0;

  const editor = getActiveEditor();
  const useSelection = Boolean(editor && hasTextSelection(editor));

  const applyFormat = (patch: Partial<ElementStyle>) => {
    if (useSelection && editor) {
      const applied = applySelectionFormat(
        {
          fontSize: patch.fontSize,
          fontWeight: patch.fontWeight,
          fontStyle: patch.fontStyle,
          underline: patch.underline,
          strikethrough: patch.strikethrough,
          color: patch.color,
          highlight: patch.highlight,
          fontFamily: patch.fontFamily,
        },
        editor,
      );
      if (applied) return;
    }
    onChange(patch);
  };

  const toggleFormat = (
    key: 'fontWeight' | 'fontStyle' | 'underline' | 'strikethrough',
    active: boolean,
    patch: Partial<ElementStyle>,
  ) => {
    if (useSelection && editor) {
      if (toggleSelectionFormat(key, active, editor)) return;
    }
    onChange(patch);
  };

  const stepSize = (delta: number) => {
    const sizes = TEXT_FONT_SIZES;
    const idx = sizes.findIndex((n) => n >= fontSize);
    const base = idx >= 0 ? idx : sizes.length - 1;
    const nextIdx = Math.min(sizes.length - 1, Math.max(0, base + delta));
    applyFormat({ fontSize: sizes[nextIdx] });
  };

  return (
    <div className={`text-format text-format--${variant}`} onPointerDown={(e) => e.stopPropagation()}>
      {showFillBorder && (
        <>
          <FillBorderControls
            style={style}
            theme={theme}
            onChange={onChange}
            fillKey="background"
          />
          <span className="text-format-divider" />
        </>
      )}

      <select
        className="text-format-select text-format-select--font"
        value={style.fontFamily ?? ''}
        onChange={(e) => applyFormat({ fontFamily: e.target.value || undefined })}
        title="字体"
      >
        {TEXT_FONT_FAMILIES.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <div className="text-format-size">
        <button type="button" onClick={() => stepSize(-1)} title="减小字号">
          −
        </button>
        <input
          type="number"
          min={8}
          max={96}
          value={fontSize}
          onChange={(e) => applyFormat({ fontSize: clampFontSize(Number(e.target.value) || 16) })}
          title="字号"
        />
        <button type="button" onClick={() => stepSize(1)} title="增大字号">
          +
        </button>
      </div>

      <span className="text-format-divider" />

      <ToggleBtn
        label="B"
        active={style.fontWeight === 'bold'}
        onClick={() =>
          toggleFormat('fontWeight', style.fontWeight === 'bold', {
            fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold',
          })
        }
        title="粗体"
      />
      <ToggleBtn
        label="I"
        active={style.fontStyle === 'italic'}
        className="text-format-btn--italic"
        onClick={() =>
          toggleFormat('fontStyle', style.fontStyle === 'italic', {
            fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic',
          })
        }
        title="斜体"
      />
      <ToggleBtn
        label="U"
        active={Boolean(style.underline)}
        className="text-format-btn--underline"
        onClick={() =>
          toggleFormat('underline', Boolean(style.underline), {
            underline: !style.underline,
          })
        }
        title="下划线"
      />
      <ToggleBtn
        label="S"
        active={Boolean(style.strikethrough)}
        className="text-format-btn--strike"
        onClick={() =>
          toggleFormat('strikethrough', Boolean(style.strikethrough), {
            strikethrough: !style.strikethrough,
          })
        }
        title="删除线"
      />

      <span className="text-format-divider" />

      <label className="text-format-color" title="文字颜色">
        <span className="text-format-color-letter" style={{ color: `#${textColor}` }}>
          A
        </span>
        <span className="text-format-color-bar" style={{ background: `#${textColor}` }} />
        <input
          type="color"
          value={`#${textColor}`}
          onChange={(e) => applyFormat({ color: e.target.value.replace('#', '') })}
        />
      </label>

      <label className="text-format-highlight" title="文本突出显示">
        <span className="text-format-highlight-icon">🖍</span>
        <span
          className="text-format-highlight-bar"
          style={{ background: style.highlight ? `#${style.highlight}` : '#dadce0' }}
        />
        <input
          type="color"
          value={`#${highlight}`}
          onChange={(e) => applyFormat({ highlight: e.target.value.replace('#', '') })}
          onDoubleClick={(e) => {
            e.preventDefault();
            applyFormat({ highlight: undefined });
          }}
        />
      </label>

      <span className="text-format-divider" />

      <div className="text-format-align-group">
        {(
          [
            ['left', '左'],
            ['center', '中'],
            ['right', '右'],
          ] as const
        ).map(([align, icon]) => (
          <ToggleBtn
            key={align}
            label={icon}
            active={(style.align ?? 'left') === align}
            className={`text-format-btn--align text-format-btn--align-${align}`}
            onClick={() => onChange({ align })}
            title={align === 'left' ? '左对齐' : align === 'center' ? '居中' : '右对齐'}
          />
        ))}
      </div>

      <ToggleBtn
        label="•"
        active={Boolean(style.bullets)}
        onClick={() => onChange({ bullets: !style.bullets })}
        title="项目符号"
      />

      <span className="text-format-divider" />

      <select
        className="text-format-select text-format-select--line-height"
        value={lineHeight}
        onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
        title="行距"
      >
        {LINE_HEIGHT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <ToggleBtn
        label="⇤"
        onClick={() => onChange({ marginLeft: Math.max(0, marginLeft - INDENT_STEP) })}
        title="减少缩进"
      />
      <ToggleBtn
        label="⇥"
        onClick={() => onChange({ marginLeft: marginLeft + INDENT_STEP })}
        title="增加缩进"
      />
    </div>
  );
}
