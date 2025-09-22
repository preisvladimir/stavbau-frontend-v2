// src/components/ui/stavbau-ui/__tests__/datatable.sort.spec.tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import { DataTable } from '../datatable';

type Row = { id: string; name: string };
const data: Row[] = [
  { id: '1', name: 'Charlie' },
  { id: '2', name: 'Alice' },
  { id: '3', name: 'Bob' },
];

const columns = [{ id: 'name', header: 'Name', accessor: (r: Row) => r.name }];

function getRenderedOrder() {
  return screen.getAllByRole('row').slice(1) // skip header
    .map(tr => within(tr).getByText(/Alice|Bob|Charlie/).textContent);
}

describe('DataTable sorting', () => {
  it('cycles none → asc → desc and reflects aria-sort', () => {
    render(<DataTable<Row> data={data} columns={columns} keyField="id" defaultSort={[]} />);

    const header = screen.getByRole('columnheader', { name: /name/i });
    // initial: none
    expect(header).toHaveAttribute('aria-sort', 'none');

    // click 1: asc
    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(getRenderedOrder()).toEqual(['Alice', 'Bob', 'Charlie']);

    // click 2: desc
    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(getRenderedOrder()).toEqual(['Charlie', 'Bob', 'Alice']);

    // click 3: none
    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-sort', 'none');
  });

  it('shift-click enables multi-sort (state change only, basic smoke)', () => {
    render(<DataTable<Row> data={data} columns={columns} keyField="id" defaultSort={[]} />);
    const header = screen.getByRole('columnheader', { name: /name/i });
    fireEvent.click(header, { shiftKey: true }); // no second column, just ensure no error
    expect(header).toBeInTheDocument();
  });
});
