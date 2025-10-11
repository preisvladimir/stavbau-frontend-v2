// src/components/ui/stavbau-ui/datatable/datatable-v2.tsx
import * as React from 'react';
import { useId } from 'react';
import {
  useDataTableV2Core,
  type DataTableV2Props,
  type TableDensity,
  type Filters,
  type ToolbarRoleOption,
} from './datatable-v2-core';
import { cn } from '@/lib/utils/cn';
import { SearchInput } from '@/components/ui/stavbau-ui/searchinput';
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate/emptystate';
import { Select } from '@/components/ui/stavbau-ui/select';
import { Button } from '@/components/ui/stavbau-ui/button';
import { DensitySelect } from '@/components/ui/stavbau-ui/datatable/density-select';
import { ColumnVisibilityMenu } from '@/components/ui/stavbau-ui/column-visibility';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight } from '@/components/icons';
import { DataRowCard } from './DataRowCard';
import { getStickySide, stickyHeaderClasses, stickyCellClasses } from './sticky';
import { sbCardBase, sbFocusRing } from '@/components/ui/stavbau-ui/tokens';

type RoleOption = { value: string; label: React.ReactNode };

function DataTableV2Toolbar({
  table,
  searchValue, onSearchChange,
  density, setDensity,
  t,
  page, pageCount, pageSize, setPageSize, pageSizeOptions,
  onReset,
  filters, setFilter,
  roleOptions,
}: {
  table: ReturnType<typeof useDataTableV2Core<any>>['table'];
  searchValue: string; onSearchChange: (s: string) => void;
  density: TableDensity; setDensity: (d: TableDensity) => void;
  t: (key: string, opts?: any) => string;
  page: number; pageCount: number; pageSize: number; setPageSize: (n: number) => void;
  pageSizeOptions: number[];
  onReset: () => void;
  filters: Filters;
  setFilter: (key: string, value: Filters[string]) => void;
  roleOptions?: RoleOption[];
}) {
  const columns = table.getAllLeafColumns().filter((c) => (c.getCanHide?.() ?? false));

  // <- filtr role přes core API
  const handleRoleChange = (val: string) => {
    setFilter('role', val || undefined);
  };

  const hasRoleFilter = Array.isArray(roleOptions) && roleOptions.length > 0;
  const roleValue = String(filters.role ?? '');
  const options = React.useMemo(() => {
    const base = roleOptions ?? [];
    const hasAll = base.some(o => String(o.value) === '');
    return hasAll
      ? base
      : [{ value: '', label: t('datatable.filter.all', { defaultValue: '— Vše —' }) }, ...base];
  }, [roleOptions, t]);

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-[rgb(var(--sb-surface))] border-b border-[rgb(var(--sb-border))]">
      {/* ===== MOBILE (xs–sm): Search + (Role) + Reset ===== */}
      <div className="w-full flex items-center gap-2 md:hidden">
        <SearchInput
          size="md"
          value={searchValue}
          onChange={onSearchChange}
          preset="v1"
          leftIcon="search"
          clearable
          ariaLabel={t('datatable.search', { defaultValue: 'Hledat' })}
          placeholder={t('datatable.searchPlaceholder', { defaultValue: 'Hledat e-mail, jméno, telefon…' })}
          className="flex-1"
        />
        {hasRoleFilter && (
          <Select
            size="md"
            variant="outline"
            value={roleValue}
            onChange={handleRoleChange}
            ariaLabel={t('datatable.filter.role', { defaultValue: 'Filtrovat roli' })}
            className="w-[9.5rem]"
            options={[
              { value: '', label: t('datatable.filter.all', { defaultValue: 'Vše' }) },
              ...roleOptions!,
            ]}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<X size={16} />}
          ariaLabel={t('datatable.reset', { defaultValue: 'Vymazat filtr' })}
          title={t('datatable.reset', { defaultValue: 'Vymazat filtr' })}
          onClick={onReset}
        />
      </div>

      {/* ===== TABLET/DESKTOP (md+): plný toolbar ===== */}
      <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2 md:w-full">
        {/* Page size */}
        <div className="inline-flex items-center gap-2">
          <span className="text-sm">{t('datatable.pageSize', { defaultValue: 'Počet na stránku' })}</span>
          <Select
            size="md"
            variant="outline"
            value={String(pageSize)}
            onChange={(v) => setPageSize(Number(v))}
            ariaLabel={t('datatable.pageSize', { defaultValue: 'Počet na stránku' })}
            options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
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
              const id = String(col.id ?? '');
              const startCase = id ? id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : '';
              const metaLabel = (col.columnDef.meta as any)?.stbMobile?.label as string | undefined;
              const header = col.columnDef.header;
              const labelText =
                (typeof metaLabel === 'string' && metaLabel.trim())
                  ? metaLabel
                  : (typeof header === 'string'
                    ? header
                    : t(`columns.${id}`, { defaultValue: startCase }));

              return {
                id: col.id!,
                label: labelText,
                checked: col.getIsVisible?.() ?? true,
                disabled: col.columnDef.enableHiding === false,
              };
            })}
            onToggle={(id, value) => {
              const col = columns.find((c) => c.id === id);
              if (col) col.toggleVisibility(!!value);
            }}
            onReset={() => table.resetColumnVisibility()}
            variant="popover"
          />
        )}

        {/* Paging indicator */}
        <div className="text-xs text-foreground/70" aria-live="polite">
          {t('datatable.pageIndicator', { defaultValue: 'Stránka {{p}} / {{c}}', p: page, c: pageCount })}
        </div>

        {/* Search */}
        <div className="min-w-[320px] lg:min-w-[420px] md:flex-1">
          <SearchInput
            size="md"
            value={searchValue}
            onChange={onSearchChange}
            preset="v1"
            leftIcon="search"
            clearable
            ariaLabel={t('datatable.search', { defaultValue: 'Hledat' })}
            placeholder={t('datatable.searchPlaceholder', { defaultValue: 'Hledat e-mail, jméno, telefon…' })}
          />
        </div>

        {/* Role filter */}
        {hasRoleFilter && (
          <div className="inline-flex items-center gap-2">
            <span className="text-sm">{t('datatable.filter.role', { defaultValue: 'Role' })}</span>
            <Select
              size="md"
              variant="outline"
              value={roleValue}
              onChange={handleRoleChange}
              ariaLabel={t('datatable.filter.role', { defaultValue: 'Filtrovat roli' })}
              className="w-[11rem]"
              options={options}
            />
          </div>
        )}

        {/* Reset (right) */}
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<X size={16} />}
            ariaLabel={t('datatable.reset', { defaultValue: 'Vymazat filtr' })}
            title={t('datatable.reset', { defaultValue: 'Vymazat filtr' })}
            onClick={onReset}
          />
        </div>

        {/* Density (lg+) */}
        <div className="hidden lg:block">
          <DensitySelect
            value={density}
            onChange={(d) => setDensity(d)}
            label={t('datatable.density')}
            optionCompact={t('datatable.density_compact')}
            optionCozy={t('datatable.density_cozy')}
            optionComfortable={t('datatable.density_comfortable')}
          />
        </div>
      </div>
    </div>
  );
}

export function DataTableV2<T>(props: DataTableV2Props<T>) {
  const { t: tCommon } = useTranslation('common');
  const tt = (k: string, o?: any) => String(tCommon(k, o));
  const { t: tCard } = useTranslation(props.i18nNamespaces ?? ['common']);
  const tableId = useId();

  const {
    table, flexRender, getRowKey, api,
    search, setSearch, density, setDensity, densityClasses,
    resetAll, pageSizeOptions,
    filters, setFilter,
  } = useDataTableV2Core(props);

  const isEmpty = !props.loading && props.data.length === 0;
  const hasRowActions = typeof (props as any).rowActions === 'function';

  const v = props.variant ?? 'plain';
  const wrapperClass = v === 'surface' ? sbCardBase : '';

  const rows = table.getRowModel().rows;

  // Debounce search
  const searchDebounceMs = props.searchDebounceMs ?? 250;
  const [searchLocal, setSearchLocal] = React.useState(search);
  React.useEffect(() => setSearchLocal(search), [search]);
  React.useEffect(() => {
    const h = window.setTimeout(() => {
      if (searchLocal !== search) setSearch(searchLocal);
    }, searchDebounceMs);
    return () => window.clearTimeout(h);
  }, [searchLocal, search, searchDebounceMs, setSearch]);

  // Loading anti-flicker
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  React.useEffect(() => { if (!props.loading) setHasLoadedOnce(true); }, [props.loading]);
  const [delayedLoading, setDelayedLoading] = React.useState(false);
  React.useEffect(() => {
    let t: number | undefined;
    if (props.loading) t = window.setTimeout(() => setDelayedLoading(true), 150);
    else setDelayedLoading(false);
    return () => { if (t) window.clearTimeout(t); };
  }, [props.loading]);
  const mode = props.loadingMode ?? 'auto';
  const showSkeleton = mode === 'skeleton' || (mode === 'auto' && delayedLoading && !hasLoadedOnce);
  const showOverlay = mode === 'overlay' || (mode === 'auto' && delayedLoading && hasLoadedOnce);

  // Role options (pokud komponenta dostává)
  const roleOptions: ToolbarRoleOption[] | undefined = props.roleOptions;

  return (
    <div className={cn('w-full', wrapperClass, props.className)}>
      {/* Toolbar */}
      {props.showToolbar !== false && (
        <DataTableV2Toolbar
          table={table}
          searchValue={searchLocal}
          onSearchChange={setSearchLocal}
          density={density}
          setDensity={setDensity}
          t={tt}
          page={api.page}
          pageCount={api.pageCount}
          pageSize={api.pageSize}
          setPageSize={api.setPageSize}
          pageSizeOptions={pageSizeOptions}
          onReset={resetAll}
          filters={filters}
          setFilter={setFilter}
          roleOptions={roleOptions}
        />
      )}

      {/* ===== MOBILE <md: KARTY ===== */}
      <div
        className="md:hidden px-3 py-3 space-y-3"
        role="list"
        aria-label={tt('datatable.mobileListLabel', { defaultValue: 'Seznam záznamů' })}
      >
        {showSkeleton ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`sk-card-${i}`} className="rounded-2xl border p-3 shadow-sm animate-pulse">
              <div className="h-5 w-2/3 bg-muted rounded mb-2" />
              <div className="h-4 w-1/3 bg-muted rounded mb-3" />
              <div className="h-4 w-full bg-muted rounded mb-1" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          ))
        ) : isEmpty ? (
          props.emptyContent ?? (
            <EmptyState title={tt('datatable.empty.title')} description={tt('datatable.empty.desc')} />
          )
        ) : (
          rows.map((row, idx) => (
            <DataRowCard
              key={getRowKey(row.original as T, idx)}
              row={row}
              actionsRenderer={hasRowActions ? (props as any).rowActions : undefined}
              onRowClick={props.onRowClick ? () => props.onRowClick!(row.original as T) : undefined}
              t={tCard}
            />
          ))
        )}
      </div>

      {/* ===== DESKTOP md+: TABULKA ===== */}
      <div className="hidden md:block">
        <div className={cn('md:overflow-x-auto')}>
          <table role="table" id={tableId} className={cn('sb-table text-sm md:min-w-[900px] lg:min-w-full break-words')}>
            <thead className="lg:sticky lg:top-0 lg:z-10 lg:bg-[rgb(var(--sb-surface))] lg:backdrop-blur-[2px]">
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
                          'px-3 py-2 font-medium',
                          densityClasses.th,
                          'px-3 py-2 font-medium bg-[rgb(var(--sb-surface))] lg:bg-clip-padding',
                          canSort && cn('cursor-pointer hover:text-foreground rounded', sbFocusRing),
                          stickyHeaderClasses(stickySide),
                          stickySide === 'left' && 'md:border-r md:border-[rgb(var(--sb-border))]',
                          stickySide === 'right' && 'md:border-l md:border-[rgb(var(--sb-border))]'
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
                            ? tt('datatable.sort.desc')
                            : sorted === 'desc'
                              ? tt('datatable.sort.none')
                              : tt('datatable.sort.asc')
                        }
                      >
                        <div className="inline-flex items-center gap-1">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && <span aria-hidden className="text-foreground/50">{sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕'}</span>}
                        </div>
                      </th>
                    );
                  })}
                  {hasRowActions && (
                    <th
                      scope="col"
                      className={cn(
                        'px-3 py-2 font-medium',
                        densityClasses.th,
                        'text-right text-foreground/80 select-none',
                        stickyHeaderClasses('right'),
                        'md:border-l md:border-[rgb(var(--sb-border))]'
                      )}
                      data-testid="dtv2-actions-header"
                    >
                      {tt('datatable.actions', { defaultValue: 'Akce' })}
                    </th>
                  )}
                </tr>
              ))}
            </thead>

            <tbody>
              {showSkeleton ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="motion-safe:animate-pulse">
                    {table.getAllColumns().map((c) => {
                      const side = getStickySide(c);
                      return (
                        <td
                          key={c.id}
                          className={cn(
                            'px-3 py-2 border-t border-[rgb(var(--sb-border))]',
                            densityClasses.td,
                            'break-words',
                            stickyCellClasses(side),
                            side === 'left' && 'md:border-r md:border-[rgb(var(--sb-border))]',
                            side === 'right' && 'md:border-l md:border-[rgb(var(--sb-border))]'
                          )}
                        >
                          <div className="h-4 w-24 rounded bg-muted" />
                        </td>
                      );
                    })}
                    {hasRowActions && (
                      <td
                        className={cn(
                          'px-3 py-2 border-t border-[rgb(var(--sb-border))]',
                          densityClasses.td,
                          'text-right break-words',
                          stickyCellClasses('right'),
                          'md:border-l md:border-[rgb(var(--sb-border))]'
                        )}
                      >
                        <div className="h-4 w-10 rounded bg-muted" />
                      </td>
                    )}
                  </tr>
                ))
              ) : isEmpty ? (
                <tr>
                  <td
                    colSpan={table.getAllColumns().length + (hasRowActions ? 1 : 0)}
                    className={cn(densityClasses.td, 'py-6')}
                  >
                    {props.emptyContent ?? (
                      <EmptyState title={tt('datatable.empty.title')} description={tt('datatable.empty.desc')} />
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr
                    key={getRowKey(row.original as T, idx)}
                    className={cn(
                      v === 'surface'
                        ? 'odd:bg-white even:bg-[rgb(var(--sb-surface-2))] hover:bg-[rgb(var(--sb-surface-hover))]'
                        : 'hover:bg-muted/40',
                      props.onRowClick && 'cursor-pointer'
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
                            'px-3 py-2 border-t border-[rgb(var(--sb-border))]',
                            densityClasses.td,
                            'break-words',
                            stickyCellClasses(side),
                            side === 'left' && 'md:border-r md:border-[rgb(var(--sb-border))]',
                            side === 'right' && 'md:border-l md:border-[rgb(var(--sb-border))]'
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                    {hasRowActions && (
                      <td
                        className={cn(
                          'px-3 py-2 border-t border-[rgb(var(--sb-border))]',
                          densityClasses.td,
                          'text-right',
                          stickyCellClasses('right'),
                          'md:border-l md:border-[rgb(var(--sb-border))]'
                        )}
                      >
                        <div
                          className="inline-flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation(); // nepropagovat do onRowClick
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

          {/* Overlay loading */}
          {showOverlay && (
            <div
              aria-live="polite"
              className="absolute inset-0 z-10 grid place-items-center bg-[rgb(var(--sb-surface))]/60 backdrop-blur-[1px]"
            >
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-transparent" />
                <span>{tt('datatable.loading', { defaultValue: 'Načítám…' })}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pager */}
      {props.showPager !== false && api.pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <div aria-live="polite">
            {tt('datatable.pageIndicator', {
              defaultValue: 'Stránka {{p}} / {{c}} • Záznamů: {{n}}',
              p: api.page, c: api.pageCount, n: api.total,
            })}
          </div>

          <nav className="inline-flex items-center gap-1" aria-label={tt('datatable.pagination', { defaultValue: 'Stránkování' })}>
            <Button size="sm" variant="outline" onClick={() => api.gotoPage(1)} disabled={api.page === 1}>
              1⏮
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => api.prevPage()}
              disabled={!api.canPrevPage}
              aria-disabled={!api.canPrevPage}
              ariaLabel={tt('datatable.prev', { defaultValue: 'Předchozí stránka' })}
              aria-controls={tableId}
            />
            <div className="hidden md:flex items-center gap-1">
              {(() => {
                const pages: (number | '…')[] = [];
                const cur = api.page;
                const max = api.pageCount;
                const push = (v: number | '…') => pages.push(v);
                if (max <= 7) {
                  for (let i = 1; i <= max; i++) push(i);
                } else {
                  push(1);
                  if (cur > 3) push('…');
                  const start = Math.max(2, cur - 1);
                  const end = Math.min(max - 1, cur + 1);
                  for (let i = start; i <= end; i++) push(i);
                  if (cur < max - 2) push('…');
                  push(max);
                }
                return pages.map((p, idx) =>
                  p === '…' ? (
                    <span key={`dots-${idx}`} className="px-1 text-foreground/60 select-none">…</span>
                  ) : (
                    <Button
                      key={p}
                      size="sm"
                      variant={p === cur ? 'outlinegreen' : 'outline'}
                      onClick={() => p !== cur && api.gotoPage(p)}
                      disabled={p === cur}
                      aria-current={p === cur ? 'page' : undefined}
                      aria-label={tt('datatable.pageN', { defaultValue: 'Stránka {{n}}', n: p })}>
                      {p}
                    </Button>
                  )
                );
              })()}
            </div>
            <Button
              size="sm"
              variant="outline"
              rightIcon={<ChevronRight className="h-4 w-4" />}
              onClick={() => api.nextPage()}
              disabled={!api.canNextPage}
              ariaLabel={tt('datatable.next', { defaultValue: 'Další stránka' })}
              aria-controls={tableId}
            />
            <Button size="sm" variant="outline" onClick={() => api.gotoPage(api.pageCount)} disabled={api.page === api.pageCount}>
              ⏭{api.pageCount}
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}

export default DataTableV2;
