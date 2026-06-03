import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './table-picker.css';

const MAX_COLS = 10;
const MAX_ROWS = 8;

interface Props {
  onInsert: (rows: number, cols: number) => void;
}

export function TablePicker({ onInsert }: Props) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ cols: 0, rows: 0 });
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePos = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
      setHover({ cols: 0, rows: 0 });
    };

    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    document.addEventListener('mousedown', onDocClick);

    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open]);

  const handlePick = (cols: number, rows: number) => {
    onInsert(rows, cols);
    setOpen(false);
    setHover({ cols: 0, rows: 0 });
  };

  const popover =
    open &&
    createPortal(
      <div
        ref={popoverRef}
        className="table-picker-popover"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="table-picker-header">
          <span className="table-picker-title">表格</span>
          <span className="table-picker-size">
            {hover.cols > 0 ? `${hover.cols} × ${hover.rows} 表格` : '选择表格大小'}
          </span>
        </div>
        <div
          className="table-picker-grid"
          onMouseLeave={() => setHover({ cols: 0, rows: 0 })}
        >
          {Array.from({ length: MAX_ROWS }, (_, rowIdx) => (
            <div key={rowIdx} className="table-picker-grid-row">
              {Array.from({ length: MAX_COLS }, (_, colIdx) => {
                const col = colIdx + 1;
                const row = rowIdx + 1;
                const active = col <= hover.cols && row <= hover.rows;
                return (
                  <button
                    key={colIdx}
                    type="button"
                    className={`table-picker-cell ${active ? 'table-picker-cell--active' : ''}`}
                    onMouseEnter={() => setHover({ cols: col, rows: row })}
                    onClick={() => handlePick(col, row)}
                    aria-label={`${col} 列 ${row} 行`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="table-picker">
      <button
        ref={btnRef}
        type="button"
        className="ribbon-tool ribbon-tool--accent"
        onClick={() => setOpen((v) => !v)}
        title="表格"
      >
        <span className="ribbon-tool-icon table-picker-icon">▦</span>
        <span className="ribbon-tool-label">表格</span>
      </button>
      {popover}
    </div>
  );
}
