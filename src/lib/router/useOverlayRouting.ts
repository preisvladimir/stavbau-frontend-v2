// src/lib/router/useOverlayRouting.ts
import * as React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export type OverlayRoutingOptions = {
  /** Název modulu (např. 'projects', 'customers', 'team') */
  module: string;
  /** Prefix cesty před modulem (default: '/app') */
  basePrefix?: string;
  /** Název parametru pro :id (default: 'id') */
  idParam?: string;
  /** Klíč query pro edit overlay (default: 'edit') */
  editQueryKey?: string;
  /** Hodnota query pro edit overlay (default: '1') */
  editQueryValue?: string;
  /** Alternativní „close“ destinace (jinak modulová base) */
  closeTo?: string;
};

export type OverlayRouting = {
  /** Např. '/app/projects/' – vždy se závěrečným lomítkem */
  moduleBase: string;
  /** Aktuální id z URL (pokud existuje) */
  id: string | undefined;
  /** Stavové příznaky */
  isNew: boolean;
  isDetail: boolean;
  isEdit: boolean;
  /** Akce */
  openNew: () => void;
  openDetail: (id: string) => void;
  openEdit: (id: string) => void;
  closeOverlays: () => void;
};

/**
 * useOverlayRouting – sjednocené helpery pro routování „new/detail/edit overlay“.
 * - new:   /app/:module/new
 * - detail:/app/:module/:id
 * - edit:  /app/:module/:id?edit=1  (klíč/vald se dají změnit přes options)
 */
export function useOverlayRouting(opts: OverlayRoutingOptions): OverlayRouting {
  const {
    module,
    basePrefix = '/app',
    idParam = 'id',
    editQueryKey = 'edit',
    editQueryValue = '1',
    closeTo,
  } = opts;

  const navigate = useNavigate();
  const params = useParams<Record<string, string | undefined>>();
  const { search } = useLocation();

  // '/app/projects/'
  const moduleBase = React.useMemo(() => {
    const prefix = basePrefix.endsWith('/') ? basePrefix.slice(0, -1) : basePrefix;
    return `${prefix}/${module}/`;
  }, [basePrefix, module]);

  const id = params[idParam];

  const isNew = id === 'new';
  const isDetail = !!id && id !== 'new';

  const isEdit = React.useMemo(() => {
    if (!isDetail) return false;
    const qs = new URLSearchParams(search);
    const val = qs.get(editQueryKey);
    return val === editQueryValue;
  }, [isDetail, search, editQueryKey, editQueryValue]);

  const openNew = React.useCallback(() => {
    navigate(`${moduleBase}new`);
  }, [navigate, moduleBase]);

  const openDetail = React.useCallback(
    (nextId: string) => {
      navigate(`${moduleBase}${encodeURIComponent(String(nextId))}`);
    },
    [navigate, moduleBase]
  );

  const openEdit = React.useCallback(
    (nextId: string) => {
      navigate({
        pathname: `${moduleBase}${encodeURIComponent(String(nextId))}`,
        search: `?${editQueryKey}=${encodeURIComponent(editQueryValue)}`,
      });
    },
    [navigate, moduleBase, editQueryKey, editQueryValue]
  );

  const closeOverlays = React.useCallback(() => {
    navigate(closeTo ?? moduleBase);
  }, [navigate, closeTo, moduleBase]);

  return { moduleBase, id, isNew, isDetail, isEdit, openNew, openDetail, openEdit, closeOverlays };
}
