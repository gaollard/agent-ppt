import { useState } from 'react';
import './GeneratePanel.css';

interface Props {
  onGenerate: (topic: string, slideCount: number) => Promise<void>;
  loading: boolean;
}

export function GeneratePanel({ onGenerate, loading }: Props) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [slideCount, setSlideCount] = useState(8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    await onGenerate(topic.trim(), slideCount);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        {loading ? '生成中…' : 'AI 生成'}
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => !loading && setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>AI 生成演示文稿</h2>
            <p className="modal-desc">输入主题与页数，后端将调用 LLM 生成内容并配图。</p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>主题</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如：2025 年人工智能发展趋势"
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <label>页数 ({slideCount})</label>
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '生成中，请稍候…' : '开始生成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
