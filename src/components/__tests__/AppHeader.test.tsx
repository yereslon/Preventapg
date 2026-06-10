import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '../AppHeader';
import { exportarDatos } from '../../utils/backup';

vi.mock('../../utils/backup', () => ({
  exportarDatos: vi.fn(),
  importarDatos: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../hooks/useInstallPrompt', () => ({
  useInstallPrompt: () => ({ puedeInstalar: false, instalar: vi.fn() }),
}));

const BASE = {
  busqueda: '',
  setBusqueda: vi.fn(),
  totalUnidades: 0,
  cartBumpKey: 0,
  onCarritoClick: vi.fn(),
  onRecargar: vi.fn(),
  onHistorial: vi.fn(),
  onLiquidacion: vi.fn(),
};

describe('AppHeader', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra el nombre de la empresa', () => {
    render(<AppHeader {...BASE} />);
    expect(screen.getAllByText('Plásticos Guerrero').length).toBeGreaterThan(0);
  });

  it('no muestra el badge del carrito cuando totalUnidades es 0', () => {
    render(<AppHeader {...BASE} totalUnidades={0} />);
    // El badge muestra el número; con 0 no debe aparecer
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('muestra el badge del carrito con la cantidad correcta', () => {
    render(<AppHeader {...BASE} totalUnidades={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('llama onCarritoClick al hacer clic en el botón del carrito', async () => {
    const onCarritoClick = vi.fn();
    render(<AppHeader {...BASE} onCarritoClick={onCarritoClick} />);
    await userEvent.click(screen.getByRole('button', { name: /pedido/i }));
    expect(onCarritoClick).toHaveBeenCalledTimes(1);
  });

  it('el input de búsqueda refleja la prop busqueda', () => {
    render(<AppHeader {...BASE} busqueda="bolsa" />);
    const inputs = screen.getAllByPlaceholderText(/buscar/i);
    expect(inputs[0]).toHaveValue('bolsa');
  });

  it('llama setBusqueda al escribir en el campo de búsqueda', () => {
    const setBusqueda = vi.fn();
    render(<AppHeader {...BASE} setBusqueda={setBusqueda} />);
    const inputs = screen.getAllByPlaceholderText(/buscar/i);
    fireEvent.change(inputs[0], { target: { value: 'taza' } });
    expect(setBusqueda).toHaveBeenCalledWith('taza');
  });

  it('el botón de limpiar búsqueda solo aparece cuando busqueda no está vacía', () => {
    const { rerender } = render(<AppHeader {...BASE} busqueda="" />);
    expect(screen.queryAllByText('✕')).toHaveLength(0);

    rerender(<AppHeader {...BASE} busqueda="bolsa" />);
    expect(screen.getAllByText('✕').length).toBeGreaterThan(0);
  });

  it('llama setBusqueda con cadena vacía al limpiar la búsqueda', async () => {
    const setBusqueda = vi.fn();
    render(<AppHeader {...BASE} busqueda="bolsa" setBusqueda={setBusqueda} />);
    await userEvent.click(screen.getAllByText('✕')[0]);
    expect(setBusqueda).toHaveBeenCalledWith('');
  });

  it('el menú de opciones está cerrado al inicio', () => {
    render(<AppHeader {...BASE} />);
    expect(screen.queryByText('Historial de pedidos')).not.toBeInTheDocument();
  });

  it('abre el menú al hacer clic en Opciones', async () => {
    render(<AppHeader {...BASE} />);
    await userEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    expect(screen.getByText('Historial de pedidos')).toBeInTheDocument();
  });

  it('llama onHistorial al hacer clic en "Historial de pedidos"', async () => {
    const onHistorial = vi.fn();
    render(<AppHeader {...BASE} onHistorial={onHistorial} />);
    await userEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    await userEvent.click(screen.getByText('Historial de pedidos'));
    expect(onHistorial).toHaveBeenCalledTimes(1);
  });

  it('llama onLiquidacion al hacer clic en "Liquidacion del dia"', async () => {
    const onLiquidacion = vi.fn();
    render(<AppHeader {...BASE} onLiquidacion={onLiquidacion} />);
    await userEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    await userEvent.click(screen.getByText('Liquidacion del dia'));
    expect(onLiquidacion).toHaveBeenCalledTimes(1);
  });

  it('llama exportarDatos al hacer clic en "Exportar datos"', async () => {
    render(<AppHeader {...BASE} />);
    await userEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    await userEvent.click(screen.getByText('Exportar datos'));
    expect(exportarDatos).toHaveBeenCalledTimes(1);
  });

  it('cierra el menú al hacer clic fuera de él', async () => {
    render(
      <div>
        <AppHeader {...BASE} />
        <p>Área externa</p>
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    expect(screen.getByText('Historial de pedidos')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Área externa'));
    // jsdom no ejecuta transiciones CSS; verificamos el estado semántico (aria-expanded)
    // en lugar de la presencia en DOM (Headless UI mantiene el elemento durante la animación de salida)
    expect(screen.getByRole('button', { name: 'Opciones' })).toHaveAttribute('aria-expanded', 'false');
  });
});
