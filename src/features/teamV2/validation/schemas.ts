import { z } from "zod";
import { ZIP_CZ_REGEX, ISO2_REGEX } from "@/lib/utils/patterns";

/** --- Shared primitives (adresy, atd.) --- */
export const addressSchema = z.object({
  street: z.string().min(1, { message: "validation.street.required" }),
  city: z.string().min(1, { message: "validation.city.required" }),
  zip: z.string().regex(ZIP_CZ_REGEX, { message: "validation.zip.invalid" }),
  country: z.string().regex(ISO2_REGEX, { message: "validation.country.invalid" }),
});


type CreateVals = z.infer<typeof CreateMemberSchema>;
type UpdateVals = z.infer<typeof UpdateMemberSchema>;

/** --- Základ člen/uživatel – společné pro create i update --- */
const MemberBase = z.object({
  firstName: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  lastName: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  email: z.string().email({ message: "validation.email.invalid" }),
  role: z.string().nullable().optional(),
  companyRole: z.string().nullable().optional(),
  sendInvite: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

/** Superset pro RHF – sjednocuje rozdíly mezi create/update (heslo a terms jsou volitelné) */
export type AnyTeamFormValues =
  Omit<CreateVals, 'password' | 'termsAccepted'> & {
    password?: string;
    termsAccepted?: boolean;
  };

/** --- Create: password + terms povinné (pokud BE vyžaduje) --- */
export const CreateMemberSchema = MemberBase.extend({
  password: z.string().min(8, { message: "validation.password.min8" }),
  termsAccepted: z
    .boolean()
    .refine((v) => v === true, { message: "validation.terms.accept" }),
});

/** --- Update: password volitelné, terms se v editu neřeší --- */
export const UpdateMemberSchema = MemberBase.extend({
  password: z
    .string()
    .min(8, { message: "validation.password.min8" })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  termsAccepted: z.boolean().optional(),
});

/** Back-compat alias (kdo importuje MemberSchema) */
export const MemberSchema = CreateMemberSchema;

/** Typ pro TeamForm – výchozí je create varianta */
export type TeamFormValues = z.infer<typeof CreateMemberSchema>;
