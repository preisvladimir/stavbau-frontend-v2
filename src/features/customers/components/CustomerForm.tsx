// src/features/customers/components/CustomerForm.tsx
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { isValidICO, isValidCZDic } from "@/lib/utils/patterns";
import { cn } from "@/lib/utils/cn";

const schema = z.object({
  name: z.string().min(1, "Zadejte název").max(160),
  ico: z.string().trim().optional().refine(isValidICO, "Neplatné IČO"),
  dic: z.string().trim().optional().refine(isValidCZDic, "Neplatné DIČ (očekává se CZ…)"),
  email: z.string().email("Neplatný e-mail").optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().max(40).optional(),
  addressLine1: z.string().max(160).optional(),
  addressLine2: z.string().max(160).optional(),
  city: z.string().max(80).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(80).optional(),
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
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      ...defaultValues,
    },
    mode: "onBlur",
  });

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
      <div>
        <label className="block text-sm font-medium">{t("form.address")}</label>
        <input className="input input-bordered w-full mb-2" placeholder={t("form.addressLine1")} {...register("addressLine1")} />
        <input className="input input-bordered w-full mb-2" placeholder={t("form.addressLine2")} {...register("addressLine2")} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input input-bordered w-full" placeholder={t("form.city")} {...register("city")} />
          <input className="input input-bordered w-full" placeholder={t("form.zip")} {...register("zip")} />
          <input className="input input-bordered w-full" placeholder={t("form.country")} {...register("country")} />
        </div>
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
