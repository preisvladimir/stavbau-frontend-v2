import axios, { AxiosError } from "axios";

export type ApiProblem = {
  status: number;
  type?: string;
  title?: string;
  detail?: string;
  code?: string;
  errors?: Record<string, unknown>;
  requiredScopes?: string[];
  traceId?: string;
};

export class ApiError extends Error {
  problem: ApiProblem;
  constructor(problem: ApiProblem) {
    super(problem.detail || problem.title || "API error");
    this.problem = problem;
  }
}

/** Převede libovolnou chybu (zejm. AxiosError) na jednotný ApiProblem */
export function toApiProblem(err: unknown): ApiProblem {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;
    const status = ax.response?.status ?? 0;
    const data = ax.response?.data;

    if (data && typeof data === "object") {
      const fieldErrors = (data as any).errors ?? (data as any).fieldErrors;
      return {
        status,
        type: (data as any).type,
        title: data.title ?? ax.message ?? ax.code,
        detail: data.detail ?? data.message,
        code: data.code,
        errors: fieldErrors, // sjednoceně 'errors'
        requiredScopes: (data as any).requiredScopes,
        traceId: (data as any).traceId,
      };
    }

    return {
      status,
      title: ax.message ?? "HTTP error",
      detail: ax.response?.statusText,
    };
  }

  return {
    status: 0,
    title: "Unknown error",
    detail: err instanceof Error ? err.message : String(err),
  };
}

/** Vyhoď ApiError s namapovaným problémem */
export function mapAndThrow(err: unknown): never {
  throw new ApiError(toApiProblem(err));
}
