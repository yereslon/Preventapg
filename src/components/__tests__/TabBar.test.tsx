import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from '../TabBar';
import type { ClientSession } from '../../types/clients';

function crearSesion(id: string, nombre: string): ClientSession {
  return {
    id,
    nombre,
    ubicacion: 'Lima',
    esNuevo: false,
    items: [],
    vista: 'catalogo',
    orderForm: { nombre, ubicacion: 'Lima', notas: '' },
    preciosNegociados: {},
    ultimosProductos: [],
  };
}

const BASE = {
  sesiones: [] as ClientSession[],
  activoId: null as string | null,
  onSeleccionar: vi.fn(),
  onCerrar: vi.fn(),
  onNuevo: vi.fn(),
  onHistorial: vi.fn(),
};

describe('TabBar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('siempre muestra el botón "+ Nuevo"', () => {
    render(<TabBar {...BASE} />);
    expect(screen.getByText('＋ Nuevo')).toBeInTheDocument();
  });

  it('muestra el nombre de cada sesión activa', () => {
    const sesiones = [crearSesion('1', 'Juan García'), crearSesion('2', 'Ana López')];
    render(<TabBar {...BASE} sesiones={sesiones} activoId="1" />);
    expect(screen.getByText('Juan García')).toBeInTheDocument();
    expect(screen.getByText('Ana López')).toBeInTheDocument();
  });

  it('llama onSeleccionar con el id correcto al hacer clic en una pestaña', async () => {
    const onSeleccionar = vi.fn();
    render(<TabBar {...BASE} sesiones={[crearSesion('s-1', 'Pedro Ruiz')]} activoId="s-1" onSeleccionar={onSeleccionar} />);
    await userEvent.click(screen.getByText('Pedro Ruiz'));
    expect(onSeleccionar).toHaveBeenCalledWith('s-1');
  });

  it('llama onCerrar con el id al hacer clic en el botón de cerrar pestaña', async () => {
    const onCerrar = vi.fn();
    render(<TabBar {...BASE} sesiones={[crearSesion('s-2', 'María Torres')]} activoId="s-2" onCerrar={onCerrar} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar pestaña de María Torres' }));
    expect(onCerrar).toHaveBeenCalledWith('s-2');
  });

  it('llama onNuevo al hacer clic en "+ Nuevo"', async () => {
    const onNuevo = vi.fn();
    render(<TabBar {...BASE} onNuevo={onNuevo} />);
    await userEvent.click(screen.getByText('＋ Nuevo'));
    expect(onNuevo).toHaveBeenCalledTimes(1);
  });

  it('llama onHistorial al hacer clic en el botón de historial', async () => {
    const onHistorial = vi.fn();
    render(<TabBar {...BASE} onHistorial={onHistorial} />);
    await userEvent.click(screen.getByRole('button', { name: 'Historial de pedidos' }));
    expect(onHistorial).toHaveBeenCalledTimes(1);
  });

  it('no muestra botones de pestaña cuando no hay sesiones', () => {
    render(<TabBar {...BASE} />);
    expect(screen.queryByRole('button', { name: /cerrar pestaña/i })).not.toBeInTheDocument();
  });
});
