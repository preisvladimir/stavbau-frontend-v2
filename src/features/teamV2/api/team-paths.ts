// team-paths.ts
// revize 13.10.2025
import type { UUID } from '@/types';
type IdLike = UUID | string;

const seg = (label: string, v: IdLike) => {
  const s = String(v ?? '').trim();
  if (!s) throw new Error(`Missing required path segment: ${label}`);
  return encodeURIComponent(s);
};

// /company/{companyId}/members
export const membersBase = (companyId: IdLike) =>
  `/company/${seg('companyId', companyId)}/members` as const;

// GET list (paged), POST create
export const membersListUrl = membersBase; // alias

// GET lookup (paged value/label)
export const membersLookupUrl = (companyId: IdLike) =>
  `${membersBase(companyId)}/lookup` as const;

// /company/{companyId}/members/{id}
export const memberUrl = (companyId: IdLike, id: IdLike) =>
  `${membersBase(companyId)}/${seg('memberId', id)}` as const;

// PATCH profile
export const memberProfileUrl = (companyId: IdLike, id: IdLike) =>
  `${memberUrl(companyId, id)}/profile` as const;

// PATCH role
export const memberRoleUrl = (companyId: IdLike, id: IdLike) =>
  `${memberUrl(companyId, id)}/role` as const;

// POST archive / unarchive
export const memberArchiveUrl = (companyId: IdLike, id: IdLike) =>
  `${memberUrl(companyId, id)}/archive` as const;

export const memberUnarchiveUrl = (companyId: IdLike, id: IdLike) =>
  `${memberUrl(companyId, id)}/unarchive` as const;

// GET stats
export const membersStatsUrl = (companyId: IdLike) =>
  `${membersBase(companyId)}/stats` as const;
