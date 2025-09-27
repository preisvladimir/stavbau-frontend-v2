// src/features/customers/components/CustomersTable.tsx
import React from 'react';
import { useTranslation } from "react-i18next";
import type { CustomerSummaryDto }  from "@/lib/api/types";
import { DataTableV2 } from "@/components/ui/stavbau-ui/datatable/datatable-v2";
import { Mail, Building2, IdCard } from "@/components/icons";


type Props = {
  data: CustomerSummaryDto[];
  isLoading?: boolean;
  onRowClick?: (id: string) => void;
};

export function CustomersTable({ data, isLoading, onRowClick }: Props) {
    const translationNamespaces = React.useMemo(() => ['customers', 'common'] as const, []);
    const { t } = useTranslation(translationNamespaces);

  // --- Columns for DataTableV2 (vzor TeamPageV2) ---
  const columns = React.useMemo(
    () => [
      {
        id: "avatar",
        header: "",
        accessor: (_c: CustomerSummaryDto) => "",
        cell: () => (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <Building2 size={16} />
          </div>
        ),
        enableSorting: false,
        meta: {
          stbMobile: {
            priority: 99,
            mobileHidden: true,
          },
        },
      },
      {
        id: "name",
        header: t("list.columns.name"),
        accessor: (c: CustomerSummaryDto) => c.name,
        cell: (c: CustomerSummaryDto) => (
          <span className="block xl:max-w-[240px] xl:truncate">{c.name || "—"}</span>
        ),
        sortable: true, // primární klientské řazení dle jména (MVP)
        meta: {
          stbMobile: {
            isTitle: true,
            priority: 0,
            label: t("list.columns.name"),
          },
        },
      },
      {
        id: "email",
        header: t("list.columns.email"),
        accessor: (c: CustomerSummaryDto) => c.email ?? "",
        cell: (c: CustomerSummaryDto) => (
          <span className="inline-flex items-center gap-1 xl:max-w-[320px] xl:truncate">
            <Mail size={14} />
            <span className="truncate">{c.email ?? "—"}</span>
          </span>
        ),
        meta: {
          stbMobile: {
            isSubtitle: true,
            priority: 1,
            label: t("list.columns.email"),
          },
        },
      },
      {
        id: "ico",
        header: t("list.columns.ico"),
        accessor: (c: CustomerSummaryDto) => c.ico ?? "",
        cell: (c: CustomerSummaryDto) => (
          <span className="font-mono text-sm">{c.ico ?? "—"}</span>
        ),
        meta: {
          stbMobile: {
            priority: 2,
            label: t("list.columns.ico"),
          },
        },
      },
      {
        id: "dic",
        header: t("list.columns.dic"),
        accessor: (c: CustomerSummaryDto) => c.dic ?? "",
        cell: (c: CustomerSummaryDto) => (
          <span className="inline-flex items-center gap-1 font-mono text-sm">
            <IdCard size={14} /> {c.dic ?? "—"}
          </span>
        ),
        meta: {
          stbMobile: {
            priority: 3,
            label: t("list.columns.dic"),
          },
        },
      },
      {
        id: "updatedAt",
        header: t("list.columns.updatedAt"),
        accessor: (c: CustomerSummaryDto) => c.updatedAt,
        cell: (c: CustomerSummaryDto) => (
          <span className="text-sm text-[rgb(var(--sb-muted))]">
            {new Date(c.updatedAt).toLocaleString()}
          </span>
        ),
        meta: {
          stbMobile: {
            priority: 4,
            label: t("list.columns.updatedAt"),
          },
        },
      },
    ],
    [t]
  );

  return (
        <DataTableV2<CustomerSummaryDto>
          i18nNamespaces={translationNamespaces as unknown as string[]}
          variant="surface"
          className="mt-2"
      columns={columns}
      data={data}
      keyField={(m) => m.id}
      loading={!!isLoading}
      onRowClick={(row) => onRowClick?.(row.id)}
    />
  );
}