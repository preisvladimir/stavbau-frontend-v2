import * as React from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}> = ({ open, onClose, title, description, footer, children, className }) => {
  if (!open) return null;
  return createPortal(
    <div className="sb-modal-backdrop" onClick={onClose}>
      <div className={clsx("sb-modal mx-auto p-4", className)} onClick={e => e.stopPropagation()}>
        {(title || description) && (
          <div className="mb-3">
            {title ? <div className="text-lg font-semibold">{title}</div> : null}
            {description ? <div className="text-sm text-[rgb(var(--sb-muted))]">{description}</div> : null}
          </div>
        )}
        <div>{children}</div>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
};
