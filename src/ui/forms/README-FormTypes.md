# Global Form Types (Single Source of Truth)

This mini-typing kit unifies props for all React Hook Form (RHF) forms across modules (Team, Projects, Customers, …).
Goals: **consistency**, **scalability**, **easy extensibility** without duplication.

---

## Exports

Create the file:
`src/components/ui/stavbau-ui/forms/types.ts`

```ts
export type FormMode = 'create' | 'edit';

/**
 * Base, reusable, extensible props for RHF forms.
 * TValues = form values shape (e.g., AnyTeamFormValues)
 */
export interface BaseFormProps<TValues, TMode extends FormMode = FormMode> {
  mode: TMode;
  i18nNamespaces?: string[];
  defaultValues?: Partial<TValues>;
  submitting?: boolean;
  onSubmit: (values: TValues) => Promise<void> | void;
  onCancel: () => void;
  /**
   * Reset after successful submit.
   * Default: true in create, false in edit (handled by the component).
   */
  resetAfterSubmit?: boolean;
  /** Optional server error banner (handled by parent / CrudDrawer) */
  serverError?: string | null;
  /** Notify parent about the dirty state (disable close, etc.) */
  onDirtyChange?: (dirty: boolean) => void;
  /** Autofocus first field (or first invalid) – default true */
  autoFocus?: boolean;
  /** Extra class for the root <form> */
  className?: string;
}

/** Lock `mode` to a specific value (handy for create-only / edit-only components). */
export type BaseFormPropsFor<TMode extends FormMode, TValues> =
  Omit<BaseFormProps<TValues, TMode>, 'mode'> & { mode: TMode };

/** Extend base props with module-specific additions. */
export type ExtendFormProps<
  TValues,
  TMode extends FormMode = FormMode,
  TExtra extends Record<string, unknown> = {}
> = BaseFormProps<TValues, TMode> & TExtra;
```

---

## Usage Examples

### 1) Module form (Team)

```ts
import type { ExtendFormProps } from '@/components/ui/stavbau-ui/forms/types';
import type { AnyTeamFormValues } from '../validation/schemas';

type TeamSpecificProps = {
  lockCompanyRole?: boolean;
  lockReasonKey?: string;
  emailEditableInEdit?: boolean;
};

export type TeamFormProps =
  ExtendFormProps<AnyTeamFormValues, 'create' | 'edit', TeamSpecificProps>;
```

### 2) Create-only component

```ts
import type { BaseFormPropsFor } from '@/components/ui/stavbau-ui/forms/types';
type QuickCreateCustomerProps =
  BaseFormPropsFor<'create', CustomerFormValues>;
```

### 3) Edit-only with extra props

```ts
import type { ExtendFormProps } from '@/components/ui/stavbau-ui/forms/types';
type ProjectEditExtra = { canChangeCustomer?: boolean };
export type ProjectEditFormProps =
  ExtendFormProps<AnyProjectFormValues, 'edit', ProjectEditExtra>;
```

### 4) Context props (e.g., companyId)

```ts
type ProjectSpecificProps = { companyId?: UUID };
export type ProjectFormProps =
  ExtendFormProps<AnyProjectFormValues, 'create' | 'edit', ProjectSpecificProps>;
```

---

## Recommended Component Behavior

Inside your form component you typically keep:

```ts
// Reset after submit
const shouldReset = resetAfterSubmit ?? (mode === 'create');
if (shouldReset) reset(defaultValues, { keepDirty: false });

// Server error (non-blocking banner; optionally map to a specific field)
// useEffect(() => {
//   if (serverError) setError('email', { type: 'server', message: serverError });
// }, [serverError]);

// Dirty bubbling
useEffect(() => onDirtyChange?.(isDirty), [isDirty, onDirtyChange]);

// Auto-focus
// - focus first invalid if errors exist
// - otherwise in 'create' focus first meaningful field
```

---

## Best Practices

- **Form is a dumb presentational component**: Zod + RHF validation, rendering and controlled props from parent.
  No fetching and no mappers inside the Form – mapping is handled in the **orchestrator (Page/CrudDrawer)**.
- **Form value types** are imported from `validation/schemas` (not from components).
- Prefer a **server error banner** for quick feedback; mapping to specific fields is optional.
- Do **not** place domain-specific props in the base types; add them through `ExtendFormProps<…, Extra>` per module.

---

## Migration Checklist

1. Create `forms/types.ts` (above).
2. Replace local `FormProps` in modules with `ExtendFormProps<…>` + add module `Extra` props.
3. Remove redundant/duplicated prop definitions from components.
4. Verify `onDirtyChange`, `serverError`, and `resetAfterSubmit` behavior matches the previous UX.
5. In `CrudDrawer`/Page layers, rely only on the shared base props plus module `Extra` props.

---

## Quick Imports

```ts
// Team
import type { TeamFormProps } from '../components/Form';

// Projects
import type { ProjectFormProps } from '../components/Form';

// Customers
import type { CustomerFormProps } from '../components/Form';
```

Happy forms! 🎯
