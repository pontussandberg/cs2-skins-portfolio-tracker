"use client";

import { useEffect, useState } from "react";

/**
 * useState that is remembered in this browser (localStorage, JSON). Starts at `initial` and loads
 * the saved value after mount, so server and first client render agree. Storage failures (private
 * mode, blocked storage) just mean the value isn't remembered.
 */
export function useStoredState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) setValue(JSON.parse(saved) as T);
    } catch {
      /* nothing saved we can read */
    }
  }, [key]);
  const set = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* not remembered; still applied */
    }
  };
  return [value, set];
}
