import { useState } from 'react';
import { useLiquidacion } from '../hooks/useLiquidacion';
import { useClientRegistry } from '../hooks/useClientRegistry';
import { CobrosModule } from './CobrosModule';
import { ViaticosModule } from './ViaticosModule';
import { formatSoles } from '../utils/format';
import { exportarLiquidacionPDF } from '../utils/liquidacion-pdf';

type Tab = 'cobros' | 'viaticos';

export function LiquidacionPanel() {
  const [tab, setTab] = useState<Tab>('cobros');

  const { clientes } = useClientRegistry();

  const {
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
    importarPedidosDelDia,
    guardarLiquidacion,
  } = useLiquidacion();

  if (!_dbListo || !liquidacion) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Cargando...
      </div>
    );
  }

  const fechaFormateada = new Date(liquidacion.fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const mostrarResumen = totales.tieneCobros || totales.tieneFondo || totales.tieneGastos;

  return (
    <div className="space-y-4 pb-8">

      {/* Fecha + boton PDF */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-400 font-medium capitalize">{fechaFormateada}</p>
        <button
          onClick={() => exportarLiquidacionPDF(liquidacion, totales)}
          className="text-xs font-bold text-[#1a3a6b] hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-[#1a3a6b]/20 transition-colors"
        >
          Exportar PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        <button
          onClick={() => setTab('cobros')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            tab === 'cobros'
              ? 'bg-white text-[#1a3a6b] shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Cobros
          {totales.tieneCobros && (
            <span className="ml-1.5 text-[10px] font-extrabold text-emerald-600">
              {formatSoles(totales.totalRecaudado)}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('viaticos')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            tab === 'viaticos'
              ? 'bg-white text-[#1a3a6b] shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Viaticos
          {totales.tieneGastos && (
            <span className="ml-1.5 text-[10px] font-extrabold text-amber-600">
              {formatSoles(totales.totalGastado)}
            </span>
          )}
        </button>
      </div>

      {/* Contenido activo */}
      {tab === 'cobros' && (
        <CobrosModule
          cobros={liquidacion.cobros}
          clientes={clientes}
          onAgregarCobro={() => agregarCobro('')}
          onActualizarCobro={actualizarCobro}
          onEliminarCobro={eliminarCobro}
          onAgregarFoto={agregarFoto}
          onEliminarFoto={eliminarFoto}
          totalEfectivo={totales.totalEfectivo}
          totalYape={totales.totalYape}
          onImportarPedidos={importarPedidosDelDia}
        />
      )}

      {tab === 'viaticos' && (
        <ViaticosModule
          dias={liquidacion.dias}
          fondoAsignado={liquidacion.fondoAsignado}
          totalGastado={totales.totalGastado}
          saldoViaticos={totales.saldoViaticos}
          tieneFondo={totales.tieneFondo}
          onAgregarDia={() => agregarDia('')}
          onActualizarDia={actualizarDia}
          onEliminarDia={eliminarDia}
          onAgregarGasto={agregarGasto}
          onActualizarGasto={actualizarGasto}
          onEliminarGasto={eliminarGasto}
          onSetFondoAsignado={setFondoAsignado}
        />
      )}

      {/* Notas del dia */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <label
          htmlFor="liq-notas"
          className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2"
        >
          Notas del dia
        </label>
        <textarea
          id="liq-notas"
          value={liquidacion.notas}
          placeholder="Observaciones, incidencias, rutas..."
          onChange={e => setNotas(e.target.value)}
          rows={3}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] placeholder-gray-300 transition"
        />
      </div>

      {/* Resumen final */}
      {mostrarResumen && (
        <div className="bg-[#1a3a6b] rounded-2xl p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">
            Resumen del dia
          </p>

          {totales.tieneCobros && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">Efectivo cobrado</span>
                <span className="text-sm font-extrabold text-white">
                  {formatSoles(totales.totalEfectivo)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">Yape / Plin</span>
                <span className="text-sm font-extrabold text-white">
                  {formatSoles(totales.totalYape)}
                </span>
              </div>
            </>
          )}

          {totales.tieneFondo && totales.saldoViaticos !== null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">
                {totales.saldoViaticos >= 0 ? 'Sobrante fondo' : 'Deficit fondo'}
              </span>
              <span className={`text-sm font-extrabold ${totales.saldoViaticos >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {totales.saldoViaticos >= 0 ? '+' : '−'}{formatSoles(Math.abs(totales.saldoViaticos))}
              </span>
            </div>
          )}

          {!totales.tieneFondo && totales.tieneGastos && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Total gastado</span>
              <span className="text-sm font-extrabold text-amber-300">
                {formatSoles(totales.totalGastado)}
              </span>
            </div>
          )}

          <div className="border-t border-white/20 pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-white">Efectivo a entregar</span>
            <span className="text-xl font-extrabold text-white">
              {formatSoles(totales.efectivoNetoEntregar)}
            </span>
          </div>
        </div>
      )}

      {/* Boton guardar liquidacion */}
      <button
        onClick={guardarLiquidacion}
        className={`w-full py-3.5 rounded-2xl text-sm font-extrabold tracking-wide transition-all ${
          liquidacion.guardada
            ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-100'
            : 'bg-[#1a3a6b] text-white hover:bg-[#15306b] active:scale-[0.98]'
        }`}
      >
        {liquidacion.guardada ? '✓ Liquidacion guardada — toca para desmarcar' : 'Guardar liquidacion del dia'}
      </button>
    </div>
  );
}
