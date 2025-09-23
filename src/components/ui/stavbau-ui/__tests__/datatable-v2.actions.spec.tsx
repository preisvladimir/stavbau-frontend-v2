import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DataTableV2 } from '../datatable-v2';

type Row = { id: string; name: string };
const data: Row[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];
const columns = [{ id: 'name', header: 'Name', accessor: (r: Row) => r.name }];

describe('DataTableV2 row actions', () => {
  it('renders actions column and clicking action does not trigger onRowClick', () => {
    const onRowClick = vi.fn();
    const onAction = vi.fn();

    render(
      <DataTableV2<Row>
        data={data}
        columns={columns}
        keyField="id"
        onRowClick={onRowClick}
        rowActions={(row) => (
          <button type="button" aria-label={`remove-${row.id}`} onClick={() => onAction(row.id)}>
            ✖
          </button>
        )}
      />
    );

    // existuje hlavička Akce (jednoznačné cílení)
    expect(screen.getByTestId('dtv2-actions-header')).toBeInTheDocument();

    // klik na akci vyvolá jen akci, ne onRowClick
    fireEvent.click(screen.getByRole('button', { name: /remove-1/i }));
    expect(onAction).toHaveBeenCalledWith('1');
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
