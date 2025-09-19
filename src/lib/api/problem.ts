import axios, { AxiosError } from "axios";

export type ApiProblem = {
  status: number;
  title?: string;
  detail?: string;
  code?: string;
  errors?: Record<string, unknown>;
};

export class ApiError extends Error {
  problem: ApiProblem;
  constructor(problem: ApiProblem) {
    super(problem.title || problem.detail || "API error");
    this.name = "ApiError";
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
      return {
        status,
        title: data.title ?? ax.message ?? ax.code,
        detail: data.detail ?? data.message,
        code: data.code,
        errors: (data as any).errors, // pole field errors (pokud BE posílá)
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
