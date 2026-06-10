import type { DiaViatico, GastoLinea } from '../types/liquidacion';
import { formatSoles } from '../utils/format';

// ── Fila de gasto ────────────────────────────────────────────

interface GastoRowProps {
  gasto: GastoLinea;
  onActualizar: (campos: Partial<Pick<GastoLinea, 'descripcion' | 'monto'>>) => void;
  onEliminar: () => void;
}

function GastoRow({ gasto, onActualizar, onEliminar }: GastoRowProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={gasto.descripcion}
        placeholder="Descripcion del gasto"
        onChange={e => onActualizar({ descripcion: e.target.value })}
        aria-label="Descripcion del gasto"
        className="flex-1 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] placeholder-gray-300 transition"
      />
      <div className="relative w-28 shrink-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
          S/.
        </span>
        <input
          type="number"
          min="0"
          step="0.10"
          value={gasto.monto === 0 ? '' : gasto.monto}
          placeholder="0.00"
          onChange={e => onActualizar({ monto: parseFloat(e.target.value) || 0 })}
          aria-label="Monto del gasto"
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition"
        />
      </div>
      <button
        onClick={onEliminar}
        aria-label="Eliminar gasto"
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors text-sm"
      >
        &times;
      </button>
    </div>
  );
}

// ── Tarjeta de dia ───────────────────────────────────────────

interface DiaCardProps {
  dia: DiaViatico;
  onActualizarLabel: (label: string) => void;
  onEliminar: () => void;
  onAgregarGasto: (descripcion: string, monto: number) => void;
  onActualizarGasto: (gastoId: string, campos: Partial<Pick<GastoLinea, 'descripcion' | 'monto'>>) => void;
  onEliminarGasto: (gastoId: string) => void;
}

function DiaCard({
  dia,
  onActualizarLabel,
  onEliminar,
  onAgregarGasto,
  onActualizarGasto,
  onEliminarGasto,
}: DiaCardProps) {
  const subtotal = dia.gastos.reduce((s, g) => s + (g.monto || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">

      {/* Etiqueta del dia + eliminar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={dia.label}
          placeholder="Ej: Lunes 09/06"
          onChange={e => onActualizarLabel(e.target.value)}
          aria-label="Etiqueta del dia"
          className="flex-1 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] placeholder-gray-300 transition"
        />
        <button
          onClick={onEliminar}
          aria-label="Eliminar dia"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors text-sm"
        >
          &times;
        </button>
      </div>

      {/* Lista de gastos */}
      {dia.gastos.length > 0 && (
        <div className="space-y-2">
          {dia.gastos.map(gasto => (
            <GastoRow
              key={gasto.id}
              gasto={gasto}
              onActualizar={campos => onActualizarGasto(gasto.id, campos)}
              onEliminar={() => onEliminarGasto(gasto.id)}
            />
          ))}
        </div>
      )}

      {/* Boton agregar gasto + subtotal */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => onAgregarGasto('', 0)}
          className="text-xs font-bold text-[#1a3a6b] hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors"
        >
          + Agregar gasto
        </button>
        {subtotal > 0 && (
          <p className="text-xs text-gray-400">
            Subtotal:&nbsp;
            <span className="font-extrabold text-gray-700">{formatSoles(subtotal)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Modulo de viaticos ───────────────────────────────────────

interface Props {
  dias: DiaViatico[];
  fondoAsignado: number;
  totalGastado: number;
  saldoViaticos: number | null;
  tieneFondo: boolean;
  onAgregarDia: () => void;
  onActualizarDia: (id: string, label: string) => void;
  onEliminarDia: (id: string) => void;
  onAgregarGasto: (diaId: string, descripcion: string, monto: number) => void;
  onActualizarGasto: (diaId: string, gastoId: string, campos: Partial<Pick<GastoLinea, 'descripcion' | 'monto'>>) => void;
  onEliminarGasto: (diaId: string, gastoId: string) => void;
  onSetFondoAsignado: (monto: number) => void;
}

export function ViaticosModule({
  dias,
  fondoAsignado,
  totalGastado,
  saldoViaticos,
  tieneFondo,
  onAgregarDia,
  onActualizarDia,
  onEliminarDia,
  onAgregarGasto,
  onActualizarGasto,
  onEliminarGasto,
  onSetFondoAsignado,
}: Props) {
  return (
    <section className="space-y-3">

      {/* Fondo de viaticos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
          Fondo asignado
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
            S/.
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={fondoAsignado === 0 ? '' : fondoAsignado}
            placeholder="0.00"
            onChange={e => onSetFondoAsignado(parseFloat(e.target.value) || 0)}
            aria-label="Fondo de viaticos asignado"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition"
          />
        </div>
        {!tieneFondo && (
          <p className="mt-1.5 text-[11px] text-gray-400">
            Sin fondo asignado — los gastos no afectan el efectivo a entregar.
          </p>
        )}
      </div>

      {/* Encabezado de dias */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-gray-600 uppercase tracking-wide">
          Dias y gastos
        </h3>
        <button
          onClick={onAgregarDia}
          className="flex items-center gap-1 text-xs font-bold text-[#1a3a6b] hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors"
        >
          <span className="text-base leading-none">+</span> Agregar dia
        </button>
      </div>

      {/* Estado vacio */}
      {dias.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Sin dias registrados</p>
          <p className="text-xs mt-1">Toca &ldquo;+ Agregar dia&rdquo; para empezar</p>
        </div>
      )}

      {/* Lista de tarjetas */}
      {dias.map(dia => (
        <DiaCard
          key={dia.id}
          dia={dia}
          onActualizarLabel={label => onActualizarDia(dia.id, label)}
          onEliminar={() => onEliminarDia(dia.id)}
          onAgregarGasto={(desc, monto) => onAgregarGasto(dia.id, desc, monto)}
          onActualizarGasto={(gastoId, campos) => onActualizarGasto(dia.id, gastoId, campos)}
          onEliminarGasto={gastoId => onEliminarGasto(dia.id, gastoId)}
        />
      ))}

      {/* Resumen de viaticos */}
      {(dias.length > 0 || tieneFondo) && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-2">
          {tieneFondo && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Fondo asignado</span>
              <span className="font-extrabold text-gray-700">{formatSoles(fondoAsignado)}</span>
            </div>
          )}
          {totalGastado > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total gastado</span>
              <span className="font-extrabold text-amber-700">{formatSoles(totalGastado)}</span>
            </div>
          )}
          {tieneFondo && saldoViaticos !== null && (
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">
                {saldoViaticos >= 0 ? 'Sobrante del fondo' : 'Deficit del fondo'}
              </span>
              <span className={`text-sm font-extrabold ${saldoViaticos >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {formatSoles(Math.abs(saldoViaticos))}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
