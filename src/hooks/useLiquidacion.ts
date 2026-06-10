import { useState, useMemo, useEffect } from 'react';
import type {
  Liquidacion, LiquidacionTotales,
  CobroCliente, DiaViatico, GastoLinea, FotoEvidencia,
} from '../types/liquidacion';
import { liqGet, liqSet } from '../utils/db';

function getFechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function crearVacia(fecha: string): Liquidacion {
  return { id: `liq-${fecha}`, fecha, cobros: [], dias: [], fondoAsignado: 0, notas: '' };
}

function calcTotales(liq: Liquidacion): LiquidacionTotales {
  const { cobros, dias, fondoAsignado } = liq;
  const totalEfectivo  = cobros.reduce((s, c) => s + (c.efectivo || 0), 0);
  const totalYape      = cobros.reduce((s, c) => s + (c.yape    || 0), 0);
  const totalRecaudado = totalEfectivo + totalYape;
  const totalGastado   = dias.flatMap(d => d.gastos).reduce((s, g) => s + (g.monto || 0), 0);
  const tieneCobros    = cobros.length > 0;
  const tieneGastos    = dias.some(d => d.gastos.length > 0);
  const tieneFondo     = fondoAsignado > 0;
  const saldoViaticos  = tieneFondo ? fondoAsignado - totalGastado : null;
  // efectivo a entregar = cobros en efectivo + sobrante del fondo (o − déficit del fondo)
  const efectivoNetoEntregar = tieneFondo
    ? Math.max(0, totalEfectivo + saldoViaticos!)
    : totalEfectivo;
  return { totalEfectivo, totalYape, totalRecaudado, totalGastado, tieneCobros, tieneGastos, tieneFondo, saldoViaticos, efectivoNetoEntregar };
}

const TOTALES_VACIO: LiquidacionTotales = {
  totalEfectivo: 0, totalYape: 0, totalRecaudado: 0, totalGastado: 0,
  saldoViaticos: null, efectivoNetoEntregar: 0,
  tieneCobros: false, tieneGastos: false, tieneFondo: false,
};

export function useLiquidacion() {
  const [liquidacion, setLiquidacion] = useState<Liquidacion | null>(null);
  const [_dbListo, _setDbListo] = useState(false);

  // Carga o inicializa la liquidación de hoy desde IndexedDB
  useEffect(() => {
    let activo = true;
    const fecha = getFechaHoy();
    liqGet(`liq-${fecha}`).then(raw => {
      if (!activo) return;
      setLiquidacion(raw ? (raw as Liquidacion) : crearVacia(fecha));
      _setDbListo(true);
    }).catch(() => {
      if (activo) { setLiquidacion(crearVacia(getFechaHoy())); _setDbListo(true); }
    });
    return () => { activo = false; };
  }, []);

  // Persiste cada cambio en IndexedDB
  useEffect(() => {
    if (_dbListo && liquidacion) {
      liqSet(liquidacion as unknown as Record<string, unknown>).catch(() => {});
    }
  }, [liquidacion, _dbListo]);

  const totales: LiquidacionTotales = useMemo(
    () => liquidacion ? calcTotales(liquidacion) : TOTALES_VACIO,
    [liquidacion],
  );

  // ── Cobros ──────────────────────────────────────────────────

  function agregarCobro(nombre: string): void {
    const nuevo: CobroCliente = { id: genId(), nombre, efectivo: 0, yape: 0, fotos: [] };
    setLiquidacion(prev => prev ? { ...prev, cobros: [...prev.cobros, nuevo] } : prev);
  }

  function actualizarCobro(id: string, campos: Partial<Pick<CobroCliente, 'nombre' | 'efectivo' | 'yape'>>): void {
    setLiquidacion(prev => prev
      ? { ...prev, cobros: prev.cobros.map(c => c.id === id ? { ...c, ...campos } : c) }
      : prev);
  }

  function eliminarCobro(id: string): void {
    setLiquidacion(prev => prev ? { ...prev, cobros: prev.cobros.filter(c => c.id !== id) } : prev);
  }

  function agregarFoto(cobroId: string, dataUrl: string): void {
    const foto: FotoEvidencia = { id: genId(), dataUrl, timestamp: new Date().toISOString() };
    setLiquidacion(prev => prev
      ? { ...prev, cobros: prev.cobros.map(c => c.id === cobroId ? { ...c, fotos: [...c.fotos, foto] } : c) }
      : prev);
  }

  function eliminarFoto(cobroId: string, fotoId: string): void {
    setLiquidacion(prev => prev
      ? { ...prev, cobros: prev.cobros.map(c => c.id === cobroId
          ? { ...c, fotos: c.fotos.filter(f => f.id !== fotoId) }
          : c
        ) }
      : prev);
  }

  // ── Viáticos ────────────────────────────────────────────────

  function agregarDia(label: string): void {
    const nuevo: DiaViatico = { id: genId(), label, gastos: [] };
    setLiquidacion(prev => prev ? { ...prev, dias: [...prev.dias, nuevo] } : prev);
  }

  function actualizarDia(id: string, label: string): void {
    setLiquidacion(prev => prev
      ? { ...prev, dias: prev.dias.map(d => d.id === id ? { ...d, label } : d) }
      : prev);
  }

  function eliminarDia(id: string): void {
    setLiquidacion(prev => prev ? { ...prev, dias: prev.dias.filter(d => d.id !== id) } : prev);
  }

  function agregarGasto(diaId: string, descripcion: string, monto: number): void {
    const nuevo: GastoLinea = { id: genId(), descripcion, monto };
    setLiquidacion(prev => prev
      ? { ...prev, dias: prev.dias.map(d => d.id === diaId ? { ...d, gastos: [...d.gastos, nuevo] } : d) }
      : prev);
  }

  function actualizarGasto(diaId: string, gastoId: string, campos: Partial<Pick<GastoLinea, 'descripcion' | 'monto'>>): void {
    setLiquidacion(prev => prev
      ? { ...prev, dias: prev.dias.map(d => d.id === diaId
          ? { ...d, gastos: d.gastos.map(g => g.id === gastoId ? { ...g, ...campos } : g) }
          : d
        ) }
      : prev);
  }

  function eliminarGasto(diaId: string, gastoId: string): void {
    setLiquidacion(prev => prev
      ? { ...prev, dias: prev.dias.map(d => d.id === diaId
          ? { ...d, gastos: d.gastos.filter(g => g.id !== gastoId) }
          : d
        ) }
      : prev);
  }

  // ── General ─────────────────────────────────────────────────

  function setFondoAsignado(monto: number): void {
    setLiquidacion(prev => prev ? { ...prev, fondoAsignado: monto } : prev);
  }

  function setNotas(notas: string): void {
    setLiquidacion(prev => prev ? { ...prev, notas } : prev);
  }

  return {
    liquidacion,
    totales,
    _dbListo,
    agregarCobro,
    actualizarCobro,
    eliminarCobro,
    agregarFoto,
    eliminarFoto,
    agregarDia,
    actualizarDia,
    eliminarDia,
    agregarGasto,
    actualizarGasto,
    eliminarGasto,
    setFondoAsignado,
    setNotas,
  };
}
