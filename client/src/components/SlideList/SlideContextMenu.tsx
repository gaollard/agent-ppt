import {
  LAYOUT_LABELS,
  SLIDE_LAYOUTS,
  type SlideContent,
  type SlideLayout,
} from '../../types/presentation';
import {
  ContextMenuDivider,
  ContextMenuIconBtn,
  ContextMenuItem,
  ContextMenuShell,
  ContextMenuSub,
  ContextMenuSubItem,
} from '../ContextMenu/ContextMenu';

export interface SlideContextMenuState {
  index: number;
  x: number;
  y: number;
}

interface Props {
  menu: SlideContextMenuState | null;
  slide: SlideContent | null;
  canDelete: boolean;
  canPaste: boolean;
  onClose: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onInsertSlide: (layout: SlideLayout) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleHidden: () => void;
  onOpenBackground: () => void;
  onChangeLayout: (layout: SlideLayout) => void;
  onResetSlide: () => void;
}

export function SlideContextMenu({
  menu,
  slide,
  canDelete,
  canPaste,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onInsertSlide,
  onDuplicate,
  onDelete,
  onToggleHidden,
  onOpenBackground,
  onChangeLayout,
  onResetSlide,
}: Props) {
  if (!menu || !slide) return null;

  const isHidden = Boolean(slide.hidden);

  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <ContextMenuShell
      open
      x={menu.x}
      y={menu.y}
      onClose={onClose}
      dismissOnOutsideMouseDown
    >
      <div className="ctx-menu-icons">
        <ContextMenuIconBtn label="⎘" title="复制" onAction={() => run(onCopy)} />
        <ContextMenuIconBtn label="✂" title="剪切" disabled={!canDelete} onAction={() => run(onCut)} />
        <ContextMenuIconBtn label="📋" title="粘贴" disabled={!canPaste} onAction={() => run(onPaste)} />
      </div>

      <ContextMenuDivider />

      <ContextMenuSub icon="＋" label="新建幻灯片" shortcut="N">
        {SLIDE_LAYOUTS.map((layout) => (
          <ContextMenuSubItem
            key={layout}
            label={LAYOUT_LABELS[layout]}
            onAction={() => run(() => onInsertSlide(layout))}
          />
        ))}
      </ContextMenuSub>
      <ContextMenuItem icon="⎘" label="复制幻灯片" shortcut="A" onAction={() => run(onDuplicate)} />
      <ContextMenuItem
        icon="✕"
        label="删除幻灯片"
        shortcut="D"
        disabled={!canDelete}
        onAction={() => run(onDelete)}
      />
      <ContextMenuItem
        icon="◌"
        label={isHidden ? '显示幻灯片' : '隐藏幻灯片'}
        shortcut="I"
        onAction={() => run(onToggleHidden)}
      />

      <ContextMenuDivider />

      <ContextMenuItem icon="🎨" label="背景" shortcut="B" onAction={() => run(onOpenBackground)} />

      <ContextMenuDivider />

      <ContextMenuSub icon="▦" label="版式" shortcut="L">
        {SLIDE_LAYOUTS.map((layout) => (
          <ContextMenuSubItem
            key={layout}
            label={LAYOUT_LABELS[layout]}
            active={slide.layout === layout}
            onAction={() => run(() => onChangeLayout(layout))}
          />
        ))}
      </ContextMenuSub>
      <ContextMenuItem icon="↺" label="重设幻灯片" onAction={() => run(onResetSlide)} />
    </ContextMenuShell>
  );
}
