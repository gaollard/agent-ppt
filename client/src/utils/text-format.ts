import type { CSSProperties } from 'react';
import type { ElementStyle, PresentationTheme, SlideElement } from '../types/presentation';

export const TEXT_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

export const TEXT_FONT_FAMILIES = [
  { label: '默认', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: '宋体', value: 'SimSun, serif' },
  { label: '黑体', value: 'SimHei, sans-serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
];

export function textDecoration(style?: ElementStyle): string | undefined {
  const parts: string[] = [];
  if (style?.underline) parts.push('underline');
  if (style?.strikethrough) parts.push('line-through');
  return parts.length ? parts.join(' ') : undefined;
}

export function elementTextStyle(
  el: SlideElement,
  theme: PresentationTheme,
): CSSProperties {
  const style = el.style;
  const fontFamily = style?.fontFamily?.trim();
  return {
    fontSize: style?.fontSize,
    fontFamily: fontFamily || undefined,
    fontWeight: style?.fontWeight,
    fontStyle: style?.fontStyle,
    textDecoration: textDecoration(style),
    color: style?.color ? `#${style.color}` : `#${theme.text}`,
    textAlign: style?.align ?? 'left',
    lineHeight: style?.lineHeight ?? 1.25,
    paddingLeft: style?.marginLeft ? `${style.marginLeft}px` : undefined,
    textIndent: style?.textIndent ? `${style.textIndent}px` : undefined,
    backgroundColor: style?.highlight ? `#${style.highlight}` : undefined,
  };
}

export const LINE_HEIGHT_OPTIONS = [
  { label: '1.0', value: 1 },
  { label: '1.15', value: 1.15 },
  { label: '1.25', value: 1.25 },
  { label: '1.5', value: 1.5 },
  { label: '2.0', value: 2 },
];

export const INDENT_STEP = 24;

export function clampFontSize(size: number): number {
  return Math.min(96, Math.max(8, Math.round(size)));
}
