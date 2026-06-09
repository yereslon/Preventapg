import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartPanel } from '../CartPanel';
import type { CartState } from '../../types/cart';

const CARRITO_VACIO: CartState = { items: [], total: 0, totalUnidades: 0 };

const CARRITO_CON_ITEM: CartState = {
  items: [{
    cartKey: 'clave-1',
    id: 1,
    nombre: 'Bolsa Negra 5kg',
    categoria: 'Bolsas',
    precio: 12.5,
    unidad: 'paq',
    preciosExtra: [],
    cantidad: 2,
  }],
  total: 25,
  totalUnidades: 2,
};

const HANDLERS = {
  onSumarUno: vi.fn(),
  onQuitarUno: vi.fn(),
  onCambiarCantidad: vi.fn(),
  onEliminar: vi.fn(),
  onVaciar: vi.fn(),
  onVerPedido: vi.fn(),
};

describe('CartPanel — carrito vacío', () => {
  it('muestra el mensaje de carrito vacío', () => {
    render(<CartPanel cart={CARRITO_VACIO} {...HANDLERS} />);
    expect(screen.getByText('El pedido está vacío')).toBeInTheDocument();
  });

  it('no muestra el botón "Ver pedido" cuando está vacío', () => {
    render(<CartPanel cart={CARRITO_VACIO} {...HANDLERS} />);
    expect(screen.queryByRole('button', { name: /ver pedido/i })).not.toBeInTheDocument();
  });

  it('no muestra el botón "Vaciar" cuando está vacío', () => {
    render(<CartPanel cart={CARRITO_VACIO} {...HANDLERS} />);
    expect(screen.queryByRole('button', { name: /vaciar/i })).not.toBeInTheDocument();
  });
});

// Tests de interacción sin timers — usan userEvent normalmente
describe('CartPanel — interacciones con ítems', () => {
  afterEach(() => vi.clearAllMocks());

  function renderConItem(overrides: Partial<typeof HANDLERS> = {}) {
    return render(<CartPanel cart={CARRITO_CON_ITEM} {...HANDLERS} {...overrides} />);
  }

  it('muestra el nombre del producto', () => {
    renderConItem();
    expect(screen.getByText('Bolsa Negra 5kg')).toBeInTheDocument();
  });

  it('muestra la etiqueta "Total"', () => {
    renderConItem();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('muestra el badge con el número de ítems en el encabezado', () => {
    renderConItem();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('llama onSumarUno con el cartKey al hacer clic en +', async () => {
    const onSumarUno = vi.fn();
    renderConItem({ onSumarUno });
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(onSumarUno).toHaveBeenCalledWith('clave-1');
  });

  it('llama onQuitarUno con el cartKey al hacer clic en −', async () => {
    const onQuitarUno = vi.fn();
    renderConItem({ onQuitarUno });
    await userEvent.click(screen.getByRole('button', { name: '−' }));
    expect(onQuitarUno).toHaveBeenCalledWith('clave-1');
  });

  it('"Ver pedido →" llama onVerPedido', async () => {
    const onVerPedido = vi.fn();
    renderConItem({ onVerPedido });
    await userEvent.click(screen.getByRole('button', { name: /ver pedido/i }));
    expect(onVerPedido).toHaveBeenCalledTimes(1);
  });

  it('"Vaciar" muestra confirmación antes de actuar', async () => {
    renderConItem();
    await userEvent.click(screen.getByRole('button', { name: 'Vaciar' }));
    expect(screen.getByText('¿Vaciar todo el pedido?')).toBeInTheDocument();
    expect(HANDLERS.onVaciar).not.toHaveBeenCalled();
  });

  it('confirmar vaciar llama onVaciar', async () => {
    const onVaciar = vi.fn();
    renderConItem({ onVaciar });
    await userEvent.click(screen.getByRole('button', { name: 'Vaciar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí' }));
    expect(onVaciar).toHaveBeenCalledTimes(1);
  });

  it('cancelar vaciar no llama onVaciar', async () => {
    const onVaciar = vi.fn();
    renderConItem({ onVaciar });
    await userEvent.click(screen.getByRole('button', { name: 'Vaciar' }));
    await userEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onVaciar).not.toHaveBeenCalled();
  });
});

// Tests del timer de deshacer — usan fireEvent (síncrono) + fake timers
describe('CartPanel — undo de eliminación', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { act(() => { vi.runAllTimers(); }); vi.useRealTimers(); vi.clearAllMocks(); });

  function renderConItem(overrides: Partial<typeof HANDLERS> = {}) {
    return render(<CartPanel cart={CARRITO_CON_ITEM} {...HANDLERS} {...overrides} />);
  }

  it('muestra el toast "Deshacer" al hacer clic en eliminar', () => {
    renderConItem();
    act(() => { fireEvent.click(screen.getByTitle('Eliminar')); });
    expect(screen.getByText('Deshacer')).toBeInTheDocument();
  });

  it('NO llama onEliminar inmediatamente (espera el timer de 5 s)', () => {
    const onEliminar = vi.fn();
    renderConItem({ onEliminar });
    act(() => { fireEvent.click(screen.getByTitle('Eliminar')); });
    expect(onEliminar).not.toHaveBeenCalled();
  });

  it('llama onEliminar después de que vence el timer', () => {
    const onEliminar = vi.fn();
    renderConItem({ onEliminar });
    act(() => { fireEvent.click(screen.getByTitle('Eliminar')); });
    act(() => { vi.runAllTimers(); });
    expect(onEliminar).toHaveBeenCalledWith('clave-1');
  });

  it('"Deshacer" cancela la eliminación y onEliminar no se llama nunca', () => {
    const onEliminar = vi.fn();
    renderConItem({ onEliminar });
    act(() => { fireEvent.click(screen.getByTitle('Eliminar')); });
    act(() => { fireEvent.click(screen.getByText('Deshacer')); });
    act(() => { vi.runAllTimers(); });
    expect(onEliminar).not.toHaveBeenCalled();
  });
});
