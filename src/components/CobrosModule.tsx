import { useRef, useState, useCallback } from 'react';
import type { CobroCliente, FotoEvidencia } from '../types/liquidacion';
import type { ClienteRegistrado } from '../types/clients';
import { comprimirImagenes } from '../utils/imagen';
import { formatSoles } from '../utils/format';

// ── Miniatura de foto de evidencia ───────────────────────────

function FotoThumb({ foto, onEliminar }: { foto: FotoEvidencia; onEliminar: () => void }) {
  return (
    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden group cursor-pointer">
      <img
        src={foto.dataUrl}
        alt="Evidencia"
        className="h-full w-full object-cover"
        onClick={() => window.open(foto.dataUrl, '_blank')}
      />
      <button
        onClick={e => { e.stopPropagation(); onEliminar(); }}
        aria-label="Eliminar foto de evidencia"
        className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all"
      >
        <span className="text-white text-sm font-black opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
          &times;
        </span>
      </button>
    </div>
  );
}

// ── Tarjeta de cobro ─────────────────────────────────────────

interface CobroCardProps {
  cobro: CobroCliente;
  onActualizar: (campos: Partial<Pick<CobroCliente, 'nombre' | 'efectivo' | 'yape' | 'comentario'>>) => void;
  onEliminar: () => void;
  onAgregarFoto: (dataUrl: string) => void;
  onEliminarFoto: (fotoId: string) => void;
}

function CobroCard({ cobro, onActualizar, onEliminar, onAgregarFoto, onEliminarFoto }: CobroCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function handleArchivos(files: FileList) {
    setSubiendo(true);
    try {
      const urls = await comprimirImagenes(files);
      urls.forEach(url => onAgregarFoto(url));
    } finally {
      setSubiendo(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const subtotal = cobro.efectivo + cobro.yape;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">

      {/* Nombre + eliminar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          list="liq-clientes-list"
          value={cobro.nombre}
          placeholder="Nombre del cliente"
          onChange={e => onActualizar({ nombre: e.target.value })}
          aria-label="Nombre del cliente"
          className="flex-1 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] placeholder-gray-300 transition"
        />
        <button
          onClick={onEliminar}
          aria-label={`Eliminar cobro de ${cobro.nombre || 'cliente'}`}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors text-sm"
        >
          &times;
        </button>
      </div>

      {/* Montos */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
            Efectivo
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
              S/.
            </span>
            <input
              type="number"
              min="0"
              step="0.10"
              value={cobro.efectivo === 0 ? '' : cobro.efectivo}
              placeholder="0.00"
              onChange={e => onActualizar({ efectivo: parseFloat(e.target.value) || 0 })}
              aria-label="Monto en efectivo"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
            Yape / Plin
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
              S/.
            </span>
            <input
              type="number"
              min="0"
              step="0.10"
              value={cobro.yape === 0 ? '' : cobro.yape}
              placeholder="0.00"
              onChange={e => onActualizar({ yape: parseFloat(e.target.value) || 0 })}
              aria-label="Monto por Yape o Plin"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Subtotal del cobro */}
      {subtotal > 0 && (
        <p className="text-xs text-right text-gray-400">
          Subtotal:&nbsp;
          <span className="font-extrabold text-gray-700">{formatSoles(subtotal)}</span>
        </p>
      )}

      {/* Fotos de evidencia */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
          Evidencia
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          {cobro.fotos.map(foto => (
            <FotoThumb
              key={foto.id}
              foto={foto}
              onEliminar={() => onEliminarFoto(foto.id)}
            />
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={subiendo}
            aria-label="Adjuntar foto de evidencia"
            className={`h-16 px-3 rounded-xl border-2 border-dashed text-xs font-semibold transition-colors ${
              subiendo
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-gray-300 text-gray-400 hover:border-[#1a3a6b] hover:text-[#1a3a6b] active:scale-95'
            }`}
          >
            {subiendo ? 'Procesando...' : '+ Foto'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files?.length) handleArchivos(e.target.files); }}
          />
        </div>
      </div>

      {/* Comentario */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
          Comentario
        </label>
        <textarea
          value={cobro.comentario ?? ''}
          placeholder="Observacion sobre este cobro (aparece en el PDF)"
          onChange={e => onActualizar({ comentario: e.target.value })}
          rows={2}
          className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] placeholder-gray-300 transition"
        />
      </div>
    </div>
  );
}

// ── Modulo de cobros ─────────────────────────────────────────

interface Props {
  cobros: CobroCliente[];
  clientes: ClienteRegistrado[];
  onAgregarCobro: () => void;
  onActualizarCobro: (id: string, campos: Partial<Pick<CobroCliente, 'nombre' | 'efectivo' | 'yape' | 'comentario'>>) => void;
  onEliminarCobro: (id: string) => void;
  onAgregarFoto: (cobroId: string, dataUrl: string) => void;
  onEliminarFoto: (cobroId: string, fotoId: string) => void;
  totalEfectivo: number;
  totalYape: number;
  onImportarPedidos?: () => Promise<number>;
}

export function CobrosModule({
  cobros,
  clientes,
  onAgregarCobro,
  onActualizarCobro,
  onEliminarCobro,
  onAgregarFoto,
  onEliminarFoto,
  totalEfectivo,
  totalYape,
  onImportarPedidos,
}: Props) {
  const [importando, setImportando] = useState(false);
  const [feedback, setFeedback]     = useState<string | null>(null);

  const handleImportar = useCallback(async () => {
    if (!onImportarPedidos || importando) return;
    setImportando(true);
    setFeedback(null);
    try {
      const n = await onImportarPedidos();
      setFeedback(n === 0 ? 'Sin pedidos nuevos hoy' : `${n} pedido${n > 1 ? 's' : ''} importado${n > 1 ? 's' : ''}`);
    } finally {
      setImportando(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }, [onImportarPedidos, importando]);

  return (
    <section className="space-y-3">

      {/* Encabezado de seccion */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-extrabold text-gray-600 uppercase tracking-wide">
          Cobros a clientes
        </h3>
        <div className="flex items-center gap-2">
          {onImportarPedidos && (
            <button
              onClick={handleImportar}
              disabled={importando}
              className="text-xs font-semibold text-gray-500 hover:text-[#1a3a6b] hover:bg-blue-50 px-2.5 py-1.5 rounded-xl border border-gray-200 transition-colors disabled:opacity-40"
            >
              {importando ? 'Importando...' : '⬇ Pedidos del día'}
            </button>
          )}
          <button
            onClick={onAgregarCobro}
            className="flex items-center gap-1 text-xs font-bold text-[#1a3a6b] hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors"
          >
            <span className="text-base leading-none">+</span> Agregar cobro
          </button>
        </div>
      </div>

      {/* Feedback de importación */}
      {feedback && (
        <p className="text-xs text-center text-gray-500 bg-gray-50 rounded-xl py-2 border border-gray-100">
          {feedback}
        </p>
      )}

      {/* Datalist de clientes para autocompletar */}
      <datalist id="liq-clientes-list">
        {clientes.map(c => (
          <option key={c.nombre} value={c.nombre} />
        ))}
      </datalist>

      {/* Estado vacio */}
      {cobros.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Sin cobros registrados</p>
          <p className="text-xs mt-1">Toca &ldquo;+ Agregar cobro&rdquo; para empezar</p>
        </div>
      )}

      {/* Lista de tarjetas */}
      {cobros.map(cobro => (
        <CobroCard
          key={cobro.id}
          cobro={cobro}
          onActualizar={campos => onActualizarCobro(cobro.id, campos)}
          onEliminar={() => onEliminarCobro(cobro.id)}
          onAgregarFoto={url => onAgregarFoto(cobro.id, url)}
          onEliminarFoto={fotoId => onEliminarFoto(cobro.id, fotoId)}
        />
      ))}

      {/* Resumen de totales */}
      {cobros.length > 0 && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Total efectivo</span>
            <span className="font-extrabold text-emerald-700">{formatSoles(totalEfectivo)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Total Yape / Plin</span>
            <span className="font-extrabold text-violet-700">{formatSoles(totalYape)}</span>
          </div>
          {(totalEfectivo > 0 || totalYape > 0) && (
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Total recaudado</span>
              <span className="text-sm font-extrabold text-gray-900">
                {formatSoles(totalEfectivo + totalYape)}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
