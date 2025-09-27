// src/features/customers/components/CustomerFormDrawer.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CustomerForm, type CustomerFormValues } from "./CustomerForm";
import { createCustomer, getCustomer, updateCustomer } from '../services/customer.service';
import type { CustomerDto } from "@/lib/api/types";
import { Loading } from "@/components/ui/stavbau-ui/loading";
import { ErrorState } from "@/components/ui/stavbau-ui/errorstate";
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import { RBAC_AREAS } from '@/lib/rbac/areas';

export const CustomerFormDrawer: React.FC<{
    id?: string; // pokud je, jde o edit
    onClose: () => void;
}> = ({ id, onClose }) => {
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = React.useState<boolean>(!!isEdit);
    const [error, setError] = React.useState<{ title?: string; detail?: string }>();
    const [data, setData] = React.useState<CustomerDto | undefined>();
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (!isEdit) return;
        let ignore = false;
        setLoading(true);
        getCustomer(id!)
            .then((d) => !ignore && (setData(d), setLoading(false)))
            .catch((e) => {
                const detail = e?.response?.data?.detail ?? e.message;
                const title = e?.response?.data?.title ?? "Error";
                !ignore && (setError({ title, detail }), setLoading(false));
            });
        return () => { ignore = true; };
    }, [id, isEdit]);

    // ---- mapování CustomerDto -> CustomerFormValues (null -> undefined) ----
    const toFormDefaults = React.useCallback(
        (d?: CustomerDto): Partial<CustomerFormValues> | undefined => {
            if (!d) return undefined;
            return {
                name: d.name ?? "",
                ico: d.ico ?? undefined,
                dic: d.dic ?? undefined,
                email: d.email ?? undefined,
                phone: d.phone ?? undefined,
                addressLine1: d.addressLine1 ?? undefined,
                addressLine2: d.addressLine2 ?? undefined,
                city: d.city ?? undefined,
                zip: d.zip ?? undefined,
                country: d.country ?? undefined,
                notes: d.notes ?? undefined,
            };
        },
        []
    );


    const onSubmit = async (values: CustomerFormValues) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                await updateCustomer(id!, values);
            } else {
                const created = await createCustomer(values);
                navigate(`/app/customers/${created.id}`, { replace: true });
            }
            onClose();
        } catch (e: any) {
            const detail = e?.response?.data?.detail ?? e.message;
            const title = e?.response?.data?.title ?? "Error";
            setError({ title, detail });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <aside className="relative z-10 h-full w-full max-w-xl bg-white dark:bg-neutral-900 shadow-xl p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{isEdit ? "Upravit zákazníka" : "Nový zákazník"}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
                </div>
                {error && <ErrorState title={error.title} description={error.detail} />}
                {loading ? (
                    <Loading />
                ) : (
                    <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.WRITE, RBAC_AREAS.CUSTOMERS.UPDATE, RBAC_AREAS.CUSTOMERS.CREATE]}>
                        <CustomerForm
                            defaultValues={toFormDefaults(data)}
                            onSubmit={onSubmit}
                            submitting={submitting}
                        />
                    </ScopeGuard>
                )}
            </aside>
        </div>
    );
};
