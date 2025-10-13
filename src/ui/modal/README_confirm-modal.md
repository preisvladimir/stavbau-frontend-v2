# ConfirmModal – potvrzovací modal (Stavbau UI)

Jednotná a rozšiřitelná komponenta pro potvrzovací dialogy. Slouží jako **jediný zdroj pravdy** pro potvrzování akcí (mazání, archivace, obnovení apod.) napříč FE.

> Soubor komponenty: `src/components/ui/stavbau-ui/modal/confirm-modal.tsx`

---

## ✨ Vlastnosti

- **Bezpečné zavírání**: podpora `disableOutsideClose` (klik mimo) a `disableEscapeClose` (klávesa Esc).
- **Stav během akce**: `confirming` (spinner/disable), volitelně `confirmDisabled`.
- **Řízení životního cyklu**: `closeOnConfirm` (zavřít po potvrzení – sync/async).
- **A11y-ready**: `role="alertdialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`, `aria-busy`.
- **Modularita**: `footerLeftSlot` pro doplňkové prvky (linky, checkbox „Rozumím“ apod.).
- **Mobile-safe**: padding se `safe-area-inset-bottom`.
- **Čisté API**: jeden komponent – konzistentní UX napříč app.

---

## 🔌 Import

```tsx
import { ConfirmModal } from "@/components/ui/stavbau-ui/modal/confirm-modal";
```

---

## 🧩 API (Props)

| Prop | Typ | Default | Popis |
|---|---|---:|---|
| `open` | `boolean` | `-` | Zobrazení modalu. |
| `title` | `string` | `"Jste si jisti?"` | Nadpis dialogu. |
| `description` | `string` | `undefined` | Popis akce (volitelné). |
| `confirming` | `boolean` | `undefined` | Indikuje běžící potvrzovací akci (blokuje ovládání, ukáže spinner). |
| `confirmLabel` | `string` | `"Potvrdit"` | Text potvrzovacího tlačítka. |
| `cancelLabel` | `string` | `"Zrušit"` | Text storno tlačítka. |
| `danger` | `boolean` | `true` | Styl potvrzovacího tlačítka (destruktivní akce). |
| `disableOutsideClose` | `boolean` | `false` | Zakáže zavření klikem na pozadí. |
| `disableEscapeClose` | `boolean` | `false` | Zakáže zavření klávesou Esc. |
| `confirmDisabled` | `boolean` | `false` | Zakáže potvrzení (nezávisle na `confirming`). |
| `closeOnConfirm` | `boolean` | `true` | Zavřít modal po `onConfirm()` (sync/async). Nastav `false`, pokud chceš zavírat z rodiče po úspěchu. |
| `onConfirm` | `() => void \| Promise<void>` | `-` | Callback pro potvrzení. Může být sync i async. |
| `onCancel` | `() => void` | `-` | Zavření modalu. |
| `className` | `string` | `undefined` | Dodatečné třídy pro kontejner. |
| `footerLeftSlot` | `ReactNode` | `undefined` | Vlastní obsah vlevo v patičce (např. odkaz, checkbox). |

---

## ✅ Základní použití

```tsx
const [open, setOpen] = useState(false);

<>
  <button onClick={() => setOpen(true)}>Smazat</button>

  <ConfirmModal
    open={open}
    title="Smazat projekt?"
    description="Tato akce je nevratná."
    confirmLabel="Smazat"
    cancelLabel="Zrušit"
    danger
    onConfirm={() => {
      // zde proveď akci (sync)
      setOpen(false);
    }}
    onCancel={() => setOpen(false)}
  />
</>
```

---

## ⏳ Asynchronní akce s blokací (doporučeno)

```tsx
const [open, setOpen] = useState(false);
const [busy, setBusy] = useState(false);

<ConfirmModal
  open={open}
  title="Archivovat projekt?"
  description="Projekt zmizí z hlavního výpisu."
  confirmLabel="Archivovat"
  disableOutsideClose={busy}
  disableEscapeClose={busy}
  confirming={busy}
  closeOnConfirm={false} // zavřeme až po úspěchu
  onConfirm={async () => {
    try {
      setBusy(true);
      await api.archiveProject(id);
      toast.show({ variant: "success", title: "Archivováno", description: name });
      setOpen(false);          // zavře až po úspěchu
      onMutated?.();           // volitelně: refresh seznamu
    } catch (e) {
      const p = toApiProblem(e);
      toast.show({ variant: "error", title: "Nelze archivovat", description: p.detail ?? "Zkuste znovu." });
    } finally {
      setBusy(false);
    }
  }}
  onCancel={() => setOpen(false)}
/>
```

---

## 🧷 Potvrzení s checkboxem (musí být zaškrtnuto)

```tsx
const [checked, setChecked] = useState(false);

<ConfirmModal
  open={open}
  title="Trvale smazat?"
  description="Záznam nebude možné obnovit."
  danger
  confirmLabel="Rozumím, smazat"
  confirmDisabled={!checked}
  footerLeftSlot={(
    <label className="flex items-center gap-2 text-xs">
      <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      Chápu následky
    </label>
  )}
  onConfirm={onDelete}
  onCancel={() => setOpen(false)}
/>
```

---

## 🔒 Politiky zavírání

- Klik na pozadí → zavře **jen pokud** `disableOutsideClose === false` a `confirming !== true`.
- Esc → zavře **jen pokud** `disableEscapeClose === false` a `confirming !== true`.
- Po `onConfirm()` → pokud `closeOnConfirm === true`:
  - sync akce: zavře ihned;
  - async akce: zavře po `await onConfirm()` (chyby necháváme na rodiči).

Doporučení: u destruktivních/časově náročných operací nastav `closeOnConfirm={false}` a zavři modal až po úspěchu v rodiči.

---

## ♿ Přístupnost (A11y)

- `role="alertdialog"`, `aria-modal="true"`: čtečky obrazovky rozpoznají kritický dialog.
- `aria-labelledby` & `aria-describedby`: propojeno s nadpisem/popisem.
- `aria-busy` při `confirming`: signalizuje načítání.
- Fokus je **zachycen uvnitř** (trap focus), tělo má **lock scroll**.

---

## 🧪 Testování

K dispozici datové selektory:
- `data-testid="confirm-modal"` – wrapper dialogu
- `data-testid="confirm-modal-backdrop"` – backdrop
- `data-testid="confirm-modal-confirm"` – confirm button
- `data-testid="confirm-modal-cancel"` – cancel button

Příklad (RTL):
```ts
fireEvent.click(screen.getByTestId("confirm-modal-confirm"));
expect(onConfirm).toHaveBeenCalled();
```

---

## 🎨 Theming a styly

- Komponenta využívá Tailwind a design tokeny Stavbau (světlo/tma).
- Barvy tlačítek řídí `variant` v `<Button>` (`danger`/`primary`/`ghost`).

---

## 🌱 Rozšíření (doporučené směry)

- **I18n**: Prop `title`/`description`/labely jsou čisté stringy – propojit s i18n vrstvou dle kontextu.
- **Ikona v titulku**: Přidat `titleIcon?: ReactNode` (snadno rozšiřitelné bez breaking changes).
- **Hotkeys**: Volitelná klávesová zkratka pro „Potvrdit“ (např. `Ctrl+Enter`).

---

## ⚙️ Integrace s orchestrací (příklad)

```tsx
<ConfirmModal
  open={state.confirmOpen}
  title={t('delete.title')}
  description={t('delete.desc')}
  danger
  confirming={state.busy}
  disableOutsideClose={state.busy}
  disableEscapeClose={state.busy}
  closeOnConfirm={false}
  onConfirm={actions.deleteSelected}   // akce z orchestrátoru
  onCancel={actions.closeConfirm}
/>
```

---

## Changelog (zkráceně)

- **v2**: přidány `disableOutsideClose`, `disableEscapeClose`, `confirmDisabled`, `closeOnConfirm`, `footerLeftSlot`; vylepšené A11y a řízení async confirm.
- **v1**: základní verze bez řízení ESC/kliků a bez slotu.

---

## Licence

Součást interní Stavbau UI knihovny.
