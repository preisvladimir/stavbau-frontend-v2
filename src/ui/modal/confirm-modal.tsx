import * as React from "react";
import { cn } from "@/lib/utils/cn";
import {
  Button,
  UiPortal,
  useBodyScrollLock,
  useTrapFocus
} from "@/ui";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  /** Probíhá potvrzovací akce (spinner + blokace tlačítek)? */
  confirming?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styl potvrzení (destruktivní akce) */
  danger?: boolean;
  /** Zakáže zavření klikem na backdrop */
  disableOutsideClose?: boolean;
  /** Zakáže zavření klávesou Escape */
  disableEscapeClose?: boolean;
  /** Zakáže potvrzovací tlačítko (nezávislé na `confirming`) */
  confirmDisabled?: boolean;
  /**
   * Zavřít modal hned po `onConfirm()`? (default: true)
   * Při asynchronních akcích často necháš true a zavíráš až po úspěchu z rodiče.
   */
  closeOnConfirm?: boolean;

  onConfirm: () => void | Promise<void>;
  onCancel: () => void;

  className?: string;

  /** Volitelné: vlastní obsah do patičky vlevo (např. "Více informací"). */
  footerLeftSlot?: React.ReactNode;
};

export const ConfirmModal: React.FC<Props> = ({
  open,
  title = "Jste si jisti?",
  description,
  confirming,
  confirmLabel = "Potvrdit",
  cancelLabel = "Zrušit",
  danger = true,
  disableOutsideClose = false,
  disableEscapeClose = false,
  confirmDisabled = false,
  closeOnConfirm = true,
  onConfirm,
  onCancel,
  className,
  footerLeftSlot,
}) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  useBodyScrollLock(open);
  useTrapFocus(ref, open);

  // ESC zavření
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (disableEscapeClose) return;
      if (confirming) return; // během potvrzení nezavírat
      onCancel();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, disableEscapeClose, confirming, onCancel]);

  if (!open) return null;

  const modalZ = "z-[1100]"; // vyšší než drawer (ten má z-[1000])
  const backdropZ = "z-[1090]";

  const handleBackdropClick = () => {
    if (disableOutsideClose) return;
    if (confirming) return;
    onCancel();
  };

  const handleConfirm = async () => {
    if (confirming || confirmDisabled) return;
    const ret = onConfirm?.();
    // Podpoříme sync i async onConfirm
    if (ret instanceof Promise) {
      try {
        await ret;
        if (closeOnConfirm) onCancel();
      } catch {
        // chybu řeší rodič (toast/banner); modal necháváme otevřený
      }
    } else if (closeOnConfirm) {
      onCancel();
    }
  };

  return (
    <UiPortal>
      {/* Backdrop */}
      <div
        className={cn("fixed inset-0 bg-black/40", backdropZ)}
        onClick={handleBackdropClick}
        aria-hidden
        data-testid="confirm-modal-backdrop"
      />
      {/* Modal wrapper */}
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-busy={!!confirming}
        aria-labelledby="confirm-modal-title"
        aria-describedby={description ? "confirm-modal-desc" : undefined}
        className={cn("fixed inset-0 flex items-center justify-center p-4", modalZ)}
        // Zabráníme propadnutí kliků z obsahu do backdropu
        onClick={(e) => {
          // pokud by někdo klikl do wrapperu mimo panel, chová se stejně jako backdrop
          if (e.target === e.currentTarget) handleBackdropClick();
        }}
        data-testid="confirm-modal"
      >
        <div
          className={cn(
            "w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 shadow-2xl",
            "outline-none ring-1 ring-black/5",
            className
          )}
          // stopPropagation, aby vnitřní kliky nezavřely modal
          onClick={(e) => e.stopPropagation()}
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
            className="mt-4 flex items-center justify-between gap-2 px-5 pb-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          >
            {/* Levý slot (volitelný) */}
            <div className="min-h-[36px]">{footerLeftSlot}</div>

            {/* Akce */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={!!confirming}
                aria-label={cancelLabel}
                data-testid="confirm-modal-cancel"
              >
                {cancelLabel}
              </Button>
              <Button
                variant={danger ? "danger" : "primary"}
                onClick={handleConfirm}
                isLoading={!!confirming}
                disabled={!!confirming || confirmDisabled}
                aria-label={confirmLabel}
                data-testid="confirm-modal-confirm"
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </UiPortal>
  );
};
