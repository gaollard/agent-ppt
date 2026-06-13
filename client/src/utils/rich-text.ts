import type { CSSProperties } from 'react';
import type { ElementStyle, PresentationTheme, SlideElement } from '../types/presentation';
import { textDecoration } from './text-format';

export interface TextRunStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  highlight?: string;
  fontFamily?: string;
}

export interface TextRun {
  text: string;
  style?: TextRunStyle;
}

export interface RichTextContent {
  runs: TextRun[];
}

export type InlineFormatPatch = Partial<TextRunStyle>;

const RUN_STYLE_KEYS: (keyof TextRunStyle)[] = [
  'fontSize',
  'fontWeight',
  'fontStyle',
  'underline',
  'strikethrough',
  'color',
  'highlight',
  'fontFamily',
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function runStyleToCss(style: TextRunStyle | undefined, theme: PresentationTheme): string {
  if (!style) return '';
  const parts: string[] = [];
  if (style.fontSize) parts.push(`font-size:${style.fontSize}px`);
  if (style.fontWeight) parts.push(`font-weight:${style.fontWeight}`);
  if (style.fontStyle) parts.push(`font-style:${style.fontStyle}`);
  const deco = textDecoration(style as ElementStyle);
  if (deco) parts.push(`text-decoration:${deco}`);
  if (style.color) parts.push(`color:#${style.color}`);
  else parts.push(`color:#${theme.text}`);
  if (style.highlight) parts.push(`background-color:#${style.highlight}`);
  if (style.fontFamily?.trim()) parts.push(`font-family:${style.fontFamily}`);
  return parts.join(';');
}

function cssFromElement(style: ElementStyle | undefined, theme: PresentationTheme): string {
  return runStyleToCss(
    {
      fontSize: style?.fontSize,
      fontWeight: style?.fontWeight,
      fontStyle: style?.fontStyle,
      underline: style?.underline,
      strikethrough: style?.strikethrough,
      color: style?.color,
      highlight: style?.highlight,
      fontFamily: style?.fontFamily,
    },
    theme,
  );
}

function readRunStyleFromNode(node: HTMLElement): TextRunStyle | undefined {
  const style: TextRunStyle = {};
  const weight = node.style.fontWeight || window.getComputedStyle(node).fontWeight;
  if (weight === 'bold' || Number(weight) >= 600) style.fontWeight = 'bold';
  const fontStyle = node.style.fontStyle || window.getComputedStyle(node).fontStyle;
  if (fontStyle === 'italic') style.fontStyle = 'italic';
  const textDeco = node.style.textDecorationLine || window.getComputedStyle(node).textDecorationLine;
  if (textDeco.includes('underline')) style.underline = true;
  if (textDeco.includes('line-through')) style.strikethrough = true;
  const color = node.style.color || window.getComputedStyle(node).color;
  const hex = colorToHex(color);
  if (hex) style.color = hex;
  const bg = node.style.backgroundColor || window.getComputedStyle(node).backgroundColor;
  const bgHex = colorToHex(bg);
  if (bgHex && bgHex !== 'FFFFFF') style.highlight = bgHex;
  const fontSize = node.style.fontSize || window.getComputedStyle(node).fontSize;
  const px = parseFloat(fontSize);
  if (!Number.isNaN(px)) style.fontSize = Math.round(px);
  const fontFamily = node.style.fontFamily || window.getComputedStyle(node).fontFamily;
  if (fontFamily && fontFamily !== 'inherit') style.fontFamily = fontFamily;
  return Object.keys(style).length ? style : undefined;
}

function colorToHex(color: string): string | undefined {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return undefined;
  if (color.startsWith('#')) return color.replace('#', '').toUpperCase().slice(0, 6);
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return undefined;
  return [m[1], m[2], m[3]]
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function stylesEqual(a?: TextRunStyle, b?: TextRunStyle): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return RUN_STYLE_KEYS.every((k) => a[k] === b[k]);
}

function pushRun(runs: TextRun[], text: string, style?: TextRunStyle) {
  if (!text) return;
  const last = runs[runs.length - 1];
  if (last && stylesEqual(last.style, style)) {
    last.text += text;
    return;
  }
  runs.push({ text, style: style ? { ...style } : undefined });
}

function walkInline(node: Node, inherited: TextRunStyle | undefined, runs: TextRun[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').replace(/\u00a0/g, ' ');
    pushRun(runs, text, inherited);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  if (el.tagName === 'BR') {
    pushRun(runs, '\n', inherited);
    return;
  }
  const tag = el.tagName.toLowerCase();
  if (tag === 'ul' || tag === 'ol') {
    el.querySelectorAll(':scope > li').forEach((li) => {
      walkInline(li, inherited, runs);
      pushRun(runs, '\n', inherited);
    });
    return;
  }
  const ownStyle = readRunStyleFromNode(el);
  const merged = ownStyle ? { ...inherited, ...ownStyle } : inherited;
  el.childNodes.forEach((child) => walkInline(child, merged, runs));
}

function normalizeRuns(runs: TextRun[]): TextRun[] {
  const merged: TextRun[] = [];
  for (const run of runs) {
    const text = run.text.replace(/\r/g, '');
    if (!text) continue;
    pushRun(merged, text, run.style);
  }
  while (merged.length && merged[merged.length - 1].text.endsWith('\n')) {
    const last = merged[merged.length - 1];
    last.text = last.text.replace(/\n+$/, '');
    if (!last.text) merged.pop();
  }
  return merged;
}

export function parseEditorToRichText(
  root: HTMLElement,
  placeholder = '双击编辑文本',
): { content: string; richText?: RichTextContent } {
  const runs: TextRun[] = [];
  if (root.querySelector('ul, ol')) {
    root.childNodes.forEach((child) => walkInline(child, undefined, runs));
  } else {
    root.childNodes.forEach((child) => walkInline(child, undefined, runs));
  }
  const normalized = normalizeRuns(runs);
  const content = normalized
    .map((r) => r.text)
    .join('')
    .replace(/\n+$/, '');
  if (!content || content === placeholder) {
    return { content: '' };
  }
  const hasInlineStyle = normalized.some((r) => r.style && Object.keys(r.style).length > 0);
  if (!hasInlineStyle || normalized.length <= 1) {
    return { content };
  }
  return { content, richText: { runs: normalized } };
}

function runsToHtml(runs: TextRun[], theme: PresentationTheme): string {
  return runs
    .map((run) => {
      const text = escapeHtml(run.text).replace(/\n/g, '<br/>');
      const css = runStyleToCss(run.style, theme);
      return css ? `<span style="${css}">${text || '&nbsp;'}</span>` : text || '&nbsp;';
    })
    .join('');
}

export function richTextToEditorHtml(el: SlideElement, theme: PresentationTheme): string {
  const placeholder = '双击编辑文本';
  if (el.richText?.runs?.length && hasRichInlineText(el) && !el.style?.bullets) {
    return runsToHtml(el.richText.runs, theme);
  }

  const text = el.content ?? '';
  if (el.style?.bullets) {
    const lines = text.split('\n');
    const items = lines.length ? lines : [''];
    const css = cssFromElement(el.style, theme);
    return `<ul class="freeform-text-bullets">${items
      .map((line) => `<li${css ? ` style="${css}"` : ''}>${escapeHtml(line) || '&nbsp;'}</li>`)
      .join('')}</ul>`;
  }
  const css = cssFromElement(el.style, theme);
  const body = escapeHtml(text || placeholder);
  return css ? `<span style="${css}">${body}</span>` : body;
}

export function runStyleToReactCss(
  style: TextRunStyle | undefined,
  theme: PresentationTheme,
): CSSProperties {
  if (!style) return { color: `#${theme.text}` };
  return {
    fontSize: style.fontSize,
    fontFamily: style.fontFamily?.trim() || undefined,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: textDecoration(style as ElementStyle),
    color: style.color ? `#${style.color}` : `#${theme.text}`,
    backgroundColor: style.highlight ? `#${style.highlight}` : undefined,
  };
}

export function hasRichInlineText(el: SlideElement): boolean {
  return Boolean(el.richText?.runs?.some((r) => r.style && Object.keys(r.style).length > 0));
}

export function getActiveEditor(): HTMLElement | null {
  return document.querySelector(
    '.freeform-el--text.freeform-el--editing .freeform-text-editor',
  ) as HTMLElement | null;
}

export function hasTextSelection(editor?: HTMLElement | null): boolean {
  const node = editor ?? getActiveEditor();
  if (!node) return false;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  return node.contains(sel.anchorNode) && node.contains(sel.focusNode);
}

export function applySelectionFormat(patch: InlineFormatPatch, editor?: HTMLElement | null): boolean {
  const node = editor ?? getActiveEditor();
  if (!node || !hasTextSelection(node)) return false;
  node.focus();

  if (patch.fontWeight === 'bold') document.execCommand('bold');
  if (patch.fontWeight === 'normal') document.execCommand('bold'); // toggle off
  if (patch.fontStyle === 'italic') document.execCommand('italic');
  if (patch.fontStyle === 'normal') document.execCommand('italic');
  if (patch.underline === true) document.execCommand('underline');
  if (patch.underline === false) document.execCommand('underline');
  if (patch.strikethrough === true) document.execCommand('strikeThrough');
  if (patch.strikethrough === false) document.execCommand('strikeThrough');
  if (patch.color) document.execCommand('foreColor', false, `#${patch.color}`);
  if (patch.highlight) document.execCommand('hiliteColor', false, `#${patch.highlight}`);
  if (patch.highlight === undefined && 'highlight' in patch) {
    document.execCommand('removeFormat');
  }
  if (patch.fontSize) {
    document.execCommand('fontSize', false, '7');
    const fontElements = node.querySelectorAll('font[size="7"]');
    fontElements.forEach((el) => {
      (el as HTMLElement).removeAttribute('size');
      (el as HTMLElement).style.fontSize = `${patch.fontSize}px`;
    });
  }
  return true;
}

export function toggleSelectionFormat(
  key: keyof InlineFormatPatch,
  current?: boolean,
  editor?: HTMLElement | null,
): boolean {
  if (key === 'fontWeight') return applySelectionFormat({ fontWeight: current ? 'normal' : 'bold' }, editor);
  if (key === 'fontStyle') return applySelectionFormat({ fontStyle: current ? 'normal' : 'italic' }, editor);
  if (key === 'underline') return applySelectionFormat({ underline: !current }, editor);
  if (key === 'strikethrough') return applySelectionFormat({ strikethrough: !current }, editor);
  return false;
}
