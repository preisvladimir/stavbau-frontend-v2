// src/features/customers/validation/schemas.ts
import { z } from 'zod';
import { isValidICO, isValidCZDic } from '@/lib/utils/patterns';

export const customerSchema = z.object({
  type: z.enum(['ORGANIZATION', 'PERSON'], { message: 'Zvolte typ' }),
  name: z.string().min(1, 'Zadejte název').max(160),
  ico: z.string().trim().optional().refine((v) => !v || isValidICO(v), 'Neplatné IČO'),
  dic: z.string().trim().optional().refine((v) => !v || isValidCZDic(v), 'Neplatné DIČ (očekává se CZ…)'),
  email: z
    .union([z.string().email('Neplatný e-mail'), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  phone: z.string().max(40).optional(),
  billingAddress: z
    .object({
      formatted: z.string().optional(),
      street: z.string().optional(),
      houseNumber: z.string().optional(),
      orientationNumber: z.string().optional(),
      city: z.string().optional(),
      cityPart: z.string().optional(),
      postalCode: z.string().optional(),
      countryCode: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      source: z.enum(['USER', 'ARES', 'GEO', 'IMPORT']).optional(),
    })
    .partial()
    .optional(),
  defaultPaymentTermsDays: z.coerce.number().int().min(0).max(365).optional(),
  notes: z.string().max(1000).optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
