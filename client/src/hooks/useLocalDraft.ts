import { useEffect, useRef } from 'react';
import type { PresentationContent } from '../types/presentation';

const DRAFT_KEY = 'smart-ppt-draft';

export function saveDraft(content: PresentationContent) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(content));
  } catch {
    /* quota exceeded */
  }
}

export function loadDraft(): PresentationContent | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PresentationContent) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function useLocalDraft(content: PresentationContent, enabled = true) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => saveDraft(content), 800);
    return () => clearTimeout(timer.current);
  }, [content, enabled]);
}

export function restoreDraftOnMount(): PresentationContent | null {
  return loadDraft();
}
