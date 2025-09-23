import * as React from "react";
import { cn } from "@/lib/utils/cn";
import {
  MenuSelect,
  MenuSelectTrigger,
  MenuSelectContent,
  MenuSelectItem,
} from "@/components/ui/stavbau-ui/menu-select";
import { type TableDensity} from './datatable-v2-core';
import { Rows2, Rows3, StretchVertical } from "@/components/icons";

export type DensitySelectProps = {
  value: TableDensity;
  onChange: (v: TableDensity) => void;
  /** i18n texty */
  label?: React.ReactNode;                  // např. t('datatable.density')
  optionCompact?: React.ReactNode;          // t('datatable.density_compact')
  optionCozy?: React.ReactNode;             // t('datatable.density_cozy')
  optionComfortable?: React.ReactNode;      // t('datatable.density_comfortable')
  className?: string;
  /** vypnout/ zapnout ikony */
  withIcons?: boolean;
  /** extra třídy na trigger */
  triggerClassName?: string;
};

export function DensitySelect({
  value,
  onChange,
  label = "Hustota",
  optionCompact = "Kompaktní",
  optionCozy = "Střední",
  optionComfortable = "Vzdušná",
  className,
  withIcons = true,
  triggerClassName,
}: DensitySelectProps) {
  const Icon = {
    compact: Rows2,
    cozy: Rows3,
    comfortable: StretchVertical,
  }[value];

  const labelId = React.useId();

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span id={labelId} className="text-xs text-foreground/70">
        {label}
      </span>

      <MenuSelect value={value} onChange={(v) => onChange(v as TableDensity)} labelledBy={labelId}>
        <MenuSelectTrigger
          className={cn(
            "h-9 min-w-[10rem] px-3 rounded-lg border border-[rgb(var(--sb-border))] bg-background",
            "text-sm focus-visible:ring-2 focus-visible:ring-[rgb(var(--sb-primary))] focus-visible:ring-offset-1",
            triggerClassName
          )}
          aria-label={typeof label === "string" ? label : undefined}
        >
          <div className="inline-flex items-center gap-2">
            {withIcons && <Icon className="h-4 w-4" aria-hidden />}
            <span className="truncate">
              {value === "compact"
                ? optionCompact
                : value === "cozy"
                ? optionCozy
                : optionComfortable}
            </span>
          </div>
        </MenuSelectTrigger>

        <MenuSelectContent className="min-w-[12rem]">
          <MenuSelectItem value="compact" startIcon={withIcons ? <Rows2 className="h-4 w-4" aria-hidden /> : undefined}>
            {optionCompact}
          </MenuSelectItem>
          <MenuSelectItem value="cozy" startIcon={withIcons ? <Rows3 className="h-4 w-4" aria-hidden /> : undefined}>
            {optionCozy}
          </MenuSelectItem>
          <MenuSelectItem
            value="comfortable"
            startIcon={withIcons ? <StretchVertical className="h-4 w-4" aria-hidden /> : undefined}
          >
            {optionComfortable}
          </MenuSelectItem>
        </MenuSelectContent>
      </MenuSelect>
    </div>
  );
}
