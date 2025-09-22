import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { DataTableV2 } from '../datatable-v2';

type Row = { id: string; name: string };
const data: Row[] = [
  { id: '1', name: 'A' },
  { id: '2', name: 'B' },
  { id: '3', name: 'C' },
  { id: '4', name: 'D' },
  { id: '5', name: 'E' },
];

const columns = [{ id: 'name', header: 'Name', accessor: (r: Row) => r.name }];

function visibleNames() {
  return screen.getAllByRole('row').slice(1).map(tr => within(tr).getByText(/[A-E]/).textContent);
}

describe('DataTableV2 paging', () => {
  it('client paging shows pageSize items and next/prev navigates', () => {
    render(<DataTableV2<Row> data={data} columns={columns} keyField="id" defaultPageSize={2} defaultPage={1} />);

    expect(visibleNames()).toEqual(['A', 'B']);
    fireEvent.click(screen.getByRole('button', { name: /další stránka/i }));
    expect(visibleNames()).toEqual(['C', 'D']);
    fireEvent.click(screen.getByRole('button', { name: /další stránka/i }));
    expect(visibleNames()).toEqual(['E']); // poslední stránka
    fireEvent.click(screen.getByRole('button', { name: /předchozí stránka/i }));
    expect(visibleNames()).toEqual(['C', 'D']);
  });

  it('controlled paging calls onPageChange and respects page prop', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <DataTableV2<Row>
        data={data}
        columns={columns}
        keyField="id"
        page={1}
        pageSize={2}
        total={data.length}
        enableClientPaging={false}
        onPageChange={onPageChange}
      />
    );

    // Klik → pouze callback, obsah se nezmění dokud nezmění rodič prop `page`
    fireEvent.click(screen.getByRole('button', { name: /další stránka/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    // Simuluj rodičovský update
    rerender(
      <DataTableV2<Row>
        data={data.slice(2,4)} // server by vrátil 3.–4. položku
        columns={columns}
        keyField="id"
        page={2}
        pageSize={2}
        total={data.length}
        enableClientPaging={false}
        onPageChange={onPageChange}
      />
    );
    expect(visibleNames()).toEqual(['C', 'D']);
  });
});
