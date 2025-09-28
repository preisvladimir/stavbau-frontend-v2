// src/components/ui/stavbau-ui/modal/confirm-modal.tsx
import * as React from "react";
import { UiPortal } from "../portal";
import { useBodyScrollLock } from "../drawer/useBodyScrollLock";
import { useTrapFocus } from "../drawer/useTrapFocus";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/stavbau-ui/button";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirming?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
};

export const ConfirmModal: React.FC<Props> = ({
  open,
  title = "Jste si jisti?",
  description,
  confirming,
  confirmLabel = "Potvrdit",
  cancelLabel = "Zrušit",
  danger = true,
  onConfirm,
  onCancel,
  className,
}) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  useBodyScrollLock(open);
  useTrapFocus(ref, open);

  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onCancel]);

  if (!open) return null;

  const modalZ = "z-[1100]";        // vyšší než drawer (ten má z-[1000])
  const backdropZ = "z-[1090]";

  return (
    <UiPortal>
      {/* backdrop */}
      <div
        className={cn("fixed inset-0 bg-black/40", backdropZ)}
        onClick={onCancel}
        aria-hidden
      />
      {/* modal */}
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={description ? "confirm-modal-desc" : undefined}
        className={cn(
          "fixed inset-0 flex items-center justify-center p-4", modalZ
        )}
      >
        <div
          className={cn(
            "w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 shadow-2xl",
            "outline-none ring-1 ring-black/5",
            className
          )}
        >
          <div className="px-5 pt-5">
            <h3 id="confirm-modal-title" className="text-base font-semibold">
              {title}
            </h3>
            {description ? (
              <p id="confirm-modal-desc" className="mt-2 text-sm text-[rgb(var(--sb-muted))]">
                {description}
              </p>
            ) : null}
          </div>
          <div
            className="mt-4 flex justify-end gap-2 px-5 pb-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          >
            <Button variant="ghost" onClick={onCancel} disabled={confirming}>
              {cancelLabel}
            </Button>
            <Button
              variant={danger ? "danger" : "primary"}
              onClick={onConfirm}
              isLoading={!!confirming}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </UiPortal>
  );
};
