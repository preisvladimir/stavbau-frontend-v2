import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge"; // doporučuju doplnit i tento balíček

/**
 * Spojuje třídy pomocí clsx + tailwind-merge.
 * Používej ve všech UI komponentách.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
