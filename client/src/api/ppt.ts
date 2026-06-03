import type { PresentationContent } from '../types/presentation';

export async function generateContent(
  topic: string,
  slideCount: number,
): Promise<PresentationContent> {
  const res = await fetch('/ppt/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, slideCount }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `生成失败 (${res.status})`);
  }
  return res.json();
}

export async function exportPptx(content: PresentationContent): Promise<Blob> {
  const res = await fetch('/ppt/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `导出失败 (${res.status})`);
  }
  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
