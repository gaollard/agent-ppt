import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  LAYOUT_LABELS,
  SLIDE_LAYOUTS,
  type SlideContent,
  type SlideLayout,
} from '../../types/presentation';
import './SlideContextMenu.css';

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
  onChangeBackground: () => void;
  onRemoveBackground: () => void;
  onChangeLayout: (layout: SlideLayout) => void;
  onResetSlide: () => void;
}

function IconBtn({
  label,
  title,
  disabled,
  onClick,
}: {
  label: string;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="slide-ctx-icon-btn"
      title={title}
      disabled={disabled}
      onClick={onClick}
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
  onClick,
}: {
  icon: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  hasSub?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="slide-ctx-item" disabled={disabled} onClick={onClick}>
      <span className="slide-ctx-item-icon">{icon}</span>
      <span className="slide-ctx-item-label">{label}</span>
      {shortcut && <span className="slide-ctx-item-shortcut">{shortcut}</span>}
      {hasSub && <span className="slide-ctx-item-arrow">›</span>}
    </button>
  );
}

function SubMenu({
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
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={`slide-ctx-submenu ${open ? 'slide-ctx-submenu--open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <MenuItem icon={icon} label={label} shortcut={shortcut} hasSub />
      <div className="slide-ctx-submenu-panel">{children}</div>
    </div>
  );
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
  onChangeBackground,
  onRemoveBackground,
  onChangeLayout,
  onResetSlide,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
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

  if (!menu || !slide) return null;

  const hasBgImage = Boolean(slide.backgroundImage);
  const isHidden = Boolean(slide.hidden);

  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  const content = (
    <div
      ref={panelRef}
      className="slide-ctx-menu"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="slide-ctx-icons">
        <IconBtn label="⎘" title="复制" onClick={() => run(onCopy)} />
        <IconBtn label="✂" title="剪切" disabled={!canDelete} onClick={() => run(onCut)} />
        <IconBtn label="📋" title="粘贴" disabled={!canPaste} onClick={() => run(onPaste)} />
      </div>

      <div className="slide-ctx-divider" />

      <SubMenu icon="＋" label="新建幻灯片" shortcut="N">
        {SLIDE_LAYOUTS.map((layout) => (
          <button
            key={layout}
            type="button"
            className="slide-ctx-subitem"
            onClick={() => run(() => onInsertSlide(layout))}
          >
            {LAYOUT_LABELS[layout]}
          </button>
        ))}
      </SubMenu>
      <MenuItem icon="⎘" label="复制幻灯片" shortcut="A" onClick={() => run(onDuplicate)} />
      <MenuItem
        icon="✕"
        label="删除幻灯片"
        shortcut="D"
        disabled={!canDelete}
        onClick={() => run(onDelete)}
      />
      <MenuItem
        icon="◌"
        label={isHidden ? '显示幻灯片' : '隐藏幻灯片'}
        shortcut="I"
        onClick={() => run(onToggleHidden)}
      />

      <div className="slide-ctx-divider" />

      <MenuItem icon="🖼" label="更换背景图片" shortcut="B" onClick={() => run(onChangeBackground)} />
      <MenuItem
        icon="✕"
        label="删除背景图片"
        shortcut="G"
        disabled={!hasBgImage}
        onClick={() => run(onRemoveBackground)}
      />

      <div className="slide-ctx-divider" />

      <SubMenu icon="▦" label="版式" shortcut="L">
        {SLIDE_LAYOUTS.map((layout) => (
          <button
            key={layout}
            type="button"
            className={`slide-ctx-subitem ${slide.layout === layout ? 'slide-ctx-subitem--active' : ''}`}
            onClick={() => run(() => onChangeLayout(layout))}
          >
            {LAYOUT_LABELS[layout]}
          </button>
        ))}
      </SubMenu>
      <MenuItem icon="↺" label="重设幻灯片" onClick={() => run(onResetSlide)} />
    </div>
  );

  return createPortal(content, document.body);
}
