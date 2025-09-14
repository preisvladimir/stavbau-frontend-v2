import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "./card";

type ModalBaseProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Obsah patičky – typicky <Button/> akce */
  footer?: React.ReactNode;
  /** Když true, použije Card chroming uvnitř modalu */
  asCard?: boolean;
  /** Přizpůsobení wrapperu modalu */
  className?: string;
  /** Šířka modalu (Tailwind třídy) */
  sizeClassName?: string; // např. "max-w-lg"
  children?: React.ReactNode;
};

export const Modal: React.FC<ModalBaseProps> = ({
  open,
  onClose,
  title,
  description,
  footer,
  asCard = true,
  className,
  sizeClassName = "max-w-lg",
  children,
}) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // fokus dovnitř
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const content = asCard ? (
    <Card className={cn("w-full", className)} role="document">
      {(title || description) && (
        <CardHeader>
          {title ? <CardTitle id="modal-title">{title}</CardTitle> : null}
          {description ? (
            <CardDescription id="modal-desc">{description}</CardDescription>
          ) : null}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  ) : (
    <div className={cn("w-full rounded-xl bg-white p-4 shadow-md", className)} role="document">
      {(title || description) && (
        <div className="mb-3">
          {title ? <div id="modal-title" className="text-lg font-semibold">{title}</div> : null}
          {description ? (
            <div id="modal-desc" className="text-sm text-[rgb(var(--sb-muted))]">
              {description}
            </div>
          ) : null}
        </div>
      )}
      <div>{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      aria-hidden={!open}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className={cn(
          "relative mx-auto my-8 px-4",
          "flex min-h-[calc(100%_-_4rem)] items-start justify-center"
        )}
      >
        <div
          ref={dialogRef}
          className={cn("outline-none", sizeClassName)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-desc" : undefined}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    </div>,
    document.body
  );
};
