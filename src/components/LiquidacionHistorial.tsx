import { useState } from 'react';
import type { Liquidacion } from '../types/liquidacion';
import { useLiquidacionHistorial } from '../hooks/useLiquidacionHistorial';
import { exportarLiquidacionPDF } from '../utils/liquidacion-pdf';
import { formatSoles } from '../utils/format';

// ── Cálculo de totales (mismo algoritmo que useLiquidacion) ──

function calcTotales(liq: Liquidacion) {
  const { cobros, dias, fondoAsignado } = liq;
  const totalEfectivo        = cobros.reduce((s, c) => s + (c.efectivo || 0), 0);
  const totalYape            = cobros.reduce((s, c) => s + (c.yape    || 0), 0);
  const totalRecaudado       = totalEfectivo + totalYape;
  const totalGastado         = dias.flatMap(d => d.gastos).reduce((s, g) => s + (g.monto || 0), 0);
  const tieneFondo           = fondoAsignado > 0;
  const saldoViaticos        = tieneFondo ? fondoAsignado - totalGastado : null;
  const efectivoNetoEntregar = tieneFondo
    ? Math.max(0, totalEfectivo + (saldoViaticos ?? 0))
    : totalEfectivo;
  return {
    totalEfectivo, totalYape, totalRecaudado, totalGastado,
    tieneFondo, saldoViaticos, efectivoNetoEntregar,
    tieneCobros: cobros.length > 0,
    tieneGastos: dias.some(d => d.gastos.length > 0),
  };
}

function fechaLarga(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Tarjeta de un día ─────────────────────────────────────────

function DiaCard({ liq }: { liq: Liquidacion }) {
  const [abierto, setAbierto] = useState(false);
  const tot = calcTotales(liq);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Cabecera clicable */}
      <button
        onClick={() => setAbierto(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div>
          <p className="text-sm font-bold text-gray-800 capitalize">{fechaLarga(liq.fecha)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {tot.tieneCobros
              ? `${liq.cobros.length} cobro${liq.cobros.length > 1 ? 's' : ''} · recaudado ${formatSoles(tot.totalRecaudado)}`
              : 'Sin cobros'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {liq.guardada && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
              Guardada
            </span>
          )}
          <span className="text-lg font-bold text-[#1a3a6b]">
            {formatSoles(tot.efectivoNetoEntregar)}
          </span>
          <span className="text-gray-400 text-xs">{abierto ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Detalle expandido */}
      {abierto && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">

          {/* Cobros */}
          {tot.tieneCobros && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                Cobros a clientes
              </p>
              <div className="space-y-1.5">
                {liq.cobros.map(c => (
                  <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-800 truncate block">{c.nombre || 'Sin nombre'}</span>
                      {c.comentario && (
                        <span className="text-xs text-gray-400 italic">{c.comentario}</span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {c.efectivo > 0 && (
                        <p className="text-xs text-emerald-700 font-semibold">Ef. {formatSoles(c.efectivo)}</p>
                      )}
                      {c.yape > 0 && (
                        <p className="text-xs text-violet-700 font-semibold">Yape {formatSoles(c.yape)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gastos */}
          {tot.tieneGastos && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                Gastos de viaticos
              </p>
              <div className="space-y-1">
                {liq.dias.flatMap(d =>
                  d.gastos.map(g => (
                    <div key={g.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate">{g.descripcion || '—'}</span>
                      <span className="font-semibold text-amber-700 shrink-0">{formatSoles(g.monto)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Notas */}
          {liq.notas.trim() && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Notas</p>
              <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3">{liq.notas}</p>
            </div>
          )}

          {/* Resumen */}
          <div className="bg-[#1a3a6b] rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">Resumen</p>
            {tot.tieneCobros && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Efectivo cobrado</span>
                  <span className="font-bold text-white">{formatSoles(tot.totalEfectivo)}</span>
                </div>
                {tot.totalYape > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Yape / Plin</span>
                    <span className="font-bold text-white">{formatSoles(tot.totalYape)}</span>
                  </div>
                )}
              </>
            )}
            {tot.tieneGastos && (
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Total gastado</span>
                <span className="font-bold text-amber-300">{formatSoles(tot.totalGastado)}</span>
              </div>
            )}
            <div className="border-t border-white/20 pt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-white">Efectivo a entregar</span>
              <span className="text-lg font-extrabold text-white">{formatSoles(tot.efectivoNetoEntregar)}</span>
            </div>
          </div>

          {/* Boton PDF */}
          <button
            onClick={() => exportarLiquidacionPDF(liq, { ...tot, saldoViaticos: tot.saldoViaticos })}
            className="w-full text-xs font-bold text-[#1a3a6b] border border-[#1a3a6b]/20 rounded-xl py-2.5 hover:bg-blue-50 transition-colors"
          >
            Exportar PDF
          </button>
        </div>
      )}
    </div>
  );
}

// ── Vista principal del historial ──────────────────────────────

export function LiquidacionHistorial() {
  const { historial, cargando, recargar } = useLiquidacionHistorial();

  return (
    <div className="space-y-3">

      {/* Cabecera con boton de recarga */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">
          Liquidaciones guardadas
        </p>
        <button
          onClick={recargar}
          disabled={cargando}
          aria-label="Recargar historial"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#1a3a6b] hover:bg-blue-50 px-2.5 py-1.5 rounded-xl border border-gray-200 transition-colors disabled:opacity-40"
        >
          <span className={cargando ? 'animate-spin inline-block' : ''}>↻</span>
          {cargando ? 'Cargando...' : 'Recargar'}
        </button>
      </div>

      {/* Estado de carga */}
      {cargando && (
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
          Cargando historial...
        </div>
      )}

      {/* Estado vacío */}
      {!cargando && historial.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-center px-8">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-gray-400 text-sm font-medium">Sin liquidaciones guardadas</p>
          <p className="text-gray-300 text-xs mt-1">Las liquidaciones guardadas aparecerán aquí</p>
        </div>
      )}

      {/* Lista */}
      {!cargando && historial.map(liq => (
        <DiaCard key={liq.id} liq={liq} />
      ))}

    </div>
  );
}
