import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClients } from '../useClients';

beforeEach(() => {
  localStorage.clear();
});

const PRODUCTO = {
  id: 123,
  nombre: 'Bolsa Negra 5kg',
  categoria: 'Bolsas',
  precio: 12.5,
  unidad: 'paq',
  preciosExtra: [{ unidad: 'paq', precio: 12.5 }],
};

describe('useClients — sesiones', () => {
  it('abre el modal automáticamente si no hay sesiones', () => {
    const { result } = renderHook(() => useClients());
    expect(result.current.sesiones).toHaveLength(0);
    expect(result.current.modalAbierto).toBe(true);
  });

  it('crearSesion añade una sesión y la activa', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan García', 'Lima Norte', false); });
    expect(result.current.sesiones).toHaveLength(1);
    expect(result.current.sesionActiva?.nombre).toBe('Juan García');
    expect(result.current.sesionActiva?.ubicacion).toBe('Lima Norte');
  });

  it('crearSesion cierra el modal', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Pedro', 'Surco', true); });
    expect(result.current.modalAbierto).toBe(false);
  });

  it('cerrarSesion elimina la sesión', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Ana', 'Surco', true); });
    const id = result.current.sesionActiva!.id;
    act(() => { result.current.cerrarSesion(id); });
    expect(result.current.sesiones).toHaveLength(0);
  });

  it('cerrarSesion activa la siguiente sesión disponible', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Ana', 'Surco', true); });
    act(() => { result.current.crearSesion('Luis', 'Miraflores', true); });
    const primeraId = result.current.sesiones[0].id;
    act(() => { result.current.setActivo(primeraId); });
    act(() => { result.current.cerrarSesion(primeraId); });
    expect(result.current.sesionActiva?.nombre).toBe('Luis');
  });

  it('abre el modal cuando se cierra la última sesión', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Ana', 'Surco', true); });
    const id = result.current.sesionActiva!.id;
    act(() => { result.current.cerrarSesion(id); });
    expect(result.current.modalAbierto).toBe(true);
  });
});

describe('useClients — carrito', () => {
  it('agregar añade producto al carrito de la sesión activa', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 3); });
    expect(result.current.cart.items).toHaveLength(1);
    expect(result.current.cart.items[0].cantidad).toBe(3);
  });

  it('agregar suma cantidad si el mismo cartKey ya existe', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 2); });
    act(() => { result.current.agregar(PRODUCTO, 3); });
    expect(result.current.cart.items[0].cantidad).toBe(5);
  });

  it('agregar usa precioOverride si se proporciona', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 1, 10.00); });
    expect(result.current.cart.items[0].precio).toBe(10.00);
  });

  it('cart.total calcula correctamente', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 2, 10); });
    expect(result.current.cart.total).toBe(20);
  });

  it('vaciar limpia el carrito de la sesión activa', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 2); });
    act(() => { result.current.vaciar(); });
    expect(result.current.cart.items).toHaveLength(0);
  });

  it('los carritos de sesiones distintas son independientes', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Ana', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 5); });
    act(() => { result.current.crearSesion('Luis', 'Surco', true); });
    // Luis tiene carrito vacío aunque Ana tiene 5
    expect(result.current.cart.items).toHaveLength(0);
    // Volver a Ana
    const anaId = result.current.sesiones[0].id;
    act(() => { result.current.setActivo(anaId); });
    expect(result.current.cart.items[0].cantidad).toBe(5);
  });
});

describe('useClients — migración pg_carrito', () => {
  it('migra pg_carrito legacy como sesión "Cliente sin asignar"', () => {
    const legacyItems = [{ ...PRODUCTO, cartKey: '123_0', cantidad: 2 }];
    localStorage.setItem('pg_carrito', JSON.stringify(legacyItems));
    const { result } = renderHook(() => useClients());
    expect(result.current.sesiones).toHaveLength(1);
    expect(result.current.sesiones[0].nombre).toBe('Cliente sin asignar');
    expect(result.current.sesiones[0].items).toHaveLength(1);
    expect(localStorage.getItem('pg_carrito')).toBeNull();
  });
});

describe('useClients — confirmarSesion', () => {
  it('cierra la sesión activa y devuelve OrderSummary', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima Norte', false); });
    act(() => { result.current.agregar(PRODUCTO, 2, 10); });
    let summary: ReturnType<typeof result.current.confirmarSesion> | undefined;
    act(() => {
      summary = result.current.confirmarSesion({ nombre: 'Juan', ubicacion: 'Lima Norte', notas: '' });
    });
    expect(result.current.sesiones).toHaveLength(0);
    expect(summary!.items).toHaveLength(1);
    expect(summary!.total).toBe(20);
    expect(summary!.numeroPedido).toMatch(/^PED-/);
  });

  it('guarda historial en localStorage al confirmar', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan García', 'Lima Norte', false); });
    act(() => { result.current.agregar(PRODUCTO, 2, 10); });
    act(() => {
      result.current.confirmarSesion({ nombre: 'Juan García', ubicacion: 'Lima Norte', notas: '' });
    });
    const raw = localStorage.getItem('pg_hist_juan_garcia');
    expect(raw).not.toBeNull();
    const hist = JSON.parse(raw!);
    expect(hist.ultimosProductos[0].nombre).toBe('Bolsa Negra 5kg');
  });

  it('guarda precio negociado cuando difiere del catálogo', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('María Pérez', 'Miraflores', false); });
    act(() => { result.current.agregar(PRODUCTO, 1, 9.00); }); // 9.00 vs catalogo 12.50
    act(() => {
      result.current.confirmarSesion({ nombre: 'María Pérez', ubicacion: 'Miraflores', notas: '' });
    });
    const hist = JSON.parse(localStorage.getItem('pg_hist_maria_perez')!);
    expect(hist.preciosNegociados['Bolsa Negra 5kg_paq']).toBe(9.00);
  });
});
