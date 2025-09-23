import { render, screen, fireEvent, within } from '@testing-library/react';
import { DataTableV2 } from '../datatable-v2';

type Row = { id: string; name: string };
const data: Row[] = [
  { id: '1', name: 'Charlie' },
  { id: '2', name: 'Alice' },
  { id: '3', name: 'Bob' },
];

const columns = [{ id: 'name', header: 'Name', accessor: (r: Row) => r.name }];

function getOrder() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((tr) => within(tr).getByText(/Alice|Bob|Charlie/).textContent);
}

describe('DataTableV2 sorting', () => {
  it('cycles none → asc → desc and aria-sort reflects state', () => {
    render(<DataTableV2<Row> data={data} columns={columns} keyField="id" defaultSort={[]} />);

    const header = screen.getByRole('columnheader', { name: /name/i });
    expect(header).toHaveAttribute('aria-sort', 'none');

    fireEvent.click(header); // asc
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(getOrder()).toEqual(['Alice', 'Bob', 'Charlie']);

    fireEvent.click(header); // desc
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(getOrder()).toEqual(['Charlie', 'Bob', 'Alice']);

    fireEvent.click(header); // none
    expect(header).toHaveAttribute('aria-sort', 'none');
  });

  it('shift-click does not crash (multi-sort hook)', () => {
    render(<DataTableV2<Row> data={data} columns={columns} keyField="id" defaultSort={[]} />);
    const header = screen.getByRole('columnheader', { name: /name/i });
    fireEvent.click(header, { shiftKey: true });
    expect(header).toBeInTheDocument();
  });
});