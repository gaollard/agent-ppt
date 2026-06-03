import './selection-toolbar.css';

interface Props {
  left: number;
  top: number;
  canGroup: boolean;
  onGroup: () => void;
  onDelete: () => void;
  onAlignLeft: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignBottom: () => void;
}

export function SelectionToolbar({
  left,
  top,
  canGroup,
  onGroup,
  onDelete,
  onAlignLeft,
  onAlignRight,
  onAlignTop,
  onAlignBottom,
}: Props) {
  return (
    <div
      className="selection-toolbar"
      style={{ left: `${left}%`, top: `${top}%` }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button type="button" disabled={!canGroup} onClick={onGroup} title="组合">
        组合
      </button>
      <span className="selection-toolbar-divider" />
      <button type="button" onClick={onAlignLeft} title="左对齐">
        左对齐
      </button>
      <button type="button" onClick={onAlignRight} title="右对齐">
        右对齐
      </button>
      <button type="button" onClick={onAlignTop} title="上对齐">
        上对齐
      </button>
      <button type="button" onClick={onAlignBottom} title="下对齐">
        下对齐
      </button>
      <span className="selection-toolbar-divider" />
      <button type="button" className="selection-toolbar-danger" onClick={onDelete} title="删除">
        删除
      </button>
    </div>
  );
}
