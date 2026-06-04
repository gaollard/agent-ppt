import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import '../SlideList/SlideContextMenu.css';
import './element-context-menu.css';

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

function stopMenuEvent(e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
}

function IconBtn({
  label,
  title,
  disabled,
  onAction,
}: {
  label: string;
  title: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <button
      type="button"
      className={`slide-ctx-icon-btn ${disabled ? 'slide-ctx-icon-btn--disabled' : ''}`}
      title={title}
      aria-disabled={disabled || undefined}
      onMouseDown={(e) => {
        stopMenuEvent(e);
        if (disabled) return;
        onAction();
      }}
    >
      {label}
    </button>
  );
}

function MenuItem({
  icon,
  label,
  shortcut,
  disabled,
  hasSub,
  onAction,
}: {
  icon: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  hasSub?: boolean;
  onAction?: () => void;
}) {
  return (
    <button
      type="button"
      className={`slide-ctx-item ${disabled ? 'slide-ctx-item--disabled' : ''}`}
      aria-disabled={disabled || undefined}
      onMouseDown={(e) => {
        if (hasSub) return;
        stopMenuEvent(e);
        if (disabled) return;
        onAction?.();
      }}
    >
      <span className="slide-ctx-item-icon">{icon}</span>
      <span className="slide-ctx-item-label">{label}</span>
      {shortcut && <span className="slide-ctx-item-shortcut">{shortcut}</span>}
      {hasSub && <span className="slide-ctx-item-arrow">›</span>}
    </button>
  );
}

function SubMenuItem({ label, onAction }: { label: string; onAction: () => void }) {
  return (
    <button
      type="button"
      className="slide-ctx-subitem"
      onMouseDown={(e) => {
        stopMenuEvent(e);
        onAction();
      }}
    >
      {label}
    </button>
  );
}

function SubMenu({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`slide-ctx-submenu ${open ? 'slide-ctx-submenu--open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <MenuItem icon={icon} label={label} hasSub />
      <div className="slide-ctx-submenu-panel">{children}</div>
    </div>
  );
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
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu, onClose]);

  useEffect(() => {
    if (!menu || !panelRef.current) return;
    const panel = panelRef.current;
    const rect = panel.getBoundingClientRect();
    const pad = 8;
    let left = menu.x;
    let top = menu.y;
    if (left + rect.width > window.innerWidth - pad) {
      left = window.innerWidth - rect.width - pad;
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = window.innerHeight - rect.height - pad;
    }
    panel.style.left = `${Math.max(pad, left)}px`;
    panel.style.top = `${Math.max(pad, top)}px`;
  }, [menu]);

  if (!menu) return null;

  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  const content = (
    <>
      <div
        className="element-ctx-backdrop"
        onMouseDown={stopMenuEvent}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="slide-ctx-menu element-ctx-menu"
        style={{ left: menu.x, top: menu.y }}
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={stopMenuEvent}
      >
        <div className="slide-ctx-icons">
          <IconBtn label="⎘" title="复制" onAction={() => run(onCopy)} />
          <IconBtn label="✂" title="剪切" disabled={!canDelete} onAction={() => run(onCut)} />
          <IconBtn label="📋" title="粘贴" disabled={!canPaste} onAction={() => run(onPaste)} />
        </div>

        <div className="slide-ctx-divider" />

        <MenuItem
          icon="✕"
          label="删除"
          shortcut="Del"
          disabled={!canDelete}
          onAction={() => run(onDelete)}
        />
        <MenuItem icon="⎘" label="复制对象" shortcut="⌘D" onAction={() => run(onDuplicate)} />

        <div className="slide-ctx-divider" />

        <SubMenu icon="▤" label="排列">
          <SubMenuItem label="置于顶层" onAction={() => run(() => onOrder('front'))} />
          <SubMenuItem label="上移一层" onAction={() => run(() => onOrder('forward'))} />
          <SubMenuItem label="下移一层" onAction={() => run(() => onOrder('backward'))} />
          <SubMenuItem label="置于底层" onAction={() => run(() => onOrder('back'))} />
        </SubMenu>

        <SubMenu icon="↻" label="旋转">
          <SubMenuItem label="顺时针旋转 90°" onAction={() => run(() => onRotate(90))} />
          <SubMenuItem label="逆时针旋转 90°" onAction={() => run(() => onRotate(-90))} />
          <SubMenuItem label="水平翻转" onAction={() => run(() => onFlip('h'))} />
          <SubMenuItem label="垂直翻转" onAction={() => run(() => onFlip('v'))} />
        </SubMenu>

        <SubMenu icon="⊕" label="对齐页面">
          <SubMenuItem label="水平居中" onAction={() => run(() => onCenter('h'))} />
          <SubMenuItem label="垂直居中" onAction={() => run(() => onCenter('v'))} />
          <SubMenuItem label="水平并垂直居中" onAction={() => run(() => onCenter('both'))} />
        </SubMenu>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
