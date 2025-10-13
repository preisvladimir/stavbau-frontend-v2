// src/components/ui/stavbau-ui/drawer/useBodyScrollLock.ts
import * as React from "react";

export function useBodyScrollLock(isLocked: boolean) {
  React.useEffect(() => {
    if (!isLocked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isLocked]);
}
