// src/components/ui/stavbau-ui/__tests__/datatable.spec.tsx
import { render, screen } from '@testing-library/react';
import { DataTable } from '../DataTable';

type Row = { id: string; name: string };

const columns = [
  { id: 'name', header: 'Name', accessor: (r: Row) => r.name },
];

describe('DataTable (PR1)', () => {
  it('renders empty state', () => {
    render(
      <DataTable<Row>
        data={[]}
        columns={columns}
        keyField="id"
      />
    );
    expect(screen.getByText(/Žádná data|No data/i)).toBeInTheDocument();
  });

  it('renders skeleton while loading', () => {
    render(
      <DataTable<Row>
        data={[]}
        columns={columns}
        keyField="id"
        loading
      />
    );
    // 3 skeleton rows × 1 column (plus header) → hledejte bg-muted
    const sk = screen.getAllByRole('row');
    expect(sk.length).toBeGreaterThan(1);
  });

  it('renders rows', () => {
    render(
      <DataTable<Row>
        data={[{ id: '1', name: 'Alice' }]}
        columns={columns}
        keyField="id"
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
