// NOTE (Step 1/6 – responsive hybrid):
// Přidána module augmentation @tanstack/react-table → columnDef.meta.stbMobile
// Umožní nám v dalších krocích (Step 2/3) vyrenderovat <md karty a md–lg scroll s prioritami.
// Tento krok NEMĚNÍ žádné UI chování; pouze typy.
// Viz: src/types/datatable.mobile.d.ts a helper: datatable/mobileMeta.ts

import * as React from 'react';
import { useDataTableV2Core, type DataTableV2Props, type TableDensity } from './datatable-v2-core';
import { cn } from '@/lib/utils/cn';
import { SearchInput } from "@/components/ui/stavbau-ui/searchinput";
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate';
import { Select } from '@/components/ui/stavbau-ui/select';
import { Button } from "@/components/ui/stavbau-ui/button";
import { DensitySelect } from "@/components/ui/stavbau-ui/datatable/density-select";
import { ColumnVisibilityMenu } from '@/components/ui/stavbau-ui/column-visibility';
import { useTranslation } from 'react-i18next'; // ← i18n (PR4)
import { X } from "@/components/icons";
import { DataRowCard } from './DataRowCard';
import { getStickySide, stickyHeaderClasses, stickyCellClasses } from './sticky';

function DataTableV2Toolbar({
  table,
  search, setSearch,
  density, setDensity,
  t,
  page, pageCount, pageSize, setPageSize, pageSizeOptions,
  onReset,
}: {
  table: ReturnType<typeof useDataTableV2Core<any>>['table'];
  search: string; setSearch: (s: string) => void;
  density: TableDensity; setDensity: (d: TableDensity) => void;
  t: (key: string, opts?: any) => string;
  page: number; pageCount: number; pageSize: number; setPageSize: (n: number) => void;
  pageSizeOptions: number[];
  onReset: () => void;
}) {
  const columns = table.getAllLeafColumns().filter(c => c.getCanHide?.());
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[rgb(var(--sb-border))] bg-[rgb(var(--sb-surface))]">
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
        <ColumnVisibilityMenu
          triggerLabel={t('datatable.showColumns', { defaultValue: 'Sloupce' })}
          title={t('datatable.columns', { defaultValue: 'Sloupce' })}
          resetLabel={t('datatable.reset', { defaultValue: 'Reset' })}
          ariaLabel={t('datatable.showColumns', { defaultValue: 'Zobrazit sloupce' })}
          items={columns.map((col) => {
            const labelText =
              typeof col.columnDef.header === 'string'
                ? col.columnDef.header
                : (col.id ?? '');
            return {
              id: col.id!,
              label: labelText,
              checked: col.getIsVisible(),
              disabled: col.columnDef.enableHiding === false,
            };
          })}
          onToggle={(id, value) => {
            const col = columns.find((c) => c.id === id);
            col?.toggleVisibility(value);
          }}
          onReset={() => table.resetColumnVisibility()}
          variant="popover"
        />
      )}
      {/* Paging */}
      <div className="ml-2 text-xs text-foreground/70" aria-live="polite">
        {t('datatable.pageIndicator', { defaultValue: 'Stránka {{p}} / {{c}}', p: page, c: pageCount })}
      </div>
      {/* Search */}
      <div className="min-w-[240px] md:min-w-[320px] lg:min-w-[420px] flex-1">
        <SearchInput
          size="md"
          value={search}
          onChange={setSearch}
          preset="v1"
          leftIcon="search"
          clearable
          ariaLabel={t("datatable.search", { defaultValue: "Hledat" })}
          placeholder={t("datatable.searchPlaceholder", { defaultValue: "Hledat e-mail, jméno, telefon…" })}
        />
      </div>
      {/* Density */}
      <DensitySelect
        value={density}
        onChange={(d) => setDensity(d)}
        label={t("datatable.density")}
        optionCompact={t("datatable.density_compact")}
        optionCozy={t("datatable.density_cozy")}
        optionComfortable={t("datatable.density_comfortable")}
        className="ml-auto"
      />
      {/* Reset */}
      <Button variant="ghost" size="sm" leftIcon={<X size={16} />} onClick={onReset} />
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
      ? "rounded-xl border border-[rgb(var(--sb-border))] bg-[rgb(var(--sb-surface))]"
      : ""; // plain = bez karty

  const rows = table.getRowModel().rows;

  return (
    <div className={cn("w-full", wrapperClass, props.className)}>
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

      {/* ===== MOBILE <md: KARTY ===== */}
      <div className="md:hidden px-3 py-3 space-y-3">
        {props.loading ? (
          // jednoduchý skeleton pro 3 karty
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`sk-card-${i}`} className="rounded-2xl border p-3 shadow-sm animate-pulse">
              <div className="h-5 w-2/3 bg-muted rounded mb-2" />
              <div className="h-4 w-1/3 bg-muted rounded mb-3" />
              <div className="h-4 w-full bg-muted rounded mb-1" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          ))
        ) : isEmpty ? (
          props.emptyContent ?? <EmptyState title={t('datatable.empty.title')} description={t('datatable.empty.desc')} />
        ) : (
          rows.map((row, idx) => (
            <DataRowCard
              key={getRowKey(row.original as T, idx)}
              row={row}
              // volitelný prop – předej do DataRowCard a tam vlož do actions místa:
              // {actionsRenderer?.(row.original)}
              actionsRenderer={hasRowActions ? (props as any).rowActions : undefined}
              onRowClick={props.onRowClick ? () => props.onRowClick!(row.original as T) : undefined}
            />
          ))
        )}
      </div>

      {/* ===== DESKTOP md+: TABULKA ===== */}
      <div className="hidden md:block">
        {/* H-scroll pro md–lg; na lg už typicky min-w stačí = full */}
        <div className={cn("md:overflow-x-auto")}>
          <table
            role="table"
            className={cn(
              // na md dáme minimální šířku, aby vznikl přirozený H-scroll,
              // na lg vracíme min-w-full (plná tabulka)
              "sb-table text-sm md:min-w-[900px] lg:min-w-full"
            )}
          >
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="text-[rgb(var(--sb-muted))] text-left">
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort?.() ?? false;
                    const sorted = header.column.getIsSorted?.() as false | 'asc' | 'desc';
                    const aria = sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none';
                    const stickySide = getStickySide(header.column);

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
                          canSort && "cursor-pointer hover:text-foreground",
                          // sticky na md, static na lg
                          stickyHeaderClasses(stickySide),
                          // malá pomocná bordura, ať je sticky hranice patrná
                          stickySide === 'left' && "md:border-r md:border-[rgb(var(--sb-border))]",
                          stickySide === 'right' && "md:border-l md:border-[rgb(var(--sb-border))]"
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
                      className={cn(
                        "px-3 py-2 font-medium",
                        densityClasses.th,
                        "text-right text-foreground/80 select-none",
                        // akční header sticky vpravo (md), static na lg
                        stickyHeaderClasses('right'),
                        "md:border-l md:border-[rgb(var(--sb-border))]"
                      )}
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
                    {table.getAllColumns().map((c) => {
                      const side = getStickySide(c);
                      return (
                        <td
                          key={c.id}
                          className={cn(
                            "px-3 py-2 border-t border-[rgb(var(--sb-border))]",
                            densityClasses.td,
                            stickyCellClasses(side),
                            side === 'left' && "md:border-r md:border-[rgb(var(--sb-border))]",
                            side === 'right' && "md:border-l md:border-[rgb(var(--sb-border))]"
                          )}
                        >
                          <div className="h-4 w-24 rounded bg-muted" />
                        </td>
                      );
                    })}
                    {hasRowActions && (
                      <td
                        className={cn(
                          "px-3 py-2 border-t border-[rgb(var(--sb-border))]",
                          densityClasses.td,
                          stickyCellClasses('right'),
                          "md:border-l md:border-[rgb(var(--sb-border))]"
                        )}
                      >
                        <div className="h-4 w-10 rounded bg-muted" />
                      </td>
                    )}
                  </tr>
                ))
              ) : isEmpty ? (
                <tr>
                  <td colSpan={table.getAllColumns().length + (hasRowActions ? 1 : 0)} className={cn(densityClasses.td, 'py-6')}>
                    {props.emptyContent ?? <EmptyState title={t('datatable.empty.title')} description={t('datatable.empty.desc')} />}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
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
                    {row.getVisibleCells().map((cell) => {
                      const side = getStickySide(cell.column);
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "px-3 py-2 border-t border-[rgb(var(--sb-border))]",
                            densityClasses.td,
                            stickyCellClasses(side),
                            side === 'left' && "md:border-r md:border-[rgb(var(--sb-border))]",
                            side === 'right' && "md:border-l md:border-[rgb(var(--sb-border))]"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                    {hasRowActions && (
                      <td
                        className={cn(
                          "px-3 py-2 border-t border-[rgb(var(--sb-border))]",
                          densityClasses.td,
                          "text-right",
                          stickyCellClasses('right'),
                          "md:border-l md:border-[rgb(var(--sb-border))]"
                        )}
                      >
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
        </div>
      </div>

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
