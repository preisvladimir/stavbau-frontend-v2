// revize 13.10.2025
import { z } from "zod";
import { ZIP_CZ_REGEX, ISO2_REGEX } from "@/lib/utils/patterns";
import { ROLE_WHITELIST, type CompanyRoleName } from "@/rbac";

/** --- helpers --- */
const emptyToUndef = <T extends string | null | undefined>(v: T) => {
  if (v == null) return undefined;
  if (typeof v !== "string") return v ?? undefined as any;
  const s = v.trim();
  return s.length ? (s as any) : undefined;
};
const roleValidator = z
  .string()
  .nullable()
  .optional()
  .refine(
    (val) => val == null || ROLE_WHITELIST.includes(String(val)),
    { message: "validation.role.invalid" }
  );

/** --- Shared primitives (adresy, atd.) --- */
export const addressSchema = z.object({
  street: z.string().min(1, { message: "validation.street.required" }),
  city: z.string().min(1, { message: "validation.city.required" }),
  zip: z.string().regex(ZIP_CZ_REGEX, { message: "validation.zip.invalid" }),
  country: z.string().regex(ISO2_REGEX, { message: "validation.country.invalid" }),
});

/** --- Základ člen/uživatel – společné pro create i update --- */
const MemberBase = z.object({
  firstName: z.string().transform(emptyToUndef).optional(),
  lastName: z.string().transform(emptyToUndef).optional(),
  phone: z.string().transform(emptyToUndef).optional(),
  email: z.email({ message: "validation.email.invalid" }),
  // FE validace proti whitelistu; BE stejně rozhoduje, ale fail-fast UX je lepší
  role: roleValidator,         // alias/legacy
  companyRole: roleValidator,  // preferované pole
  sendInvite: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

/** --- Create: BE nevyžaduje password/terms --- */
export const CreateMemberSchema = MemberBase;

/** --- Update: password volitelné (pokud se někdy použije), terms se v editu neřeší --- */
export const UpdateMemberSchema = MemberBase.extend({
  password: z
    .string()
    .min(8, { message: "registration:validation.password.min8" })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  termsAccepted: z.boolean().optional(),
});

/** Back-compat alias (někde se importuje MemberSchema) */
export const MemberSchema = CreateMemberSchema;

/** Typy pro RHF / formuláře */
export type TeamFormValues = z.infer<typeof CreateMemberSchema>;
type CreateVals = z.infer<typeof CreateMemberSchema>;
//type UpdateVals = z.infer<typeof UpdateMemberSchema>;

/**
 * Superset pro RHF – sjednocuje rozdíly mezi create/update
 * (password a terms jsou volitelné, aby jednotný form fungoval v obou módech).
 */
export type AnyTeamFormValues =
  Omit<CreateVals, "password" | "termsAccepted"> & {
    password?: string;
    termsAccepted?: boolean;
  };

/**
 * Bonus (volitelné): kontextová verze schématu – umožní zamknout změnu role
 * pomocí zodResolver(schema, { context: { lockCompanyRole: true, currentCompanyRole: 'OWNER' } })
 */
export const getTeamSchema = (ctx?: { lockCompanyRole?: boolean; currentCompanyRole?: CompanyRoleName | null }) =>
  MemberBase.superRefine((vals, issue) => {
    if (!ctx?.lockCompanyRole) return;

    // Když je role zamčená (např. poslední OWNER), nedovolíme změnit na jinou
    const requested = (vals.companyRole ?? vals.role) as CompanyRoleName | null | undefined;
    const current = ctx.currentCompanyRole ?? null;
    if (current === "OWNER" && requested && requested !== "OWNER") {
      issue.addIssue({
        code: z.ZodIssueCode.custom,
        message: "errors.lastOwner",
        path: ["companyRole"],
      });
    }
  });

