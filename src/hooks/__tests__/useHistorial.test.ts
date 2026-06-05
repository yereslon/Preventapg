import { describe, it, expect, beforeEach } from 'vitest';
import { getClientesConHistorial } from '../useHistorial';
import type { ClienteHistorial } from '../../types/clients';

beforeEach(() => localStorage.clear());

const HIST_JUAN: ClienteHistorial = {
  ultimosProductos: [],
  preciosNegociados: {},
  pedidos: [
    {
      numeroPedido: 'PED-AAA',
      fecha: '03/06/2026',
      total: 85.00,
      ubicacion: 'Lima Norte',
      notas: '',
      items: [{ id: 1, nombre: 'Bolsa', categoria: 'Bolsas', precio: 10, unidad: 'paq', cartKey: '1_0', cantidad: 5, preciosExtra: [{ unidad: 'paq', precio: 10 }] }],
    },
    {
      numeroPedido: 'PED-BBB',
      fecha: '01/06/2026',
      total: 42.50,
      ubicacion: 'Lima Norte',
      notas: '',
      items: [],
    },
  ],
};

const HIST_MARIA: ClienteHistorial = {
  ultimosProductos: [],
  preciosNegociados: {},
  pedidos: [
    {
      numeroPedido: 'PED-CCC',
      fecha: '02/06/2026',
      total: 30.00,
      ubicacion: 'Miraflores',
      notas: '',
      items: [],
    },
  ],
};

describe('getClientesConHistorial', () => {
  it('devuelve array vacío cuando no hay historial en localStorage', () => {
    expect(getClientesConHistorial()).toEqual([]);
  });

  it('lee clientes de claves pg_hist_* con pedidos', () => {
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    const result = getClientesConHistorial();
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('juan_garcia');
  });

  it('ignora claves sin pedidos o con pedidos vacíos', () => {
    localStorage.setItem('pg_hist_sin_pedidos', JSON.stringify({
      ultimosProductos: [],
      preciosNegociados: {},
      pedidos: [],
    }));
    expect(getClientesConHistorial()).toHaveLength(0);
  });

  it('calcula totalPedidos y totalAcumulado correctamente', () => {
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    const result = getClientesConHistorial();
    expect(result[0].totalPedidos).toBe(2);
    expect(result[0].totalAcumulado).toBe(127.50);
  });

  it('extrae ultimaFecha del primer pedido', () => {
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    const result = getClientesConHistorial();
    expect(result[0].ultimaFecha).toBe('03/06/2026');
  });

  it('extrae ubicacion del primer pedido', () => {
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    const result = getClientesConHistorial();
    expect(result[0].ubicacion).toBe('Lima Norte');
  });

  it('ordena clientes por ultimaFecha descendente', () => {
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    localStorage.setItem('pg_hist_maria_perez', JSON.stringify(HIST_MARIA));
    const result = getClientesConHistorial();
    expect(result[0].nombre).toBe('juan_garcia');
    expect(result[1].nombre).toBe('maria_perez');
  });

  it('ignora claves que no empiezan con pg_hist_', () => {
    localStorage.setItem('pg_sesiones', JSON.stringify([]));
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    expect(getClientesConHistorial()).toHaveLength(1);
  });
});
