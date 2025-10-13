// src/features/customers/mappers.ts
import type { CustomerDto } from '../api/types';
import type { CustomerFormValues } from '../validation/schemas';

// normalize helper
import { nn } from '@/lib/utils';


/** DTO → Form defaults (pro edit) */
export function dtoToFormDefaults(dto: Partial<CustomerDto>): Partial<CustomerFormValues> {
  return {
    type: (dto.type as any) ?? 'ORGANIZATION',
    name: dto.name ?? '',
    ico: nn(dto.ico),
    dic: nn(dto.dic),
    email: nn((dto as any).email),
    phone: nn((dto as any).phone),
    billingAddress: nn(dto.billingAddress),
    defaultPaymentTermsDays: nn((dto as any).defaultPaymentTermsDays),
    notes: nn((dto as any).notes),
  };
}

/** Form → Create body (připrav k přesnému API tvaru, pokud se liší) */
export function formToCreateBody(v: CustomerFormValues) {
  // Pokud máš konkrétní CreateCustomerRequest, typuj návratovou hodnotu na něj.
  return {
    type: v.type,
    name: v.name.trim(),
    ico: nn(v.ico),
    dic: nn(v.dic),
    email: nn(v.email),
    phone: nn(v.phone),
    billingAddress: nn(v.billingAddress),
    defaultPaymentTermsDays: nn(v.defaultPaymentTermsDays),
    notes: nn(v.notes),
  };
}

/** Form → Update body */
export function formToUpdateBody(v: CustomerFormValues) {
  return {
    type: v.type,
    name: v.name.trim(),
    ico: nn(v.ico),
    dic: nn(v.dic),
    email: nn(v.email),
    phone: nn(v.phone),
    billingAddress: nn(v.billingAddress),
    defaultPaymentTermsDays: nn(v.defaultPaymentTermsDays),
    notes: nn(v.notes),
  };
}
