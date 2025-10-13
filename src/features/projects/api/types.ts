// src/features/projects/api/types.ts
//revize 13.10.2025
import type { AddressDto, PageResponse, UUID } from '@/types';

export type ProjectFilters = { status?: string };
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
  nameLocalized?: string;
  status: ProjectStatus;
  statusLabel?: string;
  createdAt?: string;
  archivedAt?: string;
  customerId: UUID;
  customerName?: string;
  projectManagerId?: UUID;
  projectManagerName?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
};

export type ProjectDto = {
  id: UUID;
  code: string;
  name: string;
  nameLocalized?: string;
  description?: string;
  descriptionLocalized?: string;
  status: ProjectStatus;
  statusLabel?: string;
  customerId: UUID;
  customerName?: string;
  projectManagerId?: UUID;
  projectManagerName?: string;
  plannedStartDate?: string; // ISO YYYY-MM-DD
  plannedEndDate?: string;   // ISO
  actualStartDate?: string;  // ISO
  actualEndDate?: string;    // ISO
  createdAt?: string;
  archivedAt?: string;
  currency?: string;
  vatMode?: string;
  siteAddress?: AddressDto;
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
  siteAddress?: AddressDto;
};

export type UpdateProjectRequest = Partial<CreateProjectRequest>;

export type ProjectMemberRequest = {
  userId: UUID;
  role: ProjectRoleName;
};

// Listing odpověď — reexport centrálního tvaru
export type ProjectsPage = PageResponse<ProjectSummaryDto>;
