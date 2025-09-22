import { render, screen } from '@testing-library/react';
import { DataTableV2 } from '../datatable-v2';

type Row = { id: string; name: string };
const columns = [{ id: 'name', header: 'Name', accessor: (r: Row) => r.name }];

describe('DataTableV2 shell', () => {
  it('renders empty state', () => {
    render(<DataTableV2<Row> data={[]} columns={columns} keyField="id" />);
    expect(screen.getByText(/Žádná data/i)).toBeInTheDocument();
  });
  it('renders skeleton while loading', () => {
    render(<DataTableV2<Row> data={[]} columns={columns} keyField="id" loading />);
    // jen sanity, že vznikly nějaké skeleton řádky
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });
  it('renders rows', () => {
    render(<DataTableV2<Row> data={[{ id: '1', name: 'Alice' }]} columns={columns} keyField="id" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
