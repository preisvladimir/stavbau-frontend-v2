// src/features/customers/components/DeleteConfirm.tsx
import { cn } from '@/lib/utils/cn';

type Props = {
  title?: string;
  description?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
};

export default function DeleteConfirm({
  title = 'Smazat záznam?',
  description = 'Tuto akci nelze vrátit zpět.',
  confirming,
  onConfirm,
  onCancel,
  className,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className={cn('relative z-10 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl', className)}>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-[rgb(var(--sb-muted))]">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onCancel} disabled={confirming}>
            Zrušit
          </button>
          <button className="btn btn-error" onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Mažu…' : 'Smazat'}
          </button>
        </div>
      </div>
    </div>
  );
}
