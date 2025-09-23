import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../select';

describe('Select', () => {
  it('renders options and triggers onChange', () => {
    const onChange = vi.fn();
    render(
      <Select
        ariaLabel="page-size"
        value="10"
        onChange={onChange}
        options={[{ value: '5', label: '5' }, { value: '10', label: '10' }]}
      />
    );
    const el = screen.getByLabelText(/page-size/i) as HTMLSelectElement;
    expect(el.value).toBe('10');
    fireEvent.change(el, { target: { value: '5' } });
    expect(onChange).toHaveBeenCalledWith('5');
  });
});
