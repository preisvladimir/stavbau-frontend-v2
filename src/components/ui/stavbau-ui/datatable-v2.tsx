// PATCH: datatable-v2.tsx
import * as React from 'react';
import { useDataTableV2Core, type DataTableV2Props } from './datatable-v2-core';
import { cn } from '@/lib/utils/cn';
import { SearchInput } from "@/components/ui/stavbau-ui/searchinput";
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate';
import { Select } from '@/components/ui/stavbau-ui/select';
import { useTranslation } from 'react-i18next'; // ← i18n (PR4)


function DataTableV2Toolbar({
  table,
  search, setSearch,
  density, setDensity,
  t,
  page, pageCount, pageSize, setPageSize, pageSizeOptions,  // ← NEW
  onReset,                                                  // ← NEW
}: {
  table: ReturnType<typeof useDataTableV2Core<any>>['table'];
  search: string; setSearch: (s: string) => void;
  density: 'compact' | 'cozy' | 'comfortable'; setDensity: (d: 'compact' | 'cozy' | 'comfortable') => void;
  t: (key: string, opts?: any) => string;
  page: number; pageCount: number; pageSize: number; setPageSize: (n: number) => void;
  pageSizeOptions: number[];
  onReset: () => void;
}) {
  const columns = table.getAllLeafColumns().filter(c => c.getCanHide?.());
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b bg-background">
      <div className="min-w-[240px] md:min-w-[320px] lg:min-w-[420px] flex-1">

        {/* Search */}
        <SearchInput
          value={search}
          onChange={setSearch}
          preset="v1"
          leftIcon="search"
          clearable
          ariaLabel={t("datatable.search", { defaultValue: "Hledat" })}
          placeholder={t("datatable.searchPlaceholder", { defaultValue: "Hledat e-mail, jméno, telefon…" })}
        />
      </div>

      {/* Page size */}
 <div className="inline-flex items-center gap-2">
   <span className="text-sm">{t('datatable.pageSize', { defaultValue: 'Počet na stránku' })}</span>
   <Select
     size="md"
     variant="outline"
    value={String(pageSize)}
     onChange={(v) => setPageSize(Number(v))}
     ariaLabel={t('datatable.pageSize', { defaultValue: 'Počet na stránku' })}
     options={pageSizeOptions.map(n => ({ value: String(n), label: String(n) }))}
   />
 </div>


      {/* Column visibility */}
      {columns.length > 0 && (
        <div className="relative">
          <details>
            <summary
              className="cursor-pointer select-none text-sm px-2 py-1 rounded border hover:bg-muted"
              aria-label={t('datatable.showColumns')}
              data-testid="dtv2-columns-trigger"
            >
              {t('datatable.showColumns')}
            </summary>
            <div className="absolute z-10 mt-1 w-56 rounded border bg-popover p-2 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-foreground/70">{t('datatable.columns')}</span>
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => table.resetColumnVisibility()}
                >
                  {t('datatable.reset')}
                </button>
              </div>
              <ul className="max-h-56 overflow-auto space-y-1">
                {columns.map((col) => {
                  const labelText =
                    typeof col.columnDef.header === 'string'
                      ? col.columnDef.header
                      : (col.id ?? ''); // fallback na id

                  return (
                    <li key={col.id} className="flex items-center gap-2 text-sm">
                      <input
                        id={`col-${col.id}`}
                        type="checkbox"
                        checked={col.getIsVisible()}
                        onChange={(e) => col.toggleVisibility(e.currentTarget.checked)}
                      />
                      <label htmlFor={`col-${col.id}`}>{labelText}</label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        </div>
      )}

      {/* Density */}
      <div className="ml-auto inline-flex items-center gap-1">
        <span className="text-xs text-foreground/70">{t('datatable.density')}</span>
        {(['compact', 'cozy', 'comfortable'] as const).map(d => (
          <button
            key={d}
            type="button"
            className={cn(
              'px-2 py-1 text-xs rounded border',
              density === d ? 'bg-muted font-medium' : 'hover:bg-muted'
            )}
            onClick={() => setDensity(d)}
            aria-pressed={density === d}
          >
            {t(`datatable.density_${d}`)}
          </button>
        ))}
      </div>

      {/* Reset */}
      <button
        type="button"
        className="ml-auto px-3 py-1 text-sm rounded border hover:bg-muted"
        onClick={onReset}
        aria-label={t('datatable.resetFilters')}
        title={t('datatable.resetFilters')}
      >
        {t('datatable.resetFilters')}
      </button>
      <div className="ml-2 text-xs text-foreground/70" aria-live="polite">
        {t('datatable.pageIndicator', { defaultValue: 'Stránka {{p}} / {{c}}', p: page, c: pageCount })}
      </div>
    </div>
  );
}



export function DataTableV2<T>(props: DataTableV2Props<T>) {
  const { t } = useTranslation('common');
  const tt = (k: string, o?: any) => String(t(k, o));
  const {
    table, flexRender, getRowKey, api,
    search, setSearch, density, setDensity, densityClasses,
    resetAll, pageSizeOptions,
  } = useDataTableV2Core(props);
  const isEmpty = !props.loading && props.data.length === 0;
  const hasRowActions = typeof (props as any).rowActions === 'function';

  const v = props.variant ?? 'plain';
  const wrapperClass =
    v === 'surface'
      ? "overflow-x-auto rounded-xl border border-[rgb(var(--sb-border))] bg-[rgb(var(--sb-surface))]"
      : "overflow-x-auto"; // plain = bez karty

  return (
    <div className={cn(wrapperClass, props.className)}>

      {/* Toolbar */}
      {props.showToolbar !== false && (
        <DataTableV2Toolbar
          table={table}
          search={search}
          setSearch={setSearch}
          density={density}
          setDensity={setDensity}
          t={tt}
          page={api.page}
          pageCount={api.pageCount}
          pageSize={api.pageSize}
          setPageSize={api.setPageSize}
          pageSizeOptions={pageSizeOptions}
          onReset={resetAll}
        />
      )}
      <table role="table" className={cn("sb-table min-w-full text-sm")}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="text-[rgb(var(--sb-muted))] text-left">
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort?.() ?? false;
                const sorted = header.column.getIsSorted?.() as false | 'asc' | 'desc';
                const aria = sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none';

                const onClick = (e: React.MouseEvent) => {
                  if (!canSort) return;
                  header.column.toggleSorting(undefined, e.shiftKey);
                };

                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={aria as any}
                    className={cn(
                      "px-3 py-2 font-medium",
                      densityClasses.th,
                      "text-foreground/80 select-none",
                      canSort && "cursor-pointer hover:text-foreground"
                    )}
                    onClick={onClick}
                    tabIndex={canSort ? 0 : -1}
                    onKeyDown={(e) => {
                      if (!canSort) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        header.column.toggleSorting(undefined, e.shiftKey);
                      }
                    }}
                    title={
                      sorted === 'asc'
                        ? t('datatable.sort.desc')
                        : sorted === 'desc'
                          ? t('datatable.sort.none')
                          : t('datatable.sort.asc')
                    }
                  >
                    <div className="inline-flex items-center gap-1">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span aria-hidden className="text-foreground/50">
                          {sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {hasRowActions && (
                <th
                  scope="col"
                  className={cn("px-3 py-2 font-medium", densityClasses.th, "text-right text-foreground/80 select-none")}
                  data-testid="dtv2-actions-header"
                >
                  {t('datatable.actions', { defaultValue: 'Akce' })}
                </th>
              )}
            </tr>
          ))}
        </thead>

        <tbody>
          {props.loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={`sk-${i}`} className="animate-pulse">
                {table.getAllColumns().map((c) => (
                  <td key={c.id} className={cn(densityClasses.td)}>
                    <div className="h-4 w-24 rounded bg-muted" />
                  </td>
                ))}
              </tr>
            ))
          ) : isEmpty ? (
            <tr>
              <td colSpan={table.getAllColumns().length} className={cn(densityClasses.td, 'py-6')}>
                {props.emptyContent ?? <EmptyState title={t('datatable.empty.title')} description={t('datatable.empty.desc')} />}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, idx) => (
              <tr
                key={getRowKey(row.original as T, idx)}
                className={cn(
                  v === 'surface'
                    ? "odd:bg-white even:bg-[rgb(var(--sb-surface-2))] hover:bg-slate-50"
                    : "hover:bg-muted/40",
                  props.onRowClick && "cursor-pointer"
                )}
                onClick={props.onRowClick ? () => props.onRowClick!(row.original as T) : undefined}
                tabIndex={props.onRowClick ? 0 : -1}
                aria-label={props.onRowClick ? 'Row clickable' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn("px-3 py-2 border-t border-[rgb(var(--sb-border))]", densityClasses.td)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                {hasRowActions && (
                  <th scope="col" className={cn(densityClasses.th, 'text-right text-foreground/80 select-none')}>
                    {t('datatable.actions', { defaultValue: 'Akce' })}
                  </th>
                )}

                {hasRowActions && (
                  <td className={cn("px-3 py-2 border-t border-[rgb(var(--sb-border))]", densityClasses.td, "text-right")}>
                    <div
                      className="inline-flex items-center gap-1"
                      onClick={(e) => {
                        // Zabrání přeposílání na onRowClick
                        e.stopPropagation();
                      }}
                    >
                      {(props as any).rowActions(row.original as T)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pager */}
      {props.showPager !== false && api.pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <div aria-live="polite">
            Stránka {api.page} / {api.pageCount} • Záznamů: {api.total}
          </div>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              className={cn(
                'px-3 py-1 rounded border',
                api.canPrevPage ? 'hover:bg-muted' : 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => api.prevPage()}
              disabled={!api.canPrevPage}
              aria-label="Předchozí stránka"
            >
              Předchozí
            </button>
            <button
              type="button"
              className={cn(
                'px-3 py-1 rounded border',
                api.canNextPage ? 'hover:bg-muted' : 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => api.nextPage()}
              disabled={!api.canNextPage}
              aria-label="Další stránka"
            >
              Další
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTableV2;
