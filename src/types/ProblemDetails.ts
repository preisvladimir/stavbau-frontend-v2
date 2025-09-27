// ProblemDetail (BE sjednoceno)
export type ProblemDetail = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  code?: string; // např. 'company.exists', 'user.email.exists', 'validation.error'
  path?: string;
  [k: string]: unknown;
};