// src/components/ui/stavbau-ui/drawer/form-drawer.tsx
import * as React from "react";
import { StbDrawer, type StbDrawerProps } from "./drawer";
import { Button } from "@/components/ui/stavbau-ui/button";

type Mode = "create" | "edit";

type FormDrawerProps = Omit<StbDrawerProps, "open" | "onClose" | "children" | "footer"> & {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  onSaved?: () => void;
  form: React.ReactNode; // sem dáš <CustomerForm .../>
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimaryClick?: () => void; // volitelné – někdy submit trigger zvenčí
  onSecondaryClick?: () => void;
  showFooter?: boolean; // možnost skrýt akční bar a nechat tlačítka ve formuláři
  primaryLoading?: boolean;
  disablePrimary?: boolean;
};

export function FormDrawer({
  open,
  onClose,
  title,
  mode,
  form,
  onPrimaryClick,
  onSecondaryClick,
  primaryLabel,
  secondaryLabel = "Zrušit",
  showFooter = true,
  primaryLoading,
  disablePrimary,
  ...rest
}: FormDrawerProps) {
  return (
    <StbDrawer
      open={open}
      onClose={onClose}
      title={title ?? (mode === "create" ? "Nový záznam" : "Upravit záznam")}
      footer={
        !showFooter ? undefined :
          <>
            <Button variant="ghost" size="md" onClick={onSecondaryClick ?? onClose}>
              {secondaryLabel}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onPrimaryClick}
              isLoading={primaryLoading}
              disabled={disablePrimary}
            >
              {primaryLabel ?? "Uložit"}
            </Button>
          </>
      }
      {...rest}
    >
      {form}
    </StbDrawer>
  );
}
