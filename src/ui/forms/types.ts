// src/ui/forms/types.ts

export type FormMode = 'create' | 'edit';

/**
 * Základní, znovupoužitelná a rozšiřitelná sada props pro RHF formuláře.
 * TValues = tvar hodnot formuláře (např. AnyTeamFormValues)
 */
export interface BaseFormProps<TValues, TMode extends FormMode = FormMode> {
  /** create | edit */
  mode: TMode;

  /** i18n namespaces pro useTranslation */
  i18nNamespaces?: string[];

  /** Výchozí hodnoty pro RHF (např. při editu detailu) */
  defaultValues?: Partial<TValues>;

  /** Stav odesílání řízený rodičem (CrudDrawer, stránka) */
  submitting?: boolean;

  /** Loading řízený rodičem (CrudDrawer, stránka) */
  loading?: boolean;
 
  /** Schození chyby řízený rodičem (CrudDrawer, stránka) */
  onClear?: () => void;

  /** Submit handler (CRUD orchestrace) */
  onSubmit: (values: TValues) => Promise<void> | void;

  /** Zpět / zavřít bez uložení (CRUD orchestrace) */
  onCancel: () => void;

  /**
   * Po úspěšném submitu vyresetovat formulář.
   * Default: true v create, false v edit (doporučené chování).
   */
  resetAfterSubmit?: boolean;

  /** Volitelný banner s chybou ze serveru (řízení rodičem/CrudDrawer) */
  serverError?: string | null;

  /** Notifikace rodiči o "dirty" stavu (pro disable zavření, apod.) */
  onDirtyChange?: (dirty: boolean) => void;

  /** Autofocus na první pole (nebo první invalid) – default true */
  autoFocus?: boolean;

  /** Přídavná CSS class pro root <form> */
  className?: string;
}

/**
 * Pomocné utilitky pro zpřesnění props podle módu.
 * Příklad: BaseFormPropsFor<'create', T> omezí mode = 'create' a zachová ostatní.
 */
export type BaseFormPropsFor<TMode extends FormMode, TValues> =
  Omit<BaseFormProps<TValues, TMode>, 'mode'> & { mode: TMode };

/** Snadno rozšiřitelný typ — přidej si modul-specifické props přes & */
export type ExtendFormProps<
  TValues,
  TMode extends FormMode = FormMode,
  TExtra extends Record<string, unknown> = {}
> = BaseFormProps<TValues, TMode> & TExtra;
