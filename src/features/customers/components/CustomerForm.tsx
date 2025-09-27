// src/features/customers/components/CustomerForm.tsx
import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { isValidICO, isValidCZDic } from "@/lib/utils/patterns";
import { cn } from "@/lib/utils/cn";
import { AddressAutocomplete } from "@/components/ui/stavbau-ui/addressautocomplete";
import type { AddressDto } from "@/types/common/address";
import type { AddressSuggestion } from "@/lib/api/geo";

const schema = z.object({
  type: z.enum(["ORGANIZATION", "PERSON"], { message: "Zvolte typ" }),
  name: z.string().min(1, "Zadejte název").max(160),
  ico: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || isValidICO(v), "Neplatné IČO"),
  dic: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || isValidCZDic(v), "Neplatné DIČ (očekává se CZ…)"),
  email: z
    .string()
    .email("Neplatný e-mail")
    .optional()
    .or(z.literal("").transform(() => undefined)),
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
      source: z.enum(["USER", "ARES", "GEO", "IMPORT"]).optional(),
    })
    .partial()
    .optional(),
  defaultPaymentTermsDays: z.coerce.number().int().min(0).max(365).optional(),
  notes: z.string().max(1000).optional(),
});

export type CustomerFormValues = z.infer<typeof schema>;

export const CustomerForm: React.FC<{
  defaultValues?: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => Promise<void> | void;
  submitting?: boolean;
  className?: string;
}> = ({ defaultValues, onSubmit, submitting, className }) => {
  const { t } = useTranslation("customers");
  const resolver = zodResolver(schema) as unknown as Resolver<CustomerFormValues>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver,
    defaultValues: {
      type: "ORGANIZATION",
      name: "",
      ...defaultValues,
    },
    mode: "onBlur",
  });

  // Handler pro výběr z GEO autocomplete → plní typed AddressDto
  const onAddressPick = (addr: AddressSuggestion) => {
    // geo typ dovoluje null → převést na undefined kvůli AddressDto
    const nn = <T,>(v: T | null | undefined) => (v ?? undefined);
    const dto: AddressDto = {
      formatted: nn(addr.formatted),
      street: nn(addr.street),
      houseNumber: nn(addr.houseNumber),
      orientationNumber: nn(addr.houseNumber),
      city: nn(addr.municipality),
      cityPart: nn(addr.municipalityPart),
      postalCode: nn(addr.zip),
      countryCode: nn(addr.countryIsoCode) ?? "CZ",
      latitude: nn(addr.lat),
      longitude: nn(addr.lon),
      source: "GEO",
    };
    setValue("billingAddress", dto, { shouldDirty: true, shouldValidate: false });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-3", className)}>
      <div>
        <label className="block text-sm font-medium">{t("form.name")}</label>
        <input className="input input-bordered w-full" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">{t("form.ico")}</label>
          <input className="input input-bordered w-full font-mono" {...register("ico")} />
          {errors.ico && <p className="mt-1 text-xs text-red-600">{errors.ico.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">{t("form.dic")}</label>
          <input className="input input-bordered w-full font-mono" {...register("dic")} />
          {errors.dic && <p className="mt-1 text-xs text-red-600">{errors.dic.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">{t("form.email")}</label>
          <input className="input input-bordered w-full" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">{t("form.phone")}</label>
          <input className="input input-bordered w-full" {...register("phone")} />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">{t("form.type") ?? "Typ"}</label>
          <select className="select select-bordered w-full" {...register("type")}>
            <option value="ORGANIZATION">{t("form.types.organization") ?? "Firma/organizace"}</option>
            <option value="PERSON">{t("form.types.person") ?? "Osoba"}</option>
          </select>
          {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">{t("form.defaultPaymentTermsDays") ?? "Splatnost (dny)"}</label>
          <input type="number" min={0} className="input input-bordered w-full" {...register("defaultPaymentTermsDays")} />
          {errors.defaultPaymentTermsDays && (
            <p className="mt-1 text-xs text-red-600">{errors.defaultPaymentTermsDays.message}</p>
          )}
        </div>
      </div>

      {/* GEO Autocomplete */}
      <div>
        <label className="block text-sm font-medium">{t("form.address")}</label>
        <AddressAutocomplete onSelect={onAddressPick} />

        {/* Manuální editace typed adresy (MVP) */}
        <input
          className="input input-bordered w-full mt-2"
          placeholder={t("form.addressFormatted") ?? "Adresa (formatted)"}
          {...register("billingAddress.formatted")}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          <input
            className="input input-bordered w-full"
            placeholder={t("form.street") ?? "Ulice"}
            {...register("billingAddress.street")}
          />
          <input
            className="input input-bordered w-full"
            placeholder={t("form.houseNumber") ?? "Číslo popisné"}
            {...register("billingAddress.houseNumber")}
          />
          <input
            className="input input-bordered w-full"
            placeholder={t("form.orientationNumber") ?? "Číslo orientační"}
            {...register("billingAddress.orientationNumber")}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          <input
            className="input input-bordered w-full"
            placeholder={t("form.city") ?? "Město"}
            {...register("billingAddress.city")}
          />
          <input
            className="input input-bordered w-full"
            placeholder={t("form.postalCode") ?? "PSČ"}
            {...register("billingAddress.postalCode")}
          />
          <input
            className="input input-bordered w-full"
            placeholder={t("form.countryCode") ?? "Země (ISO2)"}
            {...register("billingAddress.countryCode")}
          />
        </div>
        {/* Chyby – pokud někdy zpřísníme validaci, budou zde viditelné */}
        {errors.billingAddress?.formatted && (
          <p className="mt-1 text-xs text-red-600">{errors.billingAddress.formatted.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">{t("form.notes")}</label>
        <textarea className="textarea textarea-bordered w-full" rows={4} {...register("notes")} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {t("actions.save")}
        </button>
      </div>
    </form>
  );
};
