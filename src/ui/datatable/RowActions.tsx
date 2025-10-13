// src/components/ui/stavbau-ui/table/RowActions.tsx
//revize 13.10.2025
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/cn';
import { Button, ConfirmModal} from '@/ui';
import { ScopeGuard, type Scope } from '@/rbac';

// Ikony – přizpůsob svému barrel importu
import { MoreVertical, Pencil, Trash2, Archive, RotateCcw, Eye } from '@/components/icons';

type KnownKind = 'detail' | 'edit' | 'delete' | 'archive' | 'unarchive' | 'custom';

export type RowAction<T> = {
  kind?: KnownKind;
  label?: string;
  ariaLabel?: string;
  title?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
  onClick: (item: T) => void | Promise<void>;
  confirm?: { title?: string; description?: string; confirmLabel?: string; cancelLabel?: string };
  /** RBAC guard – OR logika nad scopami */
  scopesAnyOf?: readonly Scope[];
  hidden?: boolean | ((item: T) => boolean);
  disabled?: boolean | ((item: T) => boolean);
  stopPropagation?: boolean; // default true
};

export type RowActionsProps<T> = {
  item: T;
  actions: RowAction<T>[];
  i18nNamespaces?: string[];
  className?: string;

  /** inline tlačítka vs. kebab menu. 'auto' = menu když akcí > maxInline */
  asMenu?: boolean | 'auto';
  maxInline?: number;

  /** vzhled */
  gapClassName?: string;
  compact?: boolean;

  /** popisky spouštěče menu */
  menuAriaLabel?: string;
  menuTitle?: string;
  menuLabel?: string; // volitelný caption nahoře v panelu
};

function defaultIcon(kind?: KnownKind) {
  switch (kind) {
    case 'detail': return <Eye size={16} />;
    case 'edit': return <Pencil size={16} />;
    case 'delete': return <Trash2 size={16} />;
    case 'archive': return <Archive size={16} />;
    case 'unarchive': return <RotateCcw size={16} />;
    default: return null;
  }
}

function defaultVariant(kind?: KnownKind): RowAction<any>['variant'] {
  switch (kind) {
    case 'delete': return 'destructive';
    case 'archive':
    case 'unarchive': return 'secondary';
    case 'edit':
    case 'detail': return 'outline';
    default: return 'outline';
  }
}

export function RowActions<T>({
  item,
  actions,
  i18nNamespaces = ['common'],
  className,
  asMenu = 'auto',
  maxInline = 2,
  gapClassName = 'gap-2',
  compact = true,
  menuAriaLabel,
  menuTitle,
  menuLabel,
}: RowActionsProps<T>) {
  const { t } = useTranslation(i18nNamespaces);
  const [confirmIdx, setConfirmIdx] = React.useState<number | null>(null);
  const [busyIdx, setBusyIdx] = React.useState<number | null>(null);

  const i18nLabel = (kind?: KnownKind) => {
    switch (kind) {
      case 'detail': return t('detail.actions.detail', { defaultValue: 'Detail' }) as string;
      case 'edit': return t('detail.actions.edit', { defaultValue: 'Upravit' }) as string;
      case 'delete': return t('detail.actions.delete', { defaultValue: 'Smazat' }) as string;
      case 'archive': return t('detail.actions.archive', { defaultValue: 'Archivovat' }) as string;
      case 'unarchive': return t('detail.actions.unarchive', { defaultValue: 'Obnovit' }) as string;
      default: return t('action', { defaultValue: 'Akce' }) as string;
    }
  };

  const isVisible = React.useCallback((a: RowAction<T>) => {
    return typeof a.hidden === 'function' ? !a.hidden(item) : !a.hidden;
  }, [item]);

  const isDisabled = React.useCallback((a: RowAction<T>) => {
    return typeof a.disabled === 'function' ? a.disabled(item) : !!a.disabled;
  }, [item]);

  const runAction = async (idx: number) => {
    const a = actions[idx];
    try {
      setBusyIdx(idx);
      await a.onClick(item);
    } finally {
      setBusyIdx(null);
    }
  };

  const visibleActions = actions.filter(isVisible);
  const useMenu = asMenu === true || (asMenu === 'auto' && visibleActions.length > maxInline);
  const actionToConfirm = confirmIdx != null ? actions[confirmIdx] : null;

  // ===== Inline tlačítka =====
  if (!useMenu) {
return (
  <div className={cn('flex items-center', gapClassName, className)}>
    {actions.map((a, idx) => {
      if (!isVisible(a)) return null;
      const btn = (
        <Button
          key={idx}
          size={a.size ?? (compact ? 'sm' : 'md')}
          variant={a.variant ?? defaultVariant(a.kind)}
          aria-label={a.ariaLabel ?? a.label ?? i18nLabel(a.kind)}
          title={a.title ?? a.label ?? i18nLabel(a.kind)}
          disabled={isDisabled(a) || busyIdx === idx}
          onClick={(e) => {
            if (a.stopPropagation !== false) e.stopPropagation();
            if (a.confirm) setConfirmIdx(idx);
            else void runAction(idx);
          }}
        >
          {a.icon ?? defaultIcon(a.kind)}
        </Button>
      );
      return a.scopesAnyOf?.length ? (
        <ScopeGuard key={idx} anyOf={a.scopesAnyOf}>{btn}</ScopeGuard>
      ) : btn;
    })}

    {/* ✅ SPRÁVNĚ: komponenta s props, ne funkční volání */}
    {actionToConfirm?.confirm && (
      <ConfirmFor
        action={actionToConfirm}
        onConfirm={async () => {
          const idx = confirmIdx!;
          setConfirmIdx(null);
          await runAction(idx);
        }}
        onCancel={() => setConfirmIdx(null)}
      />
    )}
  </div>
);
  }

  // ===== Kebab menu (headless popover) =====
  return (
    <KebabMenu
      label={menuLabel}
      ariaLabel={menuAriaLabel ?? (t('moreActions', { defaultValue: 'Další akce' }) as string)}
      title={menuTitle}
      compact={compact}
      className={className}
      renderItems={({ close }) => (
        <div className="py-1">
          {actions.map((a, idx) => {
            if (!isVisible(a)) return null;
            const danger = a.kind === 'delete' || a.variant === 'destructive';
            const item = (
              <button
                key={idx}
                type="button"
                role="menuitem"
                disabled={isDisabled(a) || busyIdx === idx}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 disabled:opacity-50',
                  danger && 'text-red-600 hover:text-red-700 focus:text-red-700'
                )}
                onClick={(e) => {
                  if (a.stopPropagation !== false) e.stopPropagation();
                  // necháme panel zavřít až po potvrzení / vykonání
                  if (a.confirm) setConfirmIdx(idx);
                  else {
                    void runAction(idx);
                    close();
                  }
                }}
              >
                <span className="inline-flex items-center gap-2">
                  {a.icon ?? defaultIcon(a.kind)}
                  <span>{a.label ?? i18nLabel(a.kind)}</span>
                </span>
              </button>
            );
            return a.scopesAnyOf?.length ? (
              <ScopeGuard key={idx} anyOf={a.scopesAnyOf}>{item}</ScopeGuard>
            ) : item;
          })}
        </div>
      )}
      confirmNode={
        confirmIdx != null && actions[confirmIdx]?.confirm ? (
          <ConfirmFor
            action={actions[confirmIdx]}
            onConfirm={async () => {
              const idx = confirmIdx!;
              setConfirmIdx(null);
              await runAction(idx);
            }}
            onCancel={() => setConfirmIdx(null)}
          />
        ) : null
      }
    />
  );
}

// --- Malý helper pro ConfirmModal s i18n fallbacky ---
function ConfirmFor({
  action,
  onConfirm,
  onCancel,
}: {
  action: RowAction<any>;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const kind = action.kind;
  const title =
    action.confirm?.title ??
    (kind === 'delete'
      ? t('detail.deleteConfirm.title', { defaultValue: 'Smazat položku?' })
      : kind === 'archive'
      ? t('detail.archiveConfirm.title', { defaultValue: 'Archivovat položku?' })
      : kind === 'unarchive'
      ? t('detail.unarchiveConfirm.title', { defaultValue: 'Obnovit položku?' })
      : t('confirm.title', { defaultValue: 'Potvrdit akci?' }));
  const desc =
    action.confirm?.description ??
    (kind === 'delete'
      ? t('detail.deleteConfirm.desc', { defaultValue: 'Tato akce je nevratná.' })
      : kind === 'archive'
      ? t('detail.archiveConfirm.desc', { defaultValue: 'Položka bude skryta z hlavního výpisu.' })
      : kind === 'unarchive'
      ? t('detail.unarchiveConfirm.desc', { defaultValue: 'Položka bude opět viditelná.' })
      : undefined);
  const ok =
    action.confirm?.confirmLabel ??
    (kind === 'delete'
      ? t('detail.deleteConfirm.confirm', { defaultValue: 'Smazat' })
      : kind === 'archive'
      ? t('detail.archiveConfirm.confirm', { defaultValue: 'Archivovat' })
      : kind === 'unarchive'
      ? t('detail.unarchiveConfirm.confirm', { defaultValue: 'Obnovit' })
      : t('confirm.ok', { defaultValue: 'Potvrdit' }));
  const cancel = action.confirm?.cancelLabel ?? t('detail.deleteConfirm.cancel', { defaultValue: 'Zrušit' });

  return (
    <ConfirmModal
      open
      title={String(title)}
      description={desc ? String(desc) : undefined}
      confirmLabel={String(ok)}
      cancelLabel={String(cancel)}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

// --- Headless kebab popover (bez externí UI knihovny) ---
function KebabMenu({
  label,
  ariaLabel,
  title,
  compact,
  className,
  renderItems,
  confirmNode,
}: {
  label?: string;
  ariaLabel?: string;
  title?: string;
  compact?: boolean;
  className?: string;
  renderItems: (ctx: { close: () => void }) => React.ReactNode;
  confirmNode?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      const t = e.target as Node | null;
      if (t && !rootRef.current.contains(t)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className={cn('relative inline-flex', className)} ref={rootRef}>
      <Button
        size={compact ? 'sm' : 'md'}
        variant="ghost"
        aria-label={ariaLabel ?? 'More'}
        title={title ?? ariaLabel ?? 'More'}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(o => !o);
        }}
      >
        <MoreVertical size={16} />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 min-w-[10rem] rounded-md border bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {label && (
            <div className="px-3 py-2 text-xs font-medium text-gray-500">{label}</div>
          )}
          {label && <div className="my-1 h-px bg-gray-100" />}
          {renderItems({ close: () => setOpen(false) })}
        </div>
      )}

      {/* Confirm modaly držíme mimo panel, ale uvnitř wrapperu */}
      {confirmNode}
    </div>
  );
}

export default RowActions;
