import { useState } from 'react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import type { OrderSummary } from '../types/order';
import { OrderPDF } from './OrderPDF';
import { urlWhatsApp } from '../utils/whatsapp';
import { formatSoles } from '../utils/format';

interface Props {
  summary: OrderSummary;
  whatsapp: string;
  onNuevoPedido: () => void;
}

// Web Share API soporta archivos en este dispositivo
function puedeCompartirArchivos(): boolean {
  try {
    return typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
  } catch {
    return false;
  }
}

export function ConfirmView({ summary, whatsapp, onNuevoPedido }: Props) {
  const [compartiendo, setCompartiendo] = useState(false);
  const waUrl = urlWhatsApp(whatsapp, summary);
  const soportaShare = puedeCompartirArchivos();

  async function enviarPDFporWhatsApp() {
    setCompartiendo(true);
    try {
      // Generar el PDF como Blob
      const blob = await pdf(<OrderPDF summary={summary} />).toBlob();
      const archivo = new File(
        [blob],
        `pedido-${summary.numeroPedido}.pdf`,
        { type: 'application/pdf' }
      );

      if (navigator.canShare({ files: [archivo] })) {
        // Móvil: abre el selector nativo → usuario elige WhatsApp
        await navigator.share({
          files: [archivo],
          title: `Pedido ${summary.numeroPedido} — Plásticos Guerrero`,
        });
      } else {
        // Fallback: descarga el PDF y abre WhatsApp con el texto
        descargarBlob(blob, archivo.name);
        window.open(waUrl, '_blank');
      }
    } catch (err) {
      // AbortError = usuario cerró el selector, no es error real
      if (err instanceof Error && err.name !== 'AbortError') {
        // Fallback silencioso: descargar
        try {
          const blob = await pdf(<OrderPDF summary={summary} />).toBlob();
          descargarBlob(blob, `pedido-${summary.numeroPedido}.pdf`);
        } catch { /* noop */ }
      }
    } finally {
      setCompartiendo(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-100 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-4">

        {/* ── Confirmación ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-3xl text-green-600 font-bold">
            ✓
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">¡Pedido confirmado!</h1>
            <p className="text-gray-400 text-sm mt-1">{summary.numeroPedido} · {summary.fecha}</p>
          </div>
          <p className="text-gray-600 text-sm">
            Gracias, <strong>{summary.form.nombre}</strong>.
            Tu pedido para <strong>{summary.form.ubicacion}</strong> está listo para enviarse.
          </p>
        </div>

        {/* ── Resumen ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-700">Resumen del pedido</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {summary.items.map(item => (
              <div key={item.id} className="flex justify-between items-center px-5 py-3 text-sm">
                <span className="text-gray-800 font-medium">
                  {item.nombre}
                  <span className="text-gray-400 font-normal ml-1">×{item.cantidad}</span>
                </span>
                <span className="font-bold text-red-700">
                  {formatSoles(item.precio * item.cantidad)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center px-5 py-4 bg-gray-50 border-t border-gray-200">
            <span className="font-bold text-gray-800">Total</span>
            <span className="text-xl font-extrabold text-red-700">{formatSoles(summary.total)}</span>
          </div>
        </div>

        {/* ── Acciones ── */}
        <div className="space-y-3">

          {/* BOTÓN PRINCIPAL: PDF directo a WhatsApp */}
          <button
            onClick={enviarPDFporWhatsApp}
            disabled={compartiendo}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-70"
            style={{ background: compartiendo ? '#1a9e50' : '#25D366' }}
          >
            {compartiendo ? (
              <>
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.549 4.122 1.515 5.858L0 24l6.335-1.491C8.04 23.457 9.983 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.682-.523-5.208-1.432l-.374-.221-3.862.909.976-3.768-.244-.389A9.938 9.938 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                {soportaShare ? 'Enviar PDF por WhatsApp' : 'Descargar PDF + abrir WhatsApp'}
              </>
            )}
          </button>

          {/* Indicador de comportamiento según dispositivo */}
          <p className="text-center text-xs text-gray-400">
            {soportaShare
              ? '📱 Se abrirá el selector para compartir — elige WhatsApp'
              : '💻 Descarga el PDF y se abre WhatsApp con el resumen del pedido'}
          </p>

          {/* Fila secundaria: descargar PDF solo + WhatsApp solo texto */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <PDFDownloadLink
              document={<OrderPDF summary={summary} />}
              fileName={`pedido-${summary.numeroPedido}.pdf`}
              className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 hover:border-[#1a3a6b] hover:bg-blue-50 rounded-xl p-3 transition-all text-xs font-semibold text-gray-600 hover:text-[#1a3a6b] shadow-sm"
            >
              {({ loading }) => (
                <>
                  <span className="text-xl">{loading ? '⏳' : '📄'}</span>
                  <span>{loading ? 'Generando...' : 'Solo PDF'}</span>
                </>
              )}
            </PDFDownloadLink>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 hover:border-[#25D366] hover:bg-green-50 rounded-xl p-3 transition-all text-xs font-semibold text-gray-600 hover:text-[#1a9e50] shadow-sm"
            >
              <span className="text-xl">💬</span>
              <span>Solo texto</span>
            </a>
          </div>
        </div>

        {/* Notas */}
        {summary.form.notas.trim() && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800">
            <span className="font-semibold">Notas: </span>{summary.form.notas}
          </div>
        )}

        {/* Nuevo pedido */}
        <button
          onClick={onNuevoPedido}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
          style={{ background: '#1a3a6b' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2554a0')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1a3a6b')}
        >
          Hacer otro pedido
        </button>

      </div>
    </div>
  );
}

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
