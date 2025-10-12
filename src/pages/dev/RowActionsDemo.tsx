// src/pages/dev/RowActionsDemo.tsx
import * as React from 'react';
import { TableHeader } from '@/components/ui/stavbau-ui/datatable/TableHeader';
import { Button } from '@/components/ui/stavbau-ui/button';
import ScopeGuard from '@/lib/rbac/ScopeGuard';
import { TEAM_SCOPES } from '@/features/teamV2/const/scopes';
import { UserPlus, Pencil, Trash2, Eye, Archive, ArchiveRestore } from '@/components/icons';
import RowActions, { type RowAction } from '@/components/ui/stavbau-ui/datatable/RowActions';
import { cn } from '@/lib/utils/cn';

// --- Globální feedback (toast/inline rozhodování) ---
import { InlineStatus, useFeedback } from '@/ui/feedback';

type DemoRow = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'ARCHIVED';
};

const MOCK_ROWS: DemoRow[] = [
  { id: '1', name: 'První záznam', status: 'ACTIVE' },
  { id: '2', name: 'Archivovaný záznam', status: 'ARCHIVED' },
  { id: '3', name: 'Další aktivní', status: 'ACTIVE' },
];

export default function RowActionsDemo() {
  const [asMenu, setAsMenu] = React.useState(true);
  const [compact, setCompact] = React.useState(false);

  const feedback = useFeedback();
  const SCOPE = 'dev.rowActions';

  // ukázkové handlery (uvnitř komponenty kvůli feedbacku)
  const onDetail = async (row: DemoRow) => {
    console.log('[detail]', row);
    feedback.show({
      severity: 'info',
      title: 'Detail',
      description: `Otevřít detail: ${row.name}`,
      // bez scope => toast
    });
  };

  const onEdit = async (row: DemoRow) => {
    console.log('[edit]', row);
    feedback.show({
      severity: 'success',
      title: 'Upraveno',
      description: `Edit: ${row.name}`,
    });
  };

  const onArchive = async (row: DemoRow) => {
    console.log('[archive]', row);
    // schválně jako chyba → ukázka inline lišty
    feedback.show({
      severity: 'error',
      title: 'Archivace selhala (demo)',
      description: `Záznam: ${row.name}`,
      scope: SCOPE, // 👈 zobrazí se v <InlineStatus/>
    });
  };

  const onUnarchive = async (row: DemoRow) => {
    console.log('[unarchive]', row);
    feedback.show({
      severity: 'warning',
      title: 'Obnoveno (demo)',
      description: `Záznam: ${row.name}`,
    });
  };

  const onDelete = async (row: DemoRow) => {
    console.log('[delete]', row);
    feedback.show({
      severity: 'info',
      title: 'Smazáno (demo)',
      description: `Záznam: ${row.name}`,
    });
  };

  /** Per-row builder: vrať rovnou jen ty akce, které mají být vidět. */
  function buildActions(row: DemoRow): RowAction<DemoRow>[] {
    const actions: RowAction<DemoRow>[] = [
      {
        kind: 'detail',
        label: 'Detail',
        title: 'Zobrazit detail',
        icon: <Eye size={16} />,
        onClick: () => onDetail(row),
      },
      {
        kind: 'edit',
        label: 'Upravit',
        title: 'Upravit záznam',
        icon: <Pencil size={16} />,
        onClick: () => onEdit(row),
      },
    ];

    if (row.status !== 'ARCHIVED') {
      actions.push({
        kind: 'archive',
        label: 'Archivovat',
        title: 'Archivovat záznam',
        icon: <Archive size={16} />,
        confirm: {
          title: 'Archivovat položku?',
          description: 'Archivované položky se skryjí z hlavního výpisu.',
          confirmLabel: 'Archivovat',
          cancelLabel: 'Zrušit',
        },
        onClick: () => onArchive(row),
      });
    } else {
      actions.push({
        kind: 'unarchive',
        label: 'Obnovit',
        title: 'Obnovit z archivu',
        icon: <ArchiveRestore size={16} />,
        onClick: () => onUnarchive(row),
      });
    }

    actions.push({
      kind: 'delete',
      label: 'Smazat',
      title: 'Smazat záznam',
      icon: <Trash2 size={16} />,
      variant: 'destructive',
      disabled: row.status === 'ACTIVE' && row.id === '1', // příklad podmíněného disable
      confirm: {
        title: 'Smazat položku?',
        description: 'Akce je nevratná.',
        confirmLabel: 'Smazat',
        cancelLabel: 'Zrušit',
      },
      onClick: () => onDelete(row),
    });

    return actions;
  }

  return (
    <div className="p-6 space-y-6">
      <TableHeader
        title="RowActions – ukázka použití"
        actions={
          <>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={asMenu} onChange={(e) => setAsMenu(e.target.checked)} />
              Menu varianta (kebab + dropdown)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
              Kompaktní velikost
            </label>
            <ScopeGuard anyOf={[TEAM_SCOPES.WRITE, TEAM_SCOPES.ADD]}>
              <Button
                type="button"
                variant="primary"
                ariaLabel="Nový člen"
                leftIcon={<UserPlus size={16} />}
                className="shrink-0 whitespace-nowrap"
              >
                <span>translated 'Nový člen'</span>
              </Button>
            </ScopeGuard>
          </>
        }
      />

      {/* ✅ Globální inline status pro demo stránku */}
      <InlineStatus scope={SCOPE} />

      {/* A) Standalone seznam s akcemi pro každý řádek */}
      <section className="rounded-xl border p-4">
        <div className="mb-3 text-sm text-muted-foreground">
          Standalone použití (mimo tabulku): inline i menu varianta jedním přepínačem.
        </div>
        <ul className="divide-y">
          {MOCK_ROWS.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{row.name}</div>
                <div className="text-xs text-muted-foreground">status: {row.status}</div>
              </div>

              <RowActions
                item={row}
                actions={buildActions(row)}
                asMenu={asMenu}
                compact={compact}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* B) Integrace do DataTableV2 (snippet) */}
      <section className="rounded-xl border p-4">
        <div className="mb-3 text-sm text-muted-foreground">
          V DataTableV2 předáš RowActions do prop <code>rowActions</code>:
        </div>
        <pre className={cn('rounded-lg bg-gray-50 p-3 text-xs overflow-auto')}>
{`<DataTableV2<YourRowType>
// ...
rowActions={(row) => (
  <RowActions
    item={row}                     // 👈 povinné
    actions={buildActions(row)}    // 👈 per-row akce
    asMenu
    compact
  />
)}
/>`}
        </pre>
      </section>
    </div>
  );
}
