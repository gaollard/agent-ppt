import { useCallback, useState } from 'react';

type Updater<T> = T | ((prev: T) => T);

function resolve<T>(next: Updater<T>, prev: T): T {
  return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
}

export function useHistory<T>(initial: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState(initial);
  const [future, setFuture] = useState<T[]>([]);

  const set = useCallback((next: Updater<T>, record = true) => {
    setPresent((current) => {
      const resolved = resolve(next, current);
      if (record) {
        setPast((p) => [...p, current]);
        setFuture([]);
      }
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setPresent((current) => {
        setFuture((f) => [current, ...f]);
        return prev;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setPresent((current) => {
        setPast((p) => [...p, current]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  const reset = useCallback((next: T) => {
    setPast([]);
    setFuture([]);
    setPresent(next);
  }, []);

  return {
    state: present,
    set,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
