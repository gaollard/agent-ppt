import type { SlideLayout } from '../../types/presentation';

export interface SlideListActions {
  onReorder: (from: number, to: number) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onAdd: (layout?: SlideLayout, afterIndex?: number) => void;
  onCopySlide: (index: number) => void;
  onCutSlide: (index: number) => void;
  onPasteSlide: (afterIndex: number) => void;
  onToggleHidden: (index: number) => void;
  onChangeBackground: (index: number) => void;
  onRemoveBackground: (index: number) => void;
  onChangeLayout: (index: number, layout: SlideLayout) => void;
  onResetSlide: (index: number) => void;
}
