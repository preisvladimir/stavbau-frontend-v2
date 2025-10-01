// src/features/customers/components/CustomerFormDrawer.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CustomerForm, type CustomerFormValues } from "./CustomerForm";
import { createCustomer, getCustomer, updateCustomer } from '../api/client';
import type { CustomerDto }  from "../api/types";
import { Loading } from "@/components/ui/stavbau-ui/loading";
import { ErrorState } from "@/components/ui/stavbau-ui/errorstate";
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import { RBAC_AREAS } from '@/lib/rbac/areas';
import { dtoToFormDefaults, formToCreateBody, formToUpdateBody } from "../mappers";
import { FormDrawer } from "@/components/ui/stavbau-ui/drawer/form-drawer";

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


    const onSubmit = async (values: CustomerFormValues) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                await updateCustomer(id!, formToUpdateBody(values));
            } else {
                const created = await createCustomer(formToCreateBody(values));
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
   <>
     {error && <ErrorState title={error.title} description={error.detail} />}
     {loading ? (
       <Loading />
     ) : (
       <ScopeGuard anyOf={[isEdit ? RBAC_AREAS.CUSTOMERS.UPDATE : RBAC_AREAS.CUSTOMERS.CREATE]}>
         <FormDrawer
           open
           onClose={onClose}
           mode={isEdit ? "edit" : "create"}
           title={isEdit ? "Upravit zákazníka" : "Nový zákazník"}
           showFooter={false}
           form={
             <CustomerForm
               defaultValues={dtoToFormDefaults(data)}
               onSubmit={onSubmit}
               submitting={submitting}
             />
           }
         />
       </ScopeGuard>
     )}
   </>
 );
 }
