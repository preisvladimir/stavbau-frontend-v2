# STAVBAU UI Guide – Drawer vs. Modal

Tento dokument stanovuje jednotná pravidla pro používání **Drawer** a **Modal** komponent v aplikaci STAVBAU.  
Cílem je sjednotit UX napříč moduly (Customers, Team, Invoices, …), zlepšit mobilní použitelnost a zajistit konzistenci v kódu i testech.

---

## 1. Rozhodovací strom

1. **Potřebuji zachovat kontext listu a deep-link?**  
   → Použij **Drawer** (detail, edit, create).
2. **Jedná se o destruktivní akci nebo krátké potvrzení?**  
   → Použij **Modal** (confirm delete, reset, logout).
3. **Formulář s více poli, preview, vícekroková akce?**  
   → **Drawer**.
4. **Rychlá single-input akce (např. rename)?**  
   → **Modal**.
5. **Komplexní wizard/onboarding?**  
   → **Samostatná stránka**.

---

## 2. Drawer

### Kdy použít
- Detail záznamu (např. Customer detail).
- Vytvoření/úprava záznamu.
- Inline procesy, kde je potřeba zachovat kontext listu.

### UX pravidla
- **Route-based**: Drawer se otevírá přes URL (`/app/customers/:id`, `/new`).
- **Nikdy více než jeden Drawer současně**.
- **Gestures**: swipe-to-close (mobil), `Esc` (desktop).
- **Safe area**: spodní akční bar s paddingem (`env(safe-area-inset-bottom)`).
- **Výška**:
    - Mobil: bottom-sheet (85 % výšky).
    - Desktop: pravý panel 420–560 px.
- **Obsah**: skeleton při načítání, žádná prázdná plocha.
- **A11y**: `role="dialog"`, `aria-modal="true"`, focus trap, návrat focusu.

### Technické konvence
- Komponenty:
    - `<DetailDrawer id onClose onEdit onDeleted />`
    - `<FormDrawer id? mode="create|edit" onClose onSaved />`
- Helpers:
    - `useDrawerRoute(paramKey)`
    - `useBodyScrollLock(isOpen)`
    - `useTrapFocus(ref, isOpen)`

---

## 3. Modal

### Kdy použít
- Destruktivní akce (smazání, reset).
- Single-purpose potvrzení.
- Rychlé single-field interakce.

### UX pravidla
- **Krátký obsah**: žádný scroll uvnitř modalu.
- **CTA**: primární akce vpravo, sekundární vlevo.
- **Klávesy**: `Enter` potvrzuje, `Esc` ruší.
- **A11y**: stejně jako Drawer (focus trap, `role="alertdialog"`).

---

## 4. Konsolidace napříč aplikací

- **Customers, Team, Invoices**: detail a edit → Drawer.
- **Delete** akce → Modal confirm.
- **Create**: preferujeme Drawer (zachování kontextu listu).
- **Linkování**: vždy přes route (žádné čisté UI-stavy).

---

## 5. PR Checklist

Každý PR, který zavádí Modal/Drawer, musí projít tímto checklistem:

- [ ] Má komponenta vlastní route (deep-link)?
- [ ] Neotevírá se více než 1 Drawer najednou?
- [ ] Back/forward navigace funguje?
- [ ] Scroll lock a focus trap implementovány?
- [ ] Mobilní safe-area padding nastaven?
- [ ] A11y atributy (`role`, `aria-*`) správně?
- [ ] E2E test deeplink (`/feature/:id`) otevře Drawer?

---

## 6. Testování

- **Unit/RTL**: render Drawer/Modal, kontrola focusu a tlačítek.
- **E2E (Cypress)**:
    - `/app/customers/:id` otevře Drawer.
    - `/app/customers/new` → Create form Drawer.
    - Delete tlačítko → Confirm Modal → odstranění.
- **A11y scan** (axe, pa11y) → bez chyb.

---

📌 **Cíl:** Uživatel musí mít konzistentní pocit:
- **Detail/Edit/Create = Drawer** (zůstávám v kontextu).
- **Confirm/Destructive = Modal** (teď řeším jen tohle).
