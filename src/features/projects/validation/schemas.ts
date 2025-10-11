// src/features/projects/validation/schemas.ts
import { z } from 'zod';


/** Helper: "" -> undefined (pro optional pole) */
const emptyToUndef = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.any()
);

/** ISO YYYY-MM-DD (bez času) */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.date.format' });

/** Volitelné ISO datum s normalizací prázdné hodnoty */
const optionalIsoDate = emptyToUndef.pipe(isoDate).optional();

/** Adresa (typed) – stejný tvar jako u Customers.billingAddress */
const addressSource = z.enum(['USER', 'ARES', 'GEO', 'IMPORT']);
const siteAddressSchema = z.object({
  formatted: emptyToUndef.pipe(z.string()).optional(),
  street: emptyToUndef.pipe(z.string()).optional(),
  houseNumber: emptyToUndef.pipe(z.string()).optional(),
  orientationNumber: emptyToUndef.pipe(z.string()).optional(),
  city: emptyToUndef.pipe(z.string()).optional(),
  cityPart: emptyToUndef.pipe(z.string()).optional(),
  postalCode: emptyToUndef.pipe(z.string()).optional(),
  countryCode: emptyToUndef.pipe(z.string()).optional(), // případně zpřísníme na ISO2
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  source: addressSource.optional(),
}).partial().optional();


/** Shape, který MUSÍ mít klíče (typově povolíme libovolný Zod typ) */
type PlannedDatesShape = {
  plannedStartDate: z.ZodTypeAny;
  plannedEndDate: z.ZodTypeAny;
};

/** Cross-field validace: plannedEndDate >= plannedStartDate */
const withPlannedDatesGuard = <T extends z.ZodRawShape & PlannedDatesShape>(shape: T) =>
  z.object(shape).superRefine((v, ctx) => {
    // hodnoty z formu po resolveru – můžou být undefined
    const start = (v as any).plannedStartDate as string | undefined;
    const end = (v as any).plannedEndDate as string | undefined;
    if (!start || !end) return; // OK: aspoň jedno chybí
    if (new Date(end) < new Date(start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.date.range',
        path: ['plannedEndDate'],
      });
    }
  });

/** Společná pole (create/update) – bez default(undefined) */
const baseFields = {
  code: emptyToUndef.pipe(z.string().max(64)).optional(),
  name: z.string().min(1, { message: 'form.name.error' }).max(160),

  description: emptyToUndef.pipe(z.string().max(4000)).optional(),

  // create: required; update: volitelné
  customerId: emptyToUndef.pipe(z.string().uuid({ message: 'validation.uuid' })),
  projectManagerId: emptyToUndef.pipe(z.string().uuid({ message: 'validation.uuid' })).optional(),

  plannedStartDate: optionalIsoDate,
  plannedEndDate: optionalIsoDate,

  currency: emptyToUndef.pipe(z.string().max(16)).optional(),
  vatMode: emptyToUndef.pipe(z.string().max(32)).optional(),
  /** Adresa stavby – volitelná, posílá se jako typed objekt */
  siteAddress: siteAddressSchema,

} satisfies PlannedDatesShape & Record<string, z.ZodTypeAny>;

/** Typ formuláře (FE) – odpovídá Create/Update payloadu */
export type AnyProjectFormValues = {
  code?: string;
  name: string;
  description?: string;
  customerId: string;
  projectManagerId?: string;
  customerLabel?: string;
  projectManagerLabel?: string;
  plannedStartDate?: string; // ISO YYYY-MM-DD
  plannedEndDate?: string;   // ISO YYYY-MM-DD
  currency?: string;
  vatMode?: string;
  siteAddress?: {
    formatted?: string;
    street?: string;
    houseNumber?: string;
    orientationNumber?: string;
    city?: string;
    cityPart?: string;
    postalCode?: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
    source?: 'USER' | 'ARES' | 'GEO' | 'IMPORT';
  };
};

/** CREATE: name i customerId povinné */
export const CreateProjectSchema = withPlannedDatesGuard({
  ...baseFields,
  name: baseFields.name,          // explicitně required
  customerId: baseFields.customerId, // explicitně required
  siteAddress: baseFields.siteAddress, // volitelné i v create
});

/** UPDATE: všechna pole volitelná – "" -> undefined */
export const UpdateProjectSchema = withPlannedDatesGuard({
  code: baseFields.code,
  name: emptyToUndef.pipe(z.string().max(160)).optional(),
  description: baseFields.description,
  customerId: emptyToUndef.pipe(z.string().uuid({ message: 'validation.uuid' })).optional(),
  projectManagerId: baseFields.projectManagerId,

  plannedStartDate: baseFields.plannedStartDate,
  plannedEndDate: baseFields.plannedEndDate,
  currency: baseFields.currency,
  vatMode: baseFields.vatMode,
});

// Odvozené typy (pokud se hodí)
export type CreateProjectValues = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectValues = z.infer<typeof UpdateProjectSchema>;
