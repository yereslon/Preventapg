import { useRef, useState, useCallback } from 'react';
import type { CobroCliente, FotoEvidencia } from '../types/liquidacion';
import type { ClienteRegistrado } from '../types/clients';
import { comprimirImagenes } from '../utils/imagen';
import { formatSoles } from '../utils/format';
import { ModalPickCliente } from './ModalPickCliente';

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
  onCambiarCliente: () => void;
}

function CobroCard({ cobro, onActualizar, onEliminar, onAgregarFoto, onEliminarFoto, onCambiarCliente }: CobroCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [verFotos, setVerFotos] = useState(false);
  const [verComentario, setVerComentario] = useState(false);

  const tienesFotos      = cobro.fotos.length > 0;
  const tieneComentario  = !!cobro.comentario?.trim();
  const mostrarFotos     = verFotos || tienesFotos;
  const mostrarComentario = verComentario || tieneComentario;
  const subtotal         = cobro.efectivo + cobro.yape;

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

  function handleToggleFotos() {
    if (!mostrarFotos) {
      setVerFotos(true);
      setTimeout(() => fileRef.current?.click(), 50);
    } else {
      setVerFotos(f => !f);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Cabecera: nombre del cliente + eliminar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={onCambiarCliente}
          className="flex-1 min-w-0 text-left group"
        >
          {cobro.nombre
            ? <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#1a3a6b] transition-colors">
                {cobro.nombre}
              </p>
            : <p className="text-sm text-gray-300 font-normal">Seleccionar cliente...</p>
          }
          {subtotal > 0 && (
            <p className="text-[11px] font-extrabold text-[#1a3a6b]/60 mt-0.5 tabular-nums">
              {formatSoles(subtotal)}
            </p>
          )}
        </button>
        <button
          onClick={onEliminar}
          aria-label={`Eliminar cobro de ${cobro.nombre || 'cliente'}`}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {/* Montos — Efectivo y Yape con fondo de color */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2.5">

        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-[9px] font-extrabold tracking-widest uppercase text-emerald-600 mb-2">
            Efectivo
          </p>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500 pointer-events-none select-none">
              S/.
            </span>
            <input
              type="number"
              min="0"
              step="0.10"
              inputMode="decimal"
              value={cobro.efectivo === 0 ? '' : cobro.efectivo}
              placeholder="0.00"
              onChange={e => onActualizar({ efectivo: parseFloat(e.target.value) || 0 })}
              aria-label="Monto en efectivo"
              className="w-full pl-9 pr-2 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="bg-violet-50 rounded-xl p-3">
          <p className="text-[9px] font-extrabold tracking-widest uppercase text-violet-600 mb-2">
            Yape / Plin
          </p>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-violet-500 pointer-events-none select-none">
              S/.
            </span>
            <input
              type="number"
              min="0"
              step="0.10"
              inputMode="decimal"
              value={cobro.yape === 0 ? '' : cobro.yape}
              placeholder="0.00"
              onChange={e => onActualizar({ yape: parseFloat(e.target.value) || 0 })}
              aria-label="Monto por Yape o Plin"
              className="w-full pl-9 pr-2 py-2 bg-white border border-violet-200 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition placeholder:text-gray-300"
            />
          </div>
        </div>

      </div>

      {/* Evidencia (expandible) */}
      {mostrarFotos && (
        <div className="px-4 pb-3 pt-3 border-t border-gray-50">
          <p className="text-[9px] font-extrabold tracking-widest uppercase text-gray-400 mb-2">
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
              aria-label="Adjuntar foto"
              className={`h-16 px-4 rounded-xl border-2 border-dashed text-xs font-semibold transition-colors active:scale-95 ${
                subiendo
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-200 text-gray-400 hover:border-[#1a3a6b] hover:text-[#1a3a6b]'
              }`}
            >
              {subiendo ? '...' : '+ Foto'}
            </button>
          </div>
        </div>
      )}

      {/* Comentario (expandible) */}
      {mostrarComentario && (
        <div className="px-4 pb-3 pt-3 border-t border-gray-50">
          <textarea
            value={cobro.comentario ?? ''}
            placeholder="Nota sobre este cobro (aparece en el PDF)..."
            onChange={e => onActualizar({ comentario: e.target.value })}
            rows={2}
            className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] placeholder-gray-300 transition"
          />
        </div>
      )}

      {/* Barra de acciones */}
      <div className="px-3 py-2.5 border-t border-gray-50 flex items-center gap-1">
        <button
          onClick={handleToggleFotos}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tienesFotos
              ? 'bg-blue-50 text-[#1a3a6b]'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span aria-hidden>📷</span>
          {tienesFotos ? `${cobro.fotos.length} foto${cobro.fotos.length > 1 ? 's' : ''}` : 'Foto'}
        </button>
        <button
          onClick={() => setVerComentario(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tieneComentario
              ? 'bg-blue-50 text-[#1a3a6b]'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span aria-hidden>💬</span>
          Nota
        </button>
        {subtotal > 0 && (
          <span className="ml-auto text-xs font-extrabold text-gray-600 tabular-nums">
            = {formatSoles(subtotal)}
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) handleArchivos(e.target.files); }}
      />
    </div>
  );
}

// ── Modulo de cobros ─────────────────────────────────────────

interface Props {
  cobros: CobroCliente[];
  clientes: ClienteRegistrado[];
  onAgregarCobro: (nombre: string) => void;
  onActualizarCobro: (id: string, campos: Partial<Pick<CobroCliente, 'nombre' | 'efectivo' | 'yape' | 'comentario'>>) => void;
  onEliminarCobro: (id: string) => void;
  onAgregarFoto: (cobroId: string, dataUrl: string) => void;
  onEliminarFoto: (cobroId: string, fotoId: string) => void;
  totalEfectivo: number;
  totalYape: number;
  onImportarPedidos?: () => Promise<number>;
}

type ModalState = { modo: 'nuevo' } | { modo: 'editar'; cobroId: string } | null;

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
  const [modalCliente, setModalCliente] = useState<ModalState>(null);

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

  function handleSeleccionarCliente(cliente: ClienteRegistrado) {
    if (!modalCliente) return;
    if (modalCliente.modo === 'nuevo') {
      onAgregarCobro(cliente.nombre);
    } else {
      onActualizarCobro(modalCliente.cobroId, { nombre: cliente.nombre });
    }
    setModalCliente(null);
  }

  return (
    <section className="space-y-3">

      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">
          Cobros a clientes
        </h3>
        <div className="flex items-center gap-2">
          {onImportarPedidos && (
            <button
              onClick={handleImportar}
              disabled={importando}
              className="text-xs font-semibold text-gray-400 hover:text-[#1a3a6b] hover:bg-blue-50 px-2.5 py-1.5 rounded-xl border border-gray-200 transition-colors disabled:opacity-40"
            >
              {importando ? 'Importando...' : '⬇ Pedidos del dia'}
            </button>
          )}
          <button
            onClick={() => setModalCliente({ modo: 'nuevo' })}
            className="flex items-center gap-1 text-xs font-bold text-[#1a3a6b] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <span className="text-base leading-none">+</span> Agregar cobro
          </button>
        </div>
      </div>

      {/* Feedback de importacion */}
      {feedback && (
        <p className="text-xs text-center text-gray-500 bg-gray-50 rounded-xl py-2 border border-gray-100">
          {feedback}
        </p>
      )}

      {/* Estado vacio */}
      {cobros.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-2xl mb-2">💼</p>
          <p className="text-sm font-medium">Sin cobros registrados</p>
          <p className="text-xs mt-1 text-gray-300">Toca &ldquo;+ Agregar cobro&rdquo; para empezar</p>
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
          onCambiarCliente={() => setModalCliente({ modo: 'editar', cobroId: cobro.id })}
        />
      ))}

      {/* Resumen de totales */}
      {cobros.length > 0 && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 text-xs">Total efectivo</span>
            <span className="font-extrabold text-emerald-700 tabular-nums">{formatSoles(totalEfectivo)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 text-xs">Total Yape / Plin</span>
            <span className="font-extrabold text-violet-700 tabular-nums">{formatSoles(totalYape)}</span>
          </div>
          {(totalEfectivo > 0 || totalYape > 0) && (
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Total recaudado</span>
              <span className="text-sm font-extrabold text-gray-900 tabular-nums">
                {formatSoles(totalEfectivo + totalYape)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Modal de seleccion de cliente */}
      {modalCliente && (
        <ModalPickCliente
          clientes={clientes}
          onSeleccionar={handleSeleccionarCliente}
          onCerrar={() => setModalCliente(null)}
        />
      )}
    </section>
  );
}
