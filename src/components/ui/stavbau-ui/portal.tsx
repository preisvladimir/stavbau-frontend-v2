// src/components/ui/stavbau-ui/portal.tsx
import * as React from "react";
import { createPortal } from "react-dom";

export const UiPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);
  const elRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    elRef.current = document.body as unknown as HTMLElement;
    setMounted(true);
  }, []);

  return mounted && elRef.current ? createPortal(children, elRef.current) : null;
};
