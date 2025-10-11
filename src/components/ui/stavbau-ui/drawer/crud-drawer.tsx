// src/components/ui/stavbau-ui/drawer/crud-drawer.tsx
import * as React from "react";
import { StbDrawer, type StbDrawerProps } from "./drawer";
import { Button } from "@/components/ui/stavbau-ui/button";

/** Generic orchestrator for Detail / Create / Edit flows over a single Drawer root. */
export type CrudDrawerProps<
  TSummary extends { id: string | number } = { id: string | number },
  TFormValues = unknown
> = {
  // --- režim + routing ---
  isDetail: boolean;
  isNew: boolean;
  isEdit: boolean;
  entityId: string | null;
  open?: boolean;               // volitelně přetížit, jinak odvozeno z režimů
  onClose: () => void;

  // --- Drawer UI (propaguje se do StbDrawer) ---
  titles?: {
    detail?: React.ReactNode;
    create?: React.ReactNode;
    edit?: React.ReactNode;
  };
  side?: "right" | "bottom";
  width?: number;
  headerRight?: React.ReactNode;
  className?: string;

  // --- data & prefill ---
  listItems?: TSummary[];  // pro rychlý prefill z listu
  fetchDetail?: (id: string, opts?: { signal?: AbortSignal }) => Promise<any>;
  mapDetailToFormDefaults?: (detail: any) => Partial<TFormValues>;

  // --- akce ---
  onCreate?: (vals: TFormValues) => Promise<void> | void;
  onEdit?: (vals: TFormValues, id: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  afterMutate?: () => Promise<void> | void;
  beforeEditSubmit?: (vals: TFormValues, ctx: { id: string }) => Promise<void> | void;

  // --- sloty (render-props) ---
  renderDetail: (args: {
    id: string | null;
    prefill?: any;
    data?: any;
    loading?: boolean;
    error?: string | null;
    onEdit?: () => void;
    onDelete?: (id: string) => void;
  }) => React.ReactNode;

  renderCreateForm: (args: {
    defaultValues?: Partial<TFormValues>;
    submitting?: boolean;
    onSubmit: (vals: TFormValues) => void;
    onCancel: () => void;
  }) => React.ReactNode;

  renderEditForm: (args: {
    defaultValues?: Partial<TFormValues>;
    submitting?: boolean;
    onSubmit: (vals: TFormValues) => void;
    onCancel: () => void;
  }) => React.ReactNode;

  // --- footery (pokud chceš default action bar) ---
  showFooter?: boolean;                 // default false – necháváme řídit formy samy (jako dnes ve FormDrawer). :contentReference[oaicite:3]{index=3}
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryLoading?: boolean;
  disablePrimary?: boolean;

  // --- i18n (volitelně přeposlat dál) ---
  i18nNamespaces?: string[];
};

/** Minimal orchestration without dictating domain UI. Single source of truth = StbDrawer. */
export function CrudDrawer<TSummary extends { id: string | number }, TFormValues>({
  // režimy
  isDetail, isNew, isEdit, entityId, onClose, open,
  // UI
  titles, side = "right", width = 560, headerRight, className,
  // data
  listItems, fetchDetail, mapDetailToFormDefaults,
  // akce
  onCreate, onEdit, onDelete, afterMutate, beforeEditSubmit,
  // sloty
  renderDetail, renderCreateForm, renderEditForm,
  // footery
  showFooter = false, primaryLabel, secondaryLabel = "Zrušit", primaryLoading, disablePrimary,
}: CrudDrawerProps<TSummary, TFormValues>) {

  const effectiveOpen = open ?? (isDetail || isNew || isEdit);

  // --- Rychlý prefill ze seznamu (pro detail/edit) ---
  const quickPrefill = React.useMemo(() => {
    if (!entityId || !listItems) return undefined;
    return listItems.find((it) => String(it.id) === String(entityId));
  }, [entityId, listItems]);

  // --- Asynchronní fetch detailu (autorita) ---
  const [detail, setDetail] = React.useState<any | undefined>(undefined);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!effectiveOpen || !entityId || (!isDetail && !isEdit) || !fetchDetail) {
      setDetail(undefined);
      setLocalError(null);
      return;
    }
    const ac = new AbortController();
    setLoadingDetail(true);
    setLocalError(null);
    fetchDetail(String(entityId), { signal: ac.signal })
      .then((d) => setDetail(d))
      .catch((e: any) => setLocalError(e?.response?.data?.detail || e?.message || "Failed to load"))
      .finally(() => setLoadingDetail(false));
    return () => ac.abort();
  }, [effectiveOpen, entityId, isDetail, isEdit, fetchDetail]);

  // --- Default values pro formy ---
  const createDefaults = undefined as unknown as Partial<TFormValues> | undefined;

  const editDefaults = React.useMemo<Partial<TFormValues> | undefined>(() => {
    if (!isEdit) return undefined;
    if (mapDetailToFormDefaults && detail) return mapDetailToFormDefaults(detail);
    // fallback: když nemáme fetch => zkusíme quickPrefill (doména si přemapuje ve formu)
    return quickPrefill as unknown as Partial<TFormValues> | undefined;
  }, [isEdit, detail, quickPrefill, mapDetailToFormDefaults]);

  // --- Handlery pro mutace ---
  const handleCreate = React.useCallback(async (vals: TFormValues) => {
    if (!onCreate) return;
    await onCreate(vals);
    await afterMutate?.();
    onClose();
  }, [onCreate, afterMutate, onClose]);

  const handleEdit = React.useCallback(async (vals: TFormValues) => {
    if (!onEdit || !entityId) return;
    await beforeEditSubmit?.(vals, { id: String(entityId) });
    await onEdit(vals, String(entityId));
    await afterMutate?.();
    onClose();
  }, [onEdit, entityId, beforeEditSubmit, afterMutate, onClose]);

  const handleDelete = React.useCallback(async (id: string) => {
    if (!onDelete) return;
    await onDelete(id);
    await afterMutate?.();
    onClose();
  }, [onDelete, afterMutate, onClose]);

  // --- Obsah podle režimu ---
  const isAny = isDetail || isNew || isEdit;
  const title =
    (isDetail && (titles?.detail ?? "Detail")) ||
    (isNew && (titles?.create ?? "Nový záznam")) ||
    (isEdit && (titles?.edit ?? "Upravit záznam")) ||
    undefined;

  // --- Default footer (volitelný) ---
  const footer = showFooter ? (
    <>
      <Button variant="ghost" size="md" onClick={onClose}>
        {secondaryLabel}
      </Button>
      <Button
        variant="primary"
        size="md"
        onClick={() => {/* default nic, necháváme řídit formami */ }}
        isLoading={primaryLoading}
        disabled={disablePrimary}
      >
        {primaryLabel ?? "Uložit"}
      </Button>
    </>
  ) : undefined;

  return (
    <StbDrawer
      open={!!(effectiveOpen && isAny)}
      onClose={onClose}
      title={title}
      side={side}
      width={width}
      headerRight={headerRight}
      className={className}
      footer={footer}
    >
      {/* Jednotné místo pro decentní error strip (pokud nechceš řešit ve formu) */}
      {localError && (
        <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {localError}
        </div>
      )}

      {/* DETAIL */}
      {isDetail && renderDetail({
        id: entityId,
        prefill: quickPrefill,
        data: detail ?? quickPrefill,
        loading: loadingDetail,
        error: localError,
        onEdit: () => void 0,
        onDelete: onDelete ? (id) => void handleDelete(id) : undefined,
      })}

      {/* CREATE */}
      {isNew && renderCreateForm({
        defaultValues: createDefaults,
        submitting: false, // řídit může stránka, pokud potřebuje
        onSubmit: (vals) => void handleCreate(vals),
        onCancel: onClose,
      })}

      {/* EDIT */}
      {isEdit && renderEditForm({
        defaultValues: editDefaults,
        submitting: false,
        onSubmit: (vals) => void handleEdit(vals),
        onCancel: onClose,
      })}
    </StbDrawer>
  );
}
