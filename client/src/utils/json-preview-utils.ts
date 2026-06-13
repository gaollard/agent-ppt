const DATA_URL_RE = /^data:[^;]+;base64,/;

export function isLargeDataUrl(value: string): boolean {
  return DATA_URL_RE.test(value) && value.length > 120;
}

export function summarizeLargeString(value: string, maxPreview = 80): string {
  if (isLargeDataUrl(value)) {
    return `[data URL, ${value.length} chars]`;
  }
  if (value.length <= maxPreview) return value;
  return `${value.slice(0, maxPreview)}… [${value.length} chars]`;
}

export function sanitizeForJsonPreview(value: unknown): unknown {
  if (typeof value === 'string') {
    return summarizeLargeString(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForJsonPreview);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sanitizeForJsonPreview(item),
      ]),
    );
  }
  return value;
}

export function formatJsonPreview(value: unknown, compactLargeFields: boolean): string {
  const data = compactLargeFields ? sanitizeForJsonPreview(value) : value;
  return JSON.stringify(data, null, 2);
}
