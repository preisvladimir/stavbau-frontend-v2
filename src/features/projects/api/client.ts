// src/features/projects/api/client.ts
import { api } from '@/lib/api/client'; // sdílená Axios instance (baseURL, interceptors)
import i18n from "@/i18n";
import type {
  ProjectsPage,
  ProjectSummaryDto,
  ProjectDto,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectMemberRequest,
  UUID,
} from "./types";

const base = "/api/v1/projects";

type ListParams = {
  q?: string;
  page?: number;
  size?: number;
  sort?: string; // např. "code,asc"
};

function langHeader() {
  return { "Accept-Language": i18n.language };
}

export async function listProjects(params: ListParams = {}): Promise<ProjectsPage> {
  const { data } = await api.get(`${base}`, {
    params,
    headers: langHeader(),
  });
  // data: Spring Page => necháme adaptér až ve step 3 (mappers)
  // Zde prozatím vracíme surový payload, mapper to sjednotí na PageResponse.
  return data;
}

export async function getProject(id: UUID): Promise<ProjectDto> {
  const { data } = await api.get(`${base}/${id}`, {
    headers: langHeader(),
  });
  return data;
}

export async function createProject(body: CreateProjectRequest): Promise<ProjectDto> {
  const { data } = await api.post(base, body, {
    headers: langHeader(),
  });
  return data;
}

export async function updateProject(id: UUID, body: UpdateProjectRequest): Promise<ProjectDto> {
  const { data } = await api.patch(`${base}/${id}`, body, {
    headers: langHeader(),
  });
  return data;
}

export async function deleteProject(id: UUID): Promise<void> {
  await api.delete(`${base}/${id}`, {
    headers: langHeader(),
  });
}

export async function archiveProject(id: UUID): Promise<void> {
  await api.post(`${base}/${id}/archive`, null, {
    headers: langHeader(),
  });
}

// --- stubs: členové projektu (MVP Accepted/204) ---
export async function addProjectMember(id: UUID, body: ProjectMemberRequest): Promise<void> {
  await api.post(`${base}/${id}/members`, body, {
    headers: langHeader(),
  });
}

export async function removeProjectMember(id: UUID, userId: UUID): Promise<void> {
  await api.delete(`${base}/${id}/members/${userId}`, {
    headers: langHeader(),
  });
}
