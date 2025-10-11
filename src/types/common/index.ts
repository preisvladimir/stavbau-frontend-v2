export type SelectOption = { value: string; label: string };
export type apiParams = {
  q?: string;
  page?: number;            // 0-based
  size?: number;            // default 10–20
  sort?: string | string[]; // "name,asc" apod.
  signal?: AbortSignal;
};