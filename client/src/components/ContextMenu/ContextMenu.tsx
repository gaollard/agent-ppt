import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './context-menu.css';

export function stopMenuEvent(e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
}

export function ContextMenuDivider() {
  return <div className="ctx-menu-divider" />;
}

export function ContextMenuIconBtn({
  label,
  title,
  disabled,
  onAction,
  useMouseDown = false,
}: {
  label: string;
  title: string;
  disabled?: boolean;
  onAction: () => void;
  useMouseDown?: boolean;
}) {
  const handler = () => {
    if (disabled) return;
    onAction();
  };

  return (
    <button
      type="button"
      className={`ctx-menu-icon-btn ${disabled ? 'ctx-menu-icon-btn--disabled' : ''}`}
      title={title}
      aria-disabled={disabled || undefined}
      disabled={!useMouseDown && disabled}
      onClick={useMouseDown ? undefined : handler}
      onMouseDown={
        useMouseDown
          ? (e) => {
              stopMenuEvent(e);
              handler();
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}

export function ContextMenuItem({
  icon,
  label,
  shortcut,
  disabled,
  hasSub,
  onAction,
  useMouseDown = false,
}: {
  icon: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  hasSub?: boolean;
  onAction?: () => void;
  useMouseDown?: boolean;
}) {
  const handler = () => {
    if (hasSub || disabled) return;
    onAction?.();
  };

  return (
    <button
      type="button"
      className={`ctx-menu-item ${disabled ? 'ctx-menu-item--disabled' : ''}`}
      aria-disabled={disabled || undefined}
      disabled={!useMouseDown && !hasSub && disabled}
      onClick={useMouseDown || hasSub ? undefined : handler}
      onMouseDown={
        useMouseDown && !hasSub
          ? (e) => {
              stopMenuEvent(e);
              handler();
            }
          : undefined
      }
    >
      <span className="ctx-menu-item-icon">{icon}</span>
      <span className="ctx-menu-item-label">{label}</span>
      {shortcut && <span className="ctx-menu-item-shortcut">{shortcut}</span>}
      {hasSub && <span className="ctx-menu-item-arrow">›</span>}
    </button>
  );
}

export function ContextMenuSubItem({
  label,
  active,
  onAction,
  useMouseDown = false,
}: {
  label: string;
  active?: boolean;
  onAction: () => void;
  useMouseDown?: boolean;
}) {
  const handler = () => onAction();

  return (
    <button
      type="button"
      className={`ctx-menu-subitem ${active ? 'ctx-menu-subitem--active' : ''}`}
      onClick={useMouseDown ? undefined : handler}
      onMouseDown={
        useMouseDown
          ? (e) => {
              stopMenuEvent(e);
              handler();
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}

export function ContextMenuSub({
  label,
  icon,
  shortcut,
  children,
}: {
  label: string;
  icon: string;
  shortcut?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`ctx-menu-submenu ${open ? 'ctx-menu-submenu--open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <ContextMenuItem icon={icon} label={label} shortcut={shortcut} hasSub />
      <div className="ctx-menu-submenu-panel">{children}</div>
    </div>
  );
}

interface ContextMenuShellProps {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  useBackdrop?: boolean;
  dismissOnOutsideMouseDown?: boolean;
}

export function ContextMenuShell({
  open,
  x,
  y,
  onClose,
  children,
  className = '',
  useBackdrop = false,
  dismissOnOutsideMouseDown = false,
}: ContextMenuShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onScroll = () => onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (!dismissOnOutsideMouseDown) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose, dismissOnOutsideMouseDown]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const rect = panel.getBoundingClientRect();
    const pad = 8;
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth - pad) {
      left = window.innerWidth - rect.width - pad;
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = window.innerHeight - rect.height - pad;
    }
    panel.style.left = `${Math.max(pad, left)}px`;
    panel.style.top = `${Math.max(pad, top)}px`;
  }, [open, x, y]);

  if (!open) return null;

  return createPortal(
    <>
      {useBackdrop && (
        <div
          className="ctx-menu-backdrop"
          onMouseDown={stopMenuEvent}
          onClick={onClose}
        />
      )}
      <div
        ref={panelRef}
        className={`ctx-menu ${className}`.trim()}
        style={{ left: x, top: y }}
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={useBackdrop ? stopMenuEvent : undefined}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
