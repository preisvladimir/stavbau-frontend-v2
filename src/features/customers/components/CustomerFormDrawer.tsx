// src/features/customers/components/CustomerFormDrawer.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormDrawer } from '@/components/ui/stavbau-ui/drawer/form-drawer';
import { CustomerForm, type CustomerFormValues } from './CustomerForm';
import { getCustomer } from '../api/client';
import { dtoToFormDefaults } from '../mappers';

export type CustomerFormDrawerProps = {
  i18nNamespaces?: string[];
  open: boolean;
  mode: 'create' | 'edit';
  id?: string | null;                 // když je mode === 'edit', očekáváme id
  titleKey?: string;                  // volitelně vlastní klíč nadpisu
  submitting?: boolean;               // řízeno zvenčí (např. stránkou)
  defaultValues?: Partial<CustomerFormValues>;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => void | Promise<void>;
};

export const CustomerFormDrawer: React.FC<CustomerFormDrawerProps> = ({
  i18nNamespaces = ['customers', 'common'],
  open,
  mode,
  id,
  titleKey,
  submitting,
  defaultValues,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation(i18nNamespaces);

  const title = titleKey
    ? t(titleKey)
    : mode === 'edit'
    ? t('form.title.edit', { defaultValue: 'Upravit zákazníka' })
    : t('form.title.create', { defaultValue: 'Nový zákazník' });

  const [prefill, setPrefill] = React.useState<Partial<CustomerFormValues> | undefined>(defaultValues);
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Při editu si dotáhneme detail a prefillneme formulář
  React.useEffect(() => {
    if (!open || mode !== 'edit' || !id) return;
    const ac = new AbortController();
    setLocalError(null);

    getCustomer(id, { signal: ac.signal })
      .then((d) => setPrefill(dtoToFormDefaults(d)))
      .catch((e: any) => {
        setLocalError(e?.response?.data?.detail || e?.message || 'Failed to load');
      });

    return () => ac.abort();
  }, [open, mode, id]);

  // Po zavření reset lokálního stavu
  React.useEffect(() => {
    if (!open) {
      setPrefill(undefined);
      setLocalError(null);
    }
  }, [open]);

  const safeOnSubmit = React.useCallback(
    (values: CustomerFormValues) => {
      setLocalError(null);
      onSubmit(values);
    },
    [onSubmit]
  );

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={title}
      mode={mode}
      showFooter={false}
      form={
        <>
          {/* (volitelné) lokální info/chyba nad formulářem */}
          {localError && (
            <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {localError}
            </div>
          )}

          <CustomerForm
            key={`${mode}-${id ?? 'new'}`}
            mode={mode}
            i18nNamespaces={i18nNamespaces}
            defaultValues={prefill ?? defaultValues}
            submitting={submitting}
            onSubmit={safeOnSubmit}
            onCancel={onClose}
            resetAfterSubmit={mode === 'create'}
          />
        </>
      }
    />
  );
};

export default CustomerFormDrawer;
