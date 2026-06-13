import { createPortal } from 'react-dom';
import type { ElementStyle, PresentationTheme, SlideElement } from '../../types/presentation';
import { TextFormatControls } from '../TextFormat/TextFormatControls';
import './text-toolbar.css';

interface Props {
  open: boolean;
  anchor: { top: number; left: number; width: number };
  element: SlideElement;
  theme: PresentationTheme;
  onUpdateStyle: (patch: Partial<ElementStyle>) => void;
  selectionMode?: boolean;
}

export function TextToolbar({
  open,
  anchor,
  element,
  theme,
  onUpdateStyle,
  selectionMode = false,
}: Props) {
  if (!open || element.type !== 'text') return null;

  const toolbar = (
    <div
      className="text-toolbar"
      style={{
        top: Math.max(8, anchor.top - 52),
        left: anchor.left + anchor.width / 2,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <TextFormatControls
        style={element.style ?? {}}
        theme={theme}
        onChange={onUpdateStyle}
        variant="floating"
        selectionMode={selectionMode}
      />
    </div>
  );

  return createPortal(toolbar, document.body);
}
