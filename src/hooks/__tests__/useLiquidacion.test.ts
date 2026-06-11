import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';
import { useLiquidacion } from '../useLiquidacion';
import { liqGet, liqSet, _resetDb } from '../../utils/db';
import type { Liquidacion } from '../../types/liquidacion';

const fechaHoy = new Date().toISOString().slice(0, 10);
const keyHoy   = `liq-${fechaHoy}`;

beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDb();
});

async function esperarDB(result: { current: ReturnType<typeof useLiquidacion> }) {
  await waitFor(() => expect(result.current._dbListo).toBe(true));
}

// ── Inicialización ───────────────────────────────────────────

describe('useLiquidacion — inicializacion', () => {
  it('crea liquidacion vacia para hoy si no existe en DB', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    expect(result.current.liquidacion).not.toBeNull();
    expect(result.current.liquidacion!.fecha).toBe(fechaHoy);
    expect(result.current.liquidacion!.cobros).toHaveLength(0);
    expect(result.current.liquidacion!.dias).toHaveLength(0);
  });

  it('carga liquidacion existente de hoy desde DB', async () => {
    const previa: Liquidacion = {
      id: keyHoy, fecha: fechaHoy,
      cobros: [{ id: 'c1', nombre: 'Juan', efectivo: 100, yape: 50, fotos: [], comentario: '' }],
      dias: [], preventas: [], fondoAsignado: 200, notas: 'test', guardada: false,
    };
    await liqSet(previa as unknown as Record<string, unknown>);

    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    expect(result.current.liquidacion!.cobros).toHaveLength(1);
    expect(result.current.liquidacion!.cobros[0].nombre).toBe('Juan');
    expect(result.current.liquidacion!.fondoAsignado).toBe(200);
  });
});

// ── Cobros ───────────────────────────────────────────────────

describe('useLiquidacion — cobros', () => {
  it('agregarCobro agrega un cobro con valores en 0', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarCobro('Maria Perez'); });
    expect(result.current.liquidacion!.cobros).toHaveLength(1);
    expect(result.current.liquidacion!.cobros[0].nombre).toBe('Maria Perez');
    expect(result.current.liquidacion!.cobros[0].efectivo).toBe(0);
    expect(result.current.liquidacion!.cobros[0].yape).toBe(0);
  });

  it('actualizarCobro modifica efectivo y yape', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarCobro('Carlos'); });
    const id = result.current.liquidacion!.cobros[0].id;
    act(() => { result.current.actualizarCobro(id, { efectivo: 150, yape: 80 }); });
    const cobro = result.current.liquidacion!.cobros[0];
    expect(cobro.efectivo).toBe(150);
    expect(cobro.yape).toBe(80);
  });

  it('eliminarCobro borra el cobro por id', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarCobro('A'); });
    act(() => { result.current.agregarCobro('B'); });
    const idA = result.current.liquidacion!.cobros[0].id;
    act(() => { result.current.eliminarCobro(idA); });
    expect(result.current.liquidacion!.cobros).toHaveLength(1);
    expect(result.current.liquidacion!.cobros[0].nombre).toBe('B');
  });

  it('agregarFoto agrega evidencia al cobro', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarCobro('Pedro'); });
    const id = result.current.liquidacion!.cobros[0].id;
    act(() => { result.current.agregarFoto(id, 'data:image/jpeg;base64,abc'); });
    expect(result.current.liquidacion!.cobros[0].fotos).toHaveLength(1);
    expect(result.current.liquidacion!.cobros[0].fotos[0].dataUrl).toBe('data:image/jpeg;base64,abc');
  });

  it('eliminarFoto elimina la foto del cobro', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarCobro('Pedro'); });
    const cobroId = result.current.liquidacion!.cobros[0].id;
    act(() => { result.current.agregarFoto(cobroId, 'data:image/jpeg;base64,x1'); });
    act(() => { result.current.agregarFoto(cobroId, 'data:image/jpeg;base64,x2'); });
    const fotoId = result.current.liquidacion!.cobros[0].fotos[0].id;
    act(() => { result.current.eliminarFoto(cobroId, fotoId); });
    expect(result.current.liquidacion!.cobros[0].fotos).toHaveLength(1);
    expect(result.current.liquidacion!.cobros[0].fotos[0].dataUrl).toBe('data:image/jpeg;base64,x2');
  });
});

// ── Viaticos ─────────────────────────────────────────────────

describe('useLiquidacion — viaticos', () => {
  it('agregarDia agrega un dia vacio', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarDia('Lunes 09/06'); });
    expect(result.current.liquidacion!.dias).toHaveLength(1);
    expect(result.current.liquidacion!.dias[0].label).toBe('Lunes 09/06');
    expect(result.current.liquidacion!.dias[0].gastos).toHaveLength(0);
  });

  it('actualizarDia cambia el label', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarDia('Dia 1'); });
    const id = result.current.liquidacion!.dias[0].id;
    act(() => { result.current.actualizarDia(id, 'Lunes'); });
    expect(result.current.liquidacion!.dias[0].label).toBe('Lunes');
  });

  it('eliminarDia borra el dia y sus gastos', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarDia('Dia A'); });
    act(() => { result.current.agregarDia('Dia B'); });
    const idA = result.current.liquidacion!.dias[0].id;
    act(() => { result.current.eliminarDia(idA); });
    expect(result.current.liquidacion!.dias).toHaveLength(1);
    expect(result.current.liquidacion!.dias[0].label).toBe('Dia B');
  });

  it('agregarGasto agrega una linea al dia', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarDia('Lunes'); });
    const diaId = result.current.liquidacion!.dias[0].id;
    act(() => { result.current.agregarGasto(diaId, 'Taxi aeropuerto', 35); });
    expect(result.current.liquidacion!.dias[0].gastos).toHaveLength(1);
    expect(result.current.liquidacion!.dias[0].gastos[0].descripcion).toBe('Taxi aeropuerto');
    expect(result.current.liquidacion!.dias[0].gastos[0].monto).toBe(35);
  });

  it('actualizarGasto modifica descripcion y monto', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarDia('Lunes'); });
    const diaId = result.current.liquidacion!.dias[0].id;
    act(() => { result.current.agregarGasto(diaId, 'Taxi', 20); });
    const gastoId = result.current.liquidacion!.dias[0].gastos[0].id;
    act(() => { result.current.actualizarGasto(diaId, gastoId, { monto: 30, descripcion: 'Taxi Uber' }); });
    const g = result.current.liquidacion!.dias[0].gastos[0];
    expect(g.monto).toBe(30);
    expect(g.descripcion).toBe('Taxi Uber');
  });

  it('eliminarGasto quita la linea del dia', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarDia('Lunes'); });
    const diaId = result.current.liquidacion!.dias[0].id;
    act(() => { result.current.agregarGasto(diaId, 'Taxi', 20); });
    act(() => { result.current.agregarGasto(diaId, 'Almuerzo', 15); });
    const g0id = result.current.liquidacion!.dias[0].gastos[0].id;
    act(() => { result.current.eliminarGasto(diaId, g0id); });
    expect(result.current.liquidacion!.dias[0].gastos).toHaveLength(1);
    expect(result.current.liquidacion!.dias[0].gastos[0].descripcion).toBe('Almuerzo');
  });
});

// ── General ──────────────────────────────────────────────────

describe('useLiquidacion — general', () => {
  it('setFondoAsignado actualiza el monto del fondo', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.setFondoAsignado(150); });
    expect(result.current.liquidacion!.fondoAsignado).toBe(150);
  });

  it('setNotas actualiza las notas', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.setNotas('Ruta sur completa'); });
    expect(result.current.liquidacion!.notas).toBe('Ruta sur completa');
  });
});

// ── Totales ──────────────────────────────────────────────────

describe('useLiquidacion — totales', () => {
  it('calcula totales con solo cobros', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarCobro('A'); });
    act(() => { result.current.agregarCobro('B'); });
    const [idA, idB] = result.current.liquidacion!.cobros.map(c => c.id);
    act(() => { result.current.actualizarCobro(idA, { efectivo: 200, yape: 50 }); });
    act(() => { result.current.actualizarCobro(idB, { efectivo: 100, yape: 0  }); });
    const t = result.current.totales;
    expect(t.totalEfectivo).toBe(300);
    expect(t.totalYape).toBe(50);
    expect(t.totalRecaudado).toBe(350);
    expect(t.tieneCobros).toBe(true);
    expect(t.tieneFondo).toBe(false);
    expect(t.saldoViaticos).toBeNull();
    expect(t.efectivoNetoEntregar).toBe(300);
  });

  it('calcula totales con fondo que cubre los gastos', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.setFondoAsignado(100); });
    act(() => { result.current.agregarCobro('A'); });
    const idA = result.current.liquidacion!.cobros[0].id;
    act(() => { result.current.actualizarCobro(idA, { efectivo: 300 }); });
    act(() => { result.current.agregarDia('Dia 1'); });
    const diaId = result.current.liquidacion!.dias[0].id;
    act(() => { result.current.agregarGasto(diaId, 'Taxi', 80); });
    const t = result.current.totales;
    expect(t.totalGastado).toBe(80);
    expect(t.saldoViaticos).toBe(20);
    expect(t.tieneGastos).toBe(true);
    expect(t.tieneFondo).toBe(true);
    // 300 efectivo + 20 sobrante del fondo
    expect(t.efectivoNetoEntregar).toBe(320);
  });

  it('calcula totales cuando gastos exceden el fondo', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.setFondoAsignado(100); });
    act(() => { result.current.agregarCobro('A'); });
    const idA = result.current.liquidacion!.cobros[0].id;
    act(() => { result.current.actualizarCobro(idA, { efectivo: 300 }); });
    act(() => { result.current.agregarDia('Dia 1'); });
    const diaId = result.current.liquidacion!.dias[0].id;
    act(() => { result.current.agregarGasto(diaId, 'Taxi', 130); });
    const t = result.current.totales;
    expect(t.saldoViaticos).toBe(-30);
    // 300 efectivo − 30 deficit del fondo
    expect(t.efectivoNetoEntregar).toBe(270);
  });

  it('sin fondo: efectivoNetoEntregar es igual a totalEfectivo', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarCobro('A'); });
    const id = result.current.liquidacion!.cobros[0].id;
    act(() => { result.current.actualizarCobro(id, { efectivo: 500 }); });
    act(() => { result.current.agregarDia('Dia 1'); });
    const diaId = result.current.liquidacion!.dias[0].id;
    act(() => { result.current.agregarGasto(diaId, 'Almuerzo', 40); });
    const t = result.current.totales;
    expect(t.tieneFondo).toBe(false);
    expect(t.saldoViaticos).toBeNull();
    expect(t.efectivoNetoEntregar).toBe(500);
  });

  it('totales vacio cuando no hay liquidacion cargada aun', () => {
    const { result } = renderHook(() => useLiquidacion());
    expect(result.current.totales.totalRecaudado).toBe(0);
    expect(result.current.totales.saldoViaticos).toBeNull();
  });
});

// ── Persistencia ─────────────────────────────────────────────

describe('useLiquidacion — persistencia', () => {
  it('auto-guarda en IndexedDB al modificar cobros', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.agregarCobro('Luis'); });
    await waitFor(async () => {
      const guardado = await liqGet(keyHoy) as Liquidacion;
      expect(guardado?.cobros).toHaveLength(1);
    });
  });

  it('auto-guarda el fondo asignado', async () => {
    const { result } = renderHook(() => useLiquidacion());
    await esperarDB(result);
    act(() => { result.current.setFondoAsignado(250); });
    await waitFor(async () => {
      const guardado = await liqGet(keyHoy) as Liquidacion;
      expect(guardado?.fondoAsignado).toBe(250);
    });
  });
});
