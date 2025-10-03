// src/features/projects/api/types.ts
import type { PageResponse } from "@/types/PageResponse";

export type UUID = string;

// Enums — strojové hodnoty, label přijde z BE (statusLabel)
export type ProjectStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "DONE"
  | "ARCHIVED";

export type ProjectRoleName =
  | "PROJECT_MANAGER"
  | "SITE_MANAGER"
  | "QUANTITY_SURVEYOR"
  | "MEMBER"
  | "VIEWER"
  | string; // forward-compat

export type ProjectSummaryDto = {
  id: UUID;
  code: string;
  name: string;
  status: ProjectStatus;
  statusLabel?: string;
  customerId: UUID;
  projectManagerId?: UUID;
};

export type ProjectDto = {
  id: UUID;
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  statusLabel?: string;
  customerId: UUID;
  projectManagerId?: UUID;
  plannedStartDate?: string; // ISO YYYY-MM-DD
  plannedEndDate?: string;   // ISO
  actualStartDate?: string;  // ISO
  actualEndDate?: string;    // ISO
  currency?: string;
  vatMode?: string;
};

export type CreateProjectRequest = {
  code?: string;
  name: string;
  description?: string;
  customerId: UUID;
  projectManagerId?: UUID;
  plannedStartDate?: string;
  plannedEndDate?: string;
  currency?: string;
  vatMode?: string;
};

export type UpdateProjectRequest = Partial<CreateProjectRequest>;

export type ProjectMemberRequest = {
  userId: UUID;
  role: ProjectRoleName;
};

// Listing odpověď — reexport centrálního tvaru
export type ProjectsPage = PageResponse<ProjectSummaryDto>;
