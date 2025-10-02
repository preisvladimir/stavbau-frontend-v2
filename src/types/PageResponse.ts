// --- Pagination ---
export type PageResponse<T> = {
  items: T[];
  page: number; // always present (client doplní fallback)
  size: number; // always present (client doplní fallback)
  total: number; // always present (client doplní fallback)
};


// Standardní stránkovaná odpověď (FE kontrakt)
export interface PageResponseInterface<T> {
  items: T[];
  page?: number;
  size?: number;
  total?: number;
}
// Cursor-based stránkování (rezervováno do budoucna)
export type CursorPageResponse<T> = {
  items: T[];
  cursor?: string | null;
  hasMore?: boolean;
};