import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFilter } from '../CategoryFilter';

const CATS = ['Todas', 'Bolsas', 'Vajilla'];

describe('CategoryFilter', () => {
  it('renderiza un botón por cada categoría', () => {
    render(<CategoryFilter categorias={CATS} activa="Todas" onChange={vi.fn()} />);
    CATS.forEach(cat => {
      expect(screen.getByRole('button', { name: cat })).toBeInTheDocument();
    });
  });

  it('el botón activo tiene texto blanco y los demás no', () => {
    render(<CategoryFilter categorias={CATS} activa="Bolsas" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Bolsas' })).toHaveClass('text-white');
    expect(screen.getByRole('button', { name: 'Todas' })).not.toHaveClass('text-white');
    expect(screen.getByRole('button', { name: 'Vajilla' })).not.toHaveClass('text-white');
  });

  it('llama onChange con la categoría clickeada', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categorias={CATS} activa="Todas" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Bolsas' }));
    expect(onChange).toHaveBeenCalledWith('Bolsas');
  });

  it('no renderiza botones cuando categorias está vacío', () => {
    render(<CategoryFilter categorias={[]} activa="" onChange={vi.fn()} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
