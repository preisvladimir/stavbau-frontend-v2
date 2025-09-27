// src/components/ui/stavbau-ui/drawer/detail-drawer.tsx
import * as React from "react";
import { StbDrawer, type StbDrawerProps } from "./drawer";

type DetailDrawerProps = Omit<StbDrawerProps, "open" | "onClose" | "children"> & {
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDeleted?: () => void;
  headerRight?: React.ReactNode; // extra tlačítka vpravo
  children: React.ReactNode;     // obsah detailu
};

export function DetailDrawer({
  open,
  onClose,
  title = "Detail",
  headerRight,
  children,
  ...rest
}: DetailDrawerProps) {
  return (
    <StbDrawer open={open} onClose={onClose} title={title} headerRight={headerRight} {...rest}>
      {children}
    </StbDrawer>
  );
}
