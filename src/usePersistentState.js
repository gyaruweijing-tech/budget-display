import { useState, useEffect } from "react";

// localStorage に値を保存する useState。
// 初回は保存済みの値を読み、無ければ initialValue を使う。
// 値が変わるたびに自動で保存する。
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      // 読み取り/パース失敗時は初期値で復帰
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 書き込み失敗（容量超過・プライベートモード等）は無視
    }
  }, [key, value]);

  return [value, setValue];
}
