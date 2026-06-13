import type { ElementStyle, PresentationTheme } from '../../types/presentation';

export type FillStyleKey = 'background' | 'fill';

export interface FillBorderControlsProps {
  style: ElementStyle;
  theme: PresentationTheme;
  onChange: (patch: Partial<ElementStyle>) => void;
  fillKey?: FillStyleKey;
  fillDefault?: string;
  borderDefault?: string;
  showFill?: boolean;
  showBorder?: boolean;
}

export function FillBorderControls({
  style,
  theme,
  onChange,
  fillKey = 'background',
  fillDefault,
  borderDefault,
  showFill = true,
  showBorder = true,
}: FillBorderControlsProps) {
  const defaultFill = fillDefault ?? (fillKey === 'fill' ? theme.accent : 'FFFFFF');
  const defaultBorder = borderDefault ?? theme.primary;
  const fillValue = (fillKey === 'fill' ? style.fill : style.background) ?? defaultFill;
  const borderColor = style.borderColor ?? defaultBorder;
  const borderWidth = style.borderWidth ?? 1;

  if (!showFill && !showBorder) return null;

  return (
    <>
      {showFill && (
        <label className="text-format-fill" title="填充色 (Fill)">
          <span className="text-format-fill-icon">🪣</span>
          <span
            className="text-format-fill-swatch"
            style={{ background: `#${fillValue}` }}
          />
          <input
            type="color"
            value={`#${fillValue}`}
            onChange={(e) =>
              onChange(
                fillKey === 'fill'
                  ? { fill: e.target.value.replace('#', '') }
                  : { background: e.target.value.replace('#', '') },
              )
            }
            onDoubleClick={(e) => {
              e.preventDefault();
              onChange(fillKey === 'fill' ? { fill: undefined } : { background: undefined });
            }}
          />
        </label>
      )}

      {showBorder && (
        <>
          <label className="text-format-border" title="边框色 (Border)">
            <span
              className="text-format-border-swatch"
              style={{ boxShadow: `inset 0 0 0 2px #${borderColor}` }}
            />
            <input
              type="color"
              value={`#${borderColor}`}
              onChange={(e) => {
              const borderColor = e.target.value.replace('#', '');
              onChange({ borderColor, borderWidth: style.borderWidth ?? 1 });
            }}
              onDoubleClick={(e) => {
                e.preventDefault();
                onChange({ borderColor: undefined, borderWidth: undefined });
              }}
            />
          </label>
          <label className="text-format-border-width" title="边框宽度">
            <input
              type="number"
              min={0}
              max={12}
              value={style.borderColor ? borderWidth : 0}
              disabled={!style.borderColor}
              onChange={(e) => onChange({ borderWidth: Number(e.target.value) })}
            />
            <span>px</span>
          </label>
        </>
      )}
    </>
  );
}

export function elementBoxStyle(style: ElementStyle | undefined) {
  const s = style ?? {};
  const fill = s.background ?? s.fill;
  const borderColor = s.borderColor;
  const borderWidth = s.borderWidth ?? (borderColor ? 1 : 0);

  return {
    background: fill ? `#${fill}` : undefined,
    border:
      borderColor && borderWidth > 0
        ? `${borderWidth}px solid #${borderColor}`
        : undefined,
  };
}
