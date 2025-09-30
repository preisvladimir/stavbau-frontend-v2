// src/lib/utils/useDebounce.ts
import * as React from "react";

/**
 * React hook pro debounce hodnoty (např. text z inputu).
 * Vrátí hodnotu až po uplynutí daného delay.
 *
 * @param value - vstupní hodnota (string, number, atd.)
 * @param delay - delay v ms (default 300)
 * @returns debounced hodnota
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debounced;
}
