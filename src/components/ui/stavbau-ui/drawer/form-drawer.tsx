// src/components/ui/stavbau-ui/drawer/form-drawer.tsx
import * as React from "react";
import { StbDrawer, type StbDrawerProps } from "./drawer";

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
            <button className="btn btn-ghost" onClick={onSecondaryClick ?? onClose}>{secondaryLabel}</button>
            <button className="btn btn-primary" onClick={onPrimaryClick}>{primaryLabel ?? "Uložit"}</button>
          </>
      }
      {...rest}
    >
      {form}
    </StbDrawer>
  );
}
