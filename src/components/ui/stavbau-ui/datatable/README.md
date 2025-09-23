# 📊 DataTableV2 – Stavbau UI

Univerzální tabulková komponenta s podporou **responsivity** a **přístupnosti**.

---

## 🚦 Breakpointy a layouty

- **< md (mobil)** → každý řádek se vykreslí jako **karta** (`DataRowCard`)
  - Title (hlavní pole)
  - Subtitle (sekundární pole)
  - 3–5 detailů (prioritizované)
  - Akce (ikonky/kebab vpravo nahoře)
- **md – lg (tablet, menší notebook)** → tabulka je **horizontálně scrollovatelná**
  - Sticky vlevo = sloupec označený `isTitle`
  - Sticky vpravo = akční sloupec
- **≥ lg (desktop)** → plná tabulka, bez kompromisů

---

## 🧩 Definice sloupců (`ColumnDef`)

Sloupce podporují mobilní metadata v `columnDef.meta.stbMobile`:

```ts
{
  accessorKey: 'name',
  header: 'Název',
  meta: {
    stbMobile: {
      isTitle: true,        // hlavní titulek karty
      priority: 0,          // pořadí na kartě
      mobileHidden: false,  // skrytí na kartě
    }
  }
},
{
  accessorKey: 'status',
  header: 'Stav',
  meta: {
    stbMobile: {
      isSubtitle: true,     // sekundární titulek
      priority: 1
    }
  }
},
{
  accessorKey: 'createdAt',
  header: 'Vytvořeno',
  meta: {
    stbMobile: {
      priority: 2,
      formatter: (value) => <time dateTime={String(value)}>{formatDate(value)}</time>
    }
  }
},
{
  id: 'actions',
  header: '',
  cell: ({ row }) => <RowActions row={row.original} />,
  meta: { stbMobile: { priority: 99 } }
}
⚡ Props komponenty
ts
Zkopírovat kód
<DataTableV2
  data={rows}
  columns={columns}
  rowActions={(row) => <RowActions row={row} />}
  onRowClick={(row) => console.log(row)}
  variant="surface" // nebo "plain"
  showToolbar
  showPager
  loading={false}
/>
rowActions?: (row: T) => ReactNode → renderer akcí (sloupec „Akce“ + mobilní karty)

onRowClick?: (row: T) => void → kliknutí na řádek (tabulka) / celou kartu (mobil)

variant?: 'plain' | 'surface' → vzhled wrapperu

🎨 Stylování
Tailwind breakpoints: md, lg

Sticky sloupce (isTitle, actions) používají:

md:sticky md:left-0 / md:right-0

lg:static (reset)

Focus ringy: focus-visible:ring-[rgb(var(--sb-focus))]

Skeletony: motion-safe:animate-pulse

♿ Přístupnost (A11y)
<DataRowCard>:

aria-labelledby → Title

aria-controls → detailní seznam při “Zobrazit více”

role="listitem"

Mobilní seznam karet: role="list"

Sortable headery: aria-sort, klávesy Enter/Space

Pager:

aria-live="polite" pro oznamování změn

Tlačítka mají aria-controls navázané na tabulku

📖 Příklady použití
Seznam uživatelů (málo sloupců) → Title = jméno, Subtitle = e-mail, detail = role, akce = edit/smazat

Seznam faktur (hodně sloupců) → mobil = karty s číslem faktury a částkou, tablet = scrollable tabulka, desktop = plná tabulka

Seznam projektů → Title = název projektu, Subtitle = stav, detail = vlastníka, termín, akce = kebab menu