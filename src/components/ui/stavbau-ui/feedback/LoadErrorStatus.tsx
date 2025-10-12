// src/components/ui/stavbau-ui/feedback/LoadErrorStatus.tsx
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/cn';

type Labels = {
  loading?: string;
  error?: string;
  close?: string;
  retry?: string;
};

export type LoadErrorStatusProps = {
  loading?: boolean;
  error?: string | null;
  onClear?: () => void;
  onRetry?: () => void;
  /** i18n namespaces; default: ['common'] */
  i18nNamespaces?: string[];
  /** Přepíše texty (jinak se použijí i18n klíče s defaultValue) */
  labels?: Labels;
  /** Zobrazit detail chyby v dev režimu (default true) */
  showDevDetail?: boolean;
  className?: string;
};

export function LoadErrorStatus({
  loading = false,
  error = null,
  onClear,
  onRetry,
  i18nNamespaces = ['common'],
  labels,
  showDevDetail = true,
  className,
}: LoadErrorStatusProps) {
  const { t } = useTranslation(i18nNamespaces);

  const L = {
    loading: labels?.loading ?? (t('loading', { defaultValue: 'Načítám…' }) as string),
    error: labels?.error ?? (t('error', { defaultValue: 'Chyba načtení.' }) as string),
    close: labels?.close ?? (t('close', { defaultValue: 'Zavřít' }) as string),
    retry: labels?.retry ?? (t('retry', { defaultValue: 'Zkusit znovu' }) as string),
  };

  return (
    <>
      {/* ARIA status (bez layout shiftu) */}
      <span className="sr-only" role="status" aria-live="polite">
        {loading ? L.loading : ''}
      </span>

      {/* Error banner */}
      {!loading && error && (
        <div
          role="alert"
          className={cn(
            'mb-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700',
            className
          )}
        >
          <span>
            {L.error}{' '}
            {showDevDetail && process.env.NODE_ENV !== 'production' ? `(${error})` : null}
          </span>

          <div className="ml-auto flex items-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="underline decoration-red-400 underline-offset-2 hover:opacity-80"
              >
                {L.retry}
              </button>
            )}
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="underline decoration-red-400 underline-offset-2 hover:opacity-80"
              >
                {L.close}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default LoadErrorStatus;
