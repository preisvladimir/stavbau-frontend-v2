import { render, screen, fireEvent } from '@testing-library/react';
import { DataTableV2 } from '../datatable-v2';

type Row = { id: string; name: string; email: string };
const data: Row[] = [
  { id: '1', name: 'Alice', email: 'a@x.com' },
  { id: '2', name: 'Bob',   email: 'b@x.com' },
];

const columns = [
  { id: 'name', header: 'Name', accessor: (r: Row) => r.name },
  { id: 'email', header: 'Email', accessor: (r: Row) => r.email },
];

describe('DataTableV2 toolbar', () => {
  it('toggles column visibility', () => {
    render(<DataTableV2<Row> data={data} columns={columns} keyField="id" />);
    // otevři sloupce
    fireEvent.click(screen.getByTestId('dtv2-columns-trigger'));
    const emailCb = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailCb.checked).toBe(true);
    fireEvent.click(emailCb); // schovej email
    expect(screen.queryByRole('columnheader', { name: /email/i })).toBeNull();
  });

  it('changes density', () => {
    render(<DataTableV2<Row> data={data} columns={columns} keyField="id" />);
    const compactBtn = screen.getByRole('button', { name: /kompaktní|compact/i });
    fireEvent.click(compactBtn);
    // zkontroluj, že nějaká buňka má menší padding (třídu z 'compact' mapy)
    const anyCell = screen.getAllByRole('cell')[0];
    expect(anyCell.className).toMatch(/px-2/);
  });
});