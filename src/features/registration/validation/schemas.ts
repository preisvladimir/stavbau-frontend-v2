import { z } from "zod";

// Regexy dle zadání
export const ICO_REGEX = /^\d{8}$/;
export const ZIP_CZ_REGEX = /^\d{3}\s?\d{2}$/;     // 12345 nebo 123 45
export const ISO2_REGEX = /^[A-Z]{2}$/;

export const step1IcoSchema = z.object({
  ico: z.string().regex(ICO_REGEX, { message: "validation.ico.invalid" }),
});
export type Step1Ico = z.infer<typeof step1IcoSchema>;

export const addressSchema = z.object({
  street: z.string().min(1, { message: "validation.city.required" }),
  city: z.string().min(1, { message: "validation.city.required" }),
  zip: z.string().regex(ZIP_CZ_REGEX, { message: "validation.zip.invalid" }),
  country: z.string().regex(ISO2_REGEX, { message: "validation.country.invalid" }),
});

export const step2CompanySchema = z.object({
  name: z.string().min(2, { message: "validation.name.min2" }),
  dic: z.string().trim().min(2, { message: "validation.dic.min2" }).optional().or(z.literal("").transform(() => undefined)),
  legalFormCode: z.string().trim().min(1, { message: "validation.legalFormCode.min1" }).optional().or(z.literal("").transform(() => undefined)),
  legalFormName: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  address: addressSchema,
});
export type Step2Company = z.infer<typeof step2CompanySchema>;

export const step3OwnerSchema = z.object({
  firstName: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  lastName: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  email: z.string().email({ message: "validation.email.invalid" }),
  password: z.string().min(8, { message: "validation.password.min8" }),
  termsAccepted: z
    .boolean()
    .refine((v) => v === true, { message: "validation.terms.accept" }),
  marketing: z.boolean().optional(),
});
export type Step3Owner = z.infer<typeof step3OwnerSchema>;
