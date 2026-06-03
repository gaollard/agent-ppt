import type { PresentationTheme } from '../types/presentation';

export function hexColor(hex: string, alpha = 1): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function themeVars(theme: PresentationTheme): React.CSSProperties {
  return {
    '--slide-primary': `#${theme.primary}`,
    '--slide-accent': `#${theme.accent}`,
    '--slide-bg': `#${theme.background}`,
    '--slide-text': `#${theme.text}`,
  } as React.CSSProperties;
}

export function effectiveLayout(
  layout: string | undefined,
  index: number,
  hasImage: boolean,
  hasChart: boolean,
  hasColumnB: boolean,
): string {
  const l = layout ?? (index === 0 ? 'cover' : 'title-bullets');
  if (['image-left', 'image-right', 'full-image'].includes(l) && !hasImage && l !== 'cover') {
    return 'title-bullets';
  }
  if (l === 'chart' && !hasChart) return 'title-bullets';
  if (l === 'two-column' && !hasColumnB) return 'title-bullets';
  return l;
}
