import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';
import { useClients, normalizarNombreCliente } from '../useClients';
import { histGet, histSet, _resetDb } from '../../utils/db';
import type { ClienteHistorial } from '../../types/clients';

beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDb();
  localStorage.clear();
});

/** Espera a que la carga inicial desde IndexedDB se complete */
async function esperarDB(result: { current: ReturnType<typeof useClients> }) {
  await waitFor(() => expect(result.current._dbListo).toBe(true));
}

const PRODUCTO = {
  id: 123,
  nombre: 'Bolsa Negra 5kg',
  categoria: 'Bolsas',
  precio: 12.5,
  unidad: 'paq',
  preciosExtra: [{ unidad: 'paq', precio: 12.5 }],
};

describe('useClients — sesiones', () => {
  it('no abre el modal automaticamente si no hay sesiones', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    expect(result.current.sesiones).toHaveLength(0);
    expect(result.current.modalAbierto).toBe(false);
  });

  it('crearSesion agrega una sesion y la activa', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Juan Garcia', 'Lima Norte', false); });
    expect(result.current.sesiones).toHaveLength(1);
    expect(result.current.sesionActiva?.nombre).toBe('Juan Garcia');
    expect(result.current.sesionActiva?.ubicacion).toBe('Lima Norte');
  });

  it('crearSesion cierra el modal', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Pedro', 'Surco', true); });
    expect(result.current.modalAbierto).toBe(false);
  });

  it('cerrarSesion elimina la sesion', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Ana', 'Surco', true); });
    const id = result.current.sesionActiva!.id;
    act(() => { result.current.cerrarSesion(id); });
    expect(result.current.sesiones).toHaveLength(0);
  });

  it('cerrarSesion activa la siguiente sesion disponible', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Ana', 'Surco', true); });
    act(() => { result.current.crearSesion('Luis', 'Miraflores', true); });
    const primeraId = result.current.sesiones[0].id;
    act(() => { result.current.setActivo(primeraId); });
    act(() => { result.current.cerrarSesion(primeraId); });
    expect(result.current.sesionActiva?.nombre).toBe('Luis');
  });

  it('no abre el modal al cerrar la ultima sesion', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Ana', 'Surco', true); });
    const id = result.current.sesionActiva!.id;
    act(() => { result.current.cerrarSesion(id); });
    expect(result.current.modalAbierto).toBe(false);
  });
});

describe('useClients — carrito', () => {
  it('agregar agrega producto al carrito de la sesion activa', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 3); });
    expect(result.current.cart.items).toHaveLength(1);
    expect(result.current.cart.items[0].cantidad).toBe(3);
  });

  it('agregar suma cantidad si el mismo cartKey ya existe', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 2); });
    act(() => { result.current.agregar(PRODUCTO, 3); });
    expect(result.current.cart.items[0].cantidad).toBe(5);
  });

  it('agregar usa precioOverride si se proporciona', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 1, 10.00); });
    expect(result.current.cart.items[0].precio).toBe(10.00);
  });

  it('cart.total calcula correctamente', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 2, 10); });
    expect(result.current.cart.total).toBe(20);
  });

  it('vaciar limpia el carrito de la sesion activa', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 2); });
    act(() => { result.current.vaciar(); });
    expect(result.current.cart.items).toHaveLength(0);
  });

  it('los carritos de sesiones distintas son independientes', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Ana', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 5); });
    act(() => { result.current.crearSesion('Luis', 'Surco', true); });
    expect(result.current.cart.items).toHaveLength(0);
    const anaId = result.current.sesiones[0].id;
    act(() => { result.current.setActivo(anaId); });
    expect(result.current.cart.items[0].cantidad).toBe(5);
  });
});

describe('useClients — migracion pg_carrito', () => {
  it('migra pg_carrito legacy como sesion "Cliente sin asignar"', async () => {
    const legacyItems = [{ ...PRODUCTO, cartKey: '123_0', cantidad: 2 }];
    localStorage.setItem('pg_carrito', JSON.stringify(legacyItems));
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    expect(result.current.sesiones).toHaveLength(1);
    expect(result.current.sesiones[0].nombre).toBe('Cliente sin asignar');
    expect(result.current.sesiones[0].items).toHaveLength(1);
    expect(localStorage.getItem('pg_carrito')).toBeNull();
  });
});

describe('useClients — confirmarSesion', () => {
  it('cierra la sesion activa y devuelve OrderSummary', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Juan', 'Lima Norte', false); });
    act(() => { result.current.agregar(PRODUCTO, 2, 10); });

    let summary: Awaited<ReturnType<typeof result.current.confirmarSesion>> | undefined;
    await act(async () => {
      summary = await result.current.confirmarSesion({ nombre: 'Juan', ubicacion: 'Lima Norte', notas: '' });
    });
    expect(result.current.sesiones).toHaveLength(0);
    expect(summary!.items).toHaveLength(1);
    expect(summary!.total).toBe(20);
    expect(summary!.numeroPedido).toMatch(/^PED-/);
  });

  it('guarda historial en IndexedDB al confirmar', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Juan Garcia', 'Lima Norte', false); });
    act(() => { result.current.agregar(PRODUCTO, 2, 10); });
    await act(async () => {
      await result.current.confirmarSesion({ nombre: 'Juan Garcia', ubicacion: 'Lima Norte', notas: '' });
    });
    const hist = await histGet(normalizarNombreCliente('Juan Garcia')) as ClienteHistorial;
    expect(hist).not.toBeNull();
    expect(hist.ultimosProductos[0].nombre).toBe('Bolsa Negra 5kg');
  });

  it('guarda precio negociado cuando difiere del catalogo', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Maria Perez', 'Miraflores', false); });
    act(() => { result.current.agregar(PRODUCTO, 1, 9.00); });
    await act(async () => {
      await result.current.confirmarSesion({ nombre: 'Maria Perez', ubicacion: 'Miraflores', notas: '' });
    });
    const hist = await histGet(normalizarNombreCliente('Maria Perez')) as ClienteHistorial;
    expect(hist.preciosNegociados['Bolsa Negra 5kg_paq']).toBe(9.00);
  });

  it('guarda pedido completo con items en el historial al confirmar', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Ana Rios', 'San Isidro', false); });
    act(() => { result.current.agregar(PRODUCTO, 3, 12.5); });
    await act(async () => {
      await result.current.confirmarSesion({ nombre: 'Ana Rios', ubicacion: 'San Isidro', notas: '' });
    });
    const hist = await histGet(normalizarNombreCliente('Ana Rios')) as ClienteHistorial;
    expect(hist.pedidos).toHaveLength(1);
    expect(hist.pedidos[0].items).toHaveLength(1);
    expect(hist.pedidos[0].items[0].nombre).toBe('Bolsa Negra 5kg');
    expect(hist.pedidos[0].items[0].cantidad).toBe(3);
    expect(hist.pedidos[0].total).toBe(37.5);
  });

  it('acumula pedidos en historial — mas reciente primero', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);

    act(() => { result.current.crearSesion('Ana Rios', 'San Isidro', false); });
    act(() => { result.current.agregar(PRODUCTO, 2); });
    await act(async () => {
      await result.current.confirmarSesion({ nombre: 'Ana Rios', ubicacion: 'San Isidro', notas: '' });
    });

    act(() => { result.current.crearSesion('Ana Rios', 'San Isidro', false); });
    act(() => { result.current.agregar(PRODUCTO, 5); });
    await act(async () => {
      await result.current.confirmarSesion({ nombre: 'Ana Rios', ubicacion: 'San Isidro', notas: '' });
    });

    const hist = await histGet(normalizarNombreCliente('Ana Rios')) as ClienteHistorial;
    expect(hist.pedidos).toHaveLength(2);
    expect(hist.pedidos[0].items[0].cantidad).toBe(5);
    expect(hist.pedidos[1].items[0].cantidad).toBe(2);
  });

  it('limita pedidos a 30 entradas', async () => {
    const pedidosPrevios = Array.from({ length: 30 }, (_, i) => ({
      numeroPedido: `PED-${i}`,
      fecha: '01/01/2026',
      total: 10,
      ubicacion: 'Lima',
      notas: '',
      items: [],
    }));
    await histSet({
      nombre: normalizarNombreCliente('Luis Torres'),
      ultimosProductos: [],
      preciosNegociados: {},
      pedidos: pedidosPrevios,
    });

    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    act(() => { result.current.crearSesion('Luis Torres', 'Lima', false); });
    act(() => { result.current.agregar(PRODUCTO, 1); });
    await act(async () => {
      await result.current.confirmarSesion({ nombre: 'Luis Torres', ubicacion: 'Lima', notas: '' });
    });

    const hist = await histGet(normalizarNombreCliente('Luis Torres')) as ClienteHistorial;
    expect(hist.pedidos).toHaveLength(30);
    expect(hist.pedidos[0].items).toHaveLength(1);
  });
});

describe('useClients — crearSesionConItems', () => {
  it('crea una sesion con items pre-cargados', async () => {
    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    const items = [{ ...PRODUCTO, cartKey: '123_0', cantidad: 4 }];
    act(() => { result.current.crearSesionConItems('Pedro Lima', 'Callao', items); });
    expect(result.current.sesionActiva?.nombre).toBe('Pedro Lima');
    expect(result.current.sesionActiva?.items).toHaveLength(1);
    expect(result.current.sesionActiva?.items[0].cantidad).toBe(4);
    expect(result.current.modalAbierto).toBe(false);
  });

  it('carga historial de precios del cliente al crear sesion con items', async () => {
    await histSet({
      nombre: normalizarNombreCliente('Pedro Lima'),
      ultimosProductos: [],
      preciosNegociados: { 'Bolsa Negra 5kg_paq': 9.00 },
      pedidos: [],
    });

    const { result } = renderHook(() => useClients());
    await esperarDB(result);
    const items = [{ ...PRODUCTO, cartKey: '123_0', cantidad: 2 }];
    act(() => { result.current.crearSesionConItems('Pedro Lima', 'Callao', items); });
    await waitFor(() =>
      expect(result.current.sesionActiva?.preciosNegociados['Bolsa Negra 5kg_paq']).toBe(9.00)
    );
  });
});
