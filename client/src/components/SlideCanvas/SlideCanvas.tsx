import type { SlideContent, PresentationTheme } from '../../types/presentation';
import { hexColor, themeVars, effectiveLayout } from '../slide-utils';
import './slide.css';

interface Props {
  slide: SlideContent;
  index: number;
  theme: PresentationTheme;
  compact?: boolean;
}

function Bullets({ items, color }: { items: string[]; color: string }) {
  if (!items.length) return null;
  return (
    <ul className="slide-bullets" style={{ color: `#${color}` }}>
      {items.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}

function toNumbers(values: number[]): number[] {
  return values.map((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || 0));
}

function ChartPreview({
  labels,
  values,
  type,
  theme,
}: {
  labels: string[];
  values: number[];
  type: 'bar' | 'line' | 'pie';
  theme: PresentationTheme;
}) {
  const nums = toNumbers(values);
  const max = Math.max(...nums, 1);
  const colors = [`#${theme.primary}`, `#${theme.accent}`, '#7A8A9A', '#B8C4D1', '#94A3B8'];

  const W = 640;
  const H = 240;
  const pad = { top: 16, right: 24, bottom: 32, left: 36 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  if (type === 'pie') {
    const total = nums.reduce((a, b) => a + b, 0) || 1;
    const cx = W / 2 - 60;
    const cy = H / 2;
    const r = Math.min(chartH, 80);
    let startAngle = -Math.PI / 2;

    const slices = nums.map((v, i) => {
      const angle = (v / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      startAngle += angle;
      const x2 = cx + r * Math.cos(startAngle);
      const y2 = cy + r * Math.sin(startAngle);
      const large = angle > Math.PI ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      return { d, color: colors[i % colors.length], label: labels[i] };
    });

    return (
      <div className="slide-chart">
        <svg viewBox={`0 0 ${W} ${H}`} className="slide-chart-svg" aria-hidden>
          {slices.map((s, i) => (
            <path key={i} d={s.d} fill={s.color} />
          ))}
          {slices.map((s, i) => (
            <text
              key={`l-${i}`}
              x={W - 140}
              y={pad.top + 18 + i * 20}
              fontSize={12}
              fill={`#${theme.text}`}
            >
              <tspan fill={s.color}>■ </tspan>
              {s.label}
            </text>
          ))}
        </svg>
      </div>
    );
  }

  const slotW = chartW / Math.max(nums.length, 1);

  const points = nums.map((v, i) => {
    const x = pad.left + slotW * i + slotW / 2;
    const y = pad.top + chartH - (v / max) * chartH;
    return { x, y, v, label: labels[i] ?? '' };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="slide-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="slide-chart-svg" aria-hidden>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.top + chartH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={pad.left}
                y1={y}
                x2={W - pad.right}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth={1}
              />
              {t > 0 && (
                <text x={pad.left - 8} y={y + 4} fontSize={10} fill="#94A3B8" textAnchor="end">
                  {Math.round(max * t)}
                </text>
              )}
            </g>
          );
        })}

        {type === 'line' && (
          <>
            <path d={linePath} fill="none" stroke={`#${theme.primary}`} strokeWidth={2.5} />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill={`#${theme.accent}`} />
            ))}
          </>
        )}

        {type === 'bar' &&
          points.map((p, i) => {
            const barW = slotW * 0.55;
            const barH = pad.top + chartH - p.y;
            return (
              <rect
                key={i}
                x={p.x - barW / 2}
                y={p.y}
                width={barW}
                height={barH}
                rx={4}
                fill={colors[i % colors.length]}
              />
            );
          })}

        {points.map((p, i) => (
          <text
            key={`label-${i}`}
            x={p.x}
            y={H - 10}
            fontSize={11}
            fill={`#${theme.text}`}
            textAnchor="middle"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function SlideCanvas({ slide, index, theme, compact }: Props) {
  const hasImage = Boolean(slide.imagePath);
  const chartValues = slide.chart?.values?.map((v) => Number(v) || 0) ?? [];
  const chartLabels = slide.chart?.labels ?? [];
  const hasChart = Boolean(
    chartValues.length &&
      chartLabels.length &&
      chartValues.length === chartLabels.length,
  );
  const hasColumnB = Boolean(slide.columnB?.bullets?.length);
  const layout = effectiveLayout(slide.layout, index, hasImage, hasChart, hasColumnB);

  const cls = ['slide-canvas', compact && 'slide-canvas--compact'].filter(Boolean).join(' ');

  if (layout === 'cover') {
    return (
      <div className={cls} style={themeVars(theme)}>
        {hasImage ? (
          <>
            <img src={slide.imagePath} alt="" className="slide-cover-bg" />
            <div
              className="slide-cover-overlay"
              style={{ background: hexColor(theme.primary, 0.55) }}
            />
          </>
        ) : (
          <div className="slide-cover-solid" style={{ background: `#${theme.primary}` }} />
        )}
        <div className="slide-cover-content">
          <h1>{slide.title}</h1>
          {slide.bullets[0] && <p>{slide.bullets[0]}</p>}
        </div>
      </div>
    );
  }

  if (layout === 'full-image') {
    return (
      <div className={cls} style={themeVars(theme)}>
        {hasImage ? (
          <>
            <img src={slide.imagePath} alt="" className="slide-full-bg" />
            <div
              className="slide-full-overlay"
              style={{ background: hexColor(theme.primary, 0.4) }}
            />
          </>
        ) : (
          <div className="slide-cover-solid" style={{ background: `#${theme.primary}` }} />
        )}
        <div className="slide-full-caption">
          <h2>{slide.title}</h2>
          {slide.bullets[0] && <p>{slide.bullets[0]}</p>}
        </div>
      </div>
    );
  }

  if (layout === 'image-left' || layout === 'image-right') {
    const imageFirst = layout === 'image-left';
    return (
      <div className={`${cls} slide-split`} style={themeVars(theme)}>
        <h2 className="slide-split-title">{slide.title}</h2>
        <div className={`slide-split-body ${imageFirst ? '' : 'slide-split-body--reverse'}`}>
          <div className="slide-split-image">
            {hasImage ? (
              <img src={slide.imagePath} alt="" />
            ) : (
              <div className="slide-image-placeholder">无图片</div>
            )}
          </div>
          <div className="slide-split-text">
            <Bullets items={slide.bullets} color={theme.text} />
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'two-column' && slide.columnB) {
    return (
      <div className={`${cls} slide-two-col`} style={themeVars(theme)}>
        <div className="slide-two-col-grid">
          <div>
            <h2>{slide.title}</h2>
            <Bullets items={slide.bullets} color={theme.text} />
          </div>
          <div className="slide-two-col-divider" style={{ background: `#${theme.accent}` }} />
          <div>
            <h2>{slide.columnB.title}</h2>
            <Bullets items={slide.columnB.bullets} color={theme.text} />
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'chart' && slide.chart) {
    return (
      <div className={`${cls} slide-chart-layout`} style={themeVars(theme)}>
        <h2>{slide.title}</h2>
        <ChartPreview
          labels={chartLabels}
          values={chartValues}
          type={slide.chart.type}
          theme={theme}
        />
      </div>
    );
  }

  return (
    <div className={`${cls} slide-bullets-layout`} style={themeVars(theme)}>
      <h2>{slide.title}</h2>
      <div className="slide-card">
        <Bullets items={slide.bullets} color={theme.text} />
      </div>
    </div>
  );
}
