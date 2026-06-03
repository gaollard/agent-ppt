import { useEffect, useRef } from 'react';

interface EditableTextProps {
  tag?: 'h1' | 'h2' | 'p' | 'span';
  className?: string;
  style?: React.CSSProperties;
  value: string;
  placeholder?: string;
  editable?: boolean;
  onChange?: (value: string) => void;
}

export function EditableText({
  tag: Tag = 'span',
  className = '',
  style,
  value,
  placeholder = '点击输入…',
  editable,
  onChange,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    el.textContent = value || '';
  }, [value]);

  if (!editable) {
    return (
      <Tag className={className} style={style}>
        {value || (placeholder ? null : '')}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLHeadingElement>}
      className={`editable-field ${className}`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={() => onChange?.(ref.current?.textContent?.trim() ?? '')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && Tag !== 'p') e.preventDefault();
      }}
    />
  );
}

interface EditableBulletsProps {
  items: string[];
  color: string;
  editable?: boolean;
  onChange?: (items: string[]) => void;
}

export function EditableBullets({ items, color, editable, onChange }: EditableBulletsProps) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    items.forEach((item, i) => {
      const el = refs.current[i];
      if (!el || document.activeElement === el) return;
      el.textContent = item;
    });
  }, [items]);

  if (!items.length && !editable) return null;

  if (!editable) {
    return (
      <ul className="slide-bullets" style={{ color: `#${color}` }}>
        {items.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="slide-bullets editable-bullets" style={{ color: `#${color}` }}>
      {items.map((b, i) => (
        <li
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="editable-field"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="输入要点…"
          onBlur={() => {
            const next = items.map((_, j) => refs.current[j]?.textContent?.trim() ?? '');
            onChange?.(next);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const next = [...items];
              next.splice(i + 1, 0, '');
              onChange?.(next);
              requestAnimationFrame(() => refs.current[i + 1]?.focus());
            }
            if (e.key === 'Backspace' && !refs.current[i]?.textContent && items.length > 1) {
              e.preventDefault();
              onChange?.(items.filter((_, j) => j !== i));
              requestAnimationFrame(() => refs.current[Math.max(0, i - 1)]?.focus());
            }
          }}
        >
          {b}
        </li>
      ))}
      <li className="editable-bullets-add">
        <button
          type="button"
          onClick={() => onChange?.([...items, ''])}
        >
          + 添加要点
        </button>
      </li>
    </ul>
  );
}
