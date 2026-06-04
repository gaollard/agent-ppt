import {
  ContextMenuDivider,
  ContextMenuIconBtn,
  ContextMenuItem,
  ContextMenuShell,
  ContextMenuSub,
  ContextMenuSubItem,
} from '../ContextMenu/ContextMenu';

export interface ElementContextMenuState {
  x: number;
  y: number;
  targetIds: string[];
}

interface Props {
  menu: ElementContextMenuState | null;
  canDelete: boolean;
  canPaste: boolean;
  onClose: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onOrder: (action: 'front' | 'forward' | 'backward' | 'back') => void;
  onRotate: (delta: number) => void;
  onFlip: (axis: 'h' | 'v') => void;
  onCenter: (axis: 'h' | 'v' | 'both') => void;
}

export function ElementContextMenu({
  menu,
  canDelete,
  canPaste,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onDuplicate,
  onOrder,
  onRotate,
  onFlip,
  onCenter,
}: Props) {
  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <ContextMenuShell
      open={Boolean(menu)}
      x={menu?.x ?? 0}
      y={menu?.y ?? 0}
      onClose={onClose}
      useBackdrop
    >
      <div className="ctx-menu-icons">
        <ContextMenuIconBtn label="⎘" title="复制" useMouseDown onAction={() => run(onCopy)} />
        <ContextMenuIconBtn
          label="✂"
          title="剪切"
          disabled={!canDelete}
          useMouseDown
          onAction={() => run(onCut)}
        />
        <ContextMenuIconBtn
          label="📋"
          title="粘贴"
          disabled={!canPaste}
          useMouseDown
          onAction={() => run(onPaste)}
        />
      </div>

      <ContextMenuDivider />

      <ContextMenuItem
        icon="✕"
        label="删除"
        shortcut="Del"
        disabled={!canDelete}
        useMouseDown
        onAction={() => run(onDelete)}
      />
      <ContextMenuItem
        icon="⎘"
        label="复制对象"
        shortcut="⌘D"
        useMouseDown
        onAction={() => run(onDuplicate)}
      />

      <ContextMenuDivider />

      <ContextMenuSub icon="▤" label="排列">
        <ContextMenuSubItem label="置于顶层" useMouseDown onAction={() => run(() => onOrder('front'))} />
        <ContextMenuSubItem label="上移一层" useMouseDown onAction={() => run(() => onOrder('forward'))} />
        <ContextMenuSubItem label="下移一层" useMouseDown onAction={() => run(() => onOrder('backward'))} />
        <ContextMenuSubItem label="置于底层" useMouseDown onAction={() => run(() => onOrder('back'))} />
      </ContextMenuSub>

      <ContextMenuSub icon="↻" label="旋转">
        <ContextMenuSubItem label="顺时针旋转 90°" useMouseDown onAction={() => run(() => onRotate(90))} />
        <ContextMenuSubItem label="逆时针旋转 90°" useMouseDown onAction={() => run(() => onRotate(-90))} />
        <ContextMenuSubItem label="水平翻转" useMouseDown onAction={() => run(() => onFlip('h'))} />
        <ContextMenuSubItem label="垂直翻转" useMouseDown onAction={() => run(() => onFlip('v'))} />
      </ContextMenuSub>

      <ContextMenuSub icon="⊕" label="对齐页面">
        <ContextMenuSubItem label="水平居中" useMouseDown onAction={() => run(() => onCenter('h'))} />
        <ContextMenuSubItem label="垂直居中" useMouseDown onAction={() => run(() => onCenter('v'))} />
        <ContextMenuSubItem
          label="水平并垂直居中"
          useMouseDown
          onAction={() => run(() => onCenter('both'))}
        />
      </ContextMenuSub>
    </ContextMenuShell>
  );
}
