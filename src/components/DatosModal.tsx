import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { exportarDatos, importarDatos } from '../utils/backup';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const LIMITE_KEY = 'pg-storage-limit-mb';
const LIMITE_DEFAULT = 500;

const PRESETS = [
  { label: '200 MB', mb: 200 },
  { label: '500 MB', mb: 500 },
  { label: '1 GB',   mb: 1024 },
  { label: '2 GB',   mb: 2048 },
  { label: '5 GB',   mb: 5120 },
];

function fmt(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb.toFixed(mb < 1 ? 2 : 0)} MB`;
}

interface Props {
  onCerrar: () => void;
  onRecargar: () => void;
}

export function DatosModal({ onCerrar, onRecargar }: Props) {
  useBodyScrollLock();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [importOk, setImportOk]       = useState(false);

  const [usadoMB, setUsadoMB]     = useState<number | null>(null);
  const [cuotaMB, setCuotaMB]     = useState<number | null>(null);
  const [animado, setAnimado]     = useState(false);

  const [limiteMB, setLimiteMB]           = useState<number>(() => {
    const v = localStorage.getItem(LIMITE_KEY);
    return v ? Number(v) : LIMITE_DEFAULT;
  });
  const [editandoLimite, setEditandoLimite] = useState(false);
  const [limiteInput, setLimiteInput]       = useState(String(limiteMB));

  useEffect(() => {
    if (!navigator.storage?.estimate) return;
    let tid: ReturnType<typeof setTimeout>;
    navigator.storage.estimate().then(({ usage = 0, quota = 0 }) => {
      setUsadoMB(usage / 1048576);
      setCuotaMB(quota / 1048576);
      tid = setTimeout(() => setAnimado(true), 120);
    });
    return () => clearTimeout(tid);
  }, []);

  const porcentaje = usadoMB !== null ? Math.min((usadoMB / limiteMB) * 100, 100) : 0;
  const excede     = usadoMB !== null && usadoMB > limiteMB;

  const barColor =
    porcentaje > 90 ? 'bg-red-500' :
    porcentaje > 70 ? 'bg-amber-400' :
    'bg-emerald-500';

  const textColor =
    porcentaje > 90 ? 'text-red-600' :
    porcentaje > 70 ? 'text-amber-600' :
    'text-emerald-600';

  function guardarLimite() {
    const n = parseFloat(limiteInput);
    if (!isNaN(n) && n > 0) {
      localStorage.setItem(LIMITE_KEY, String(n));
      setLimiteMB(n);
    }
    setEditandoLimite(false);
  }

  async function handleImportar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    try {
      await importarDatos(file);
      setImportOk(true);
      onRecargar();
      setTimeout(() => { setImportOk(false); onCerrar(); }, 1500);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al importar.');
    }
    e.target.value = '';
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mb-2 overflow-hidden">

        {/* Header */}
        <div className="bg-[#1a3a6b] px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-sm">Datos y almacenamiento</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-white/60 hover:text-white text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Grafico de almacenamiento */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                Almacenamiento usado
              </p>
              {usadoMB !== null && (
                <p className={`text-xs font-extrabold ${textColor}`}>
                  {fmt(usadoMB)} / {fmt(limiteMB)}
                </p>
              )}
            </div>

            {/* Barra */}
            <div className="bg-gray-100 rounded-full h-3.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                style={{ width: animado ? `${porcentaje}%` : '0%' }}
              />
            </div>

            {/* Leyenda */}
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{porcentaje.toFixed(1)}% del límite asignado</span>
              {cuotaMB !== null && (
                <span>Cuota navegador: {fmt(cuotaMB)}</span>
              )}
            </div>

            {/* Limite configurable */}
            {!editandoLimite ? (
              <button
                onClick={() => { setLimiteInput(String(limiteMB)); setEditandoLimite(true); }}
                className={`text-xs font-semibold mt-1 transition-colors ${
                  excede
                    ? 'text-red-600 hover:text-red-700'
                    : 'text-[#1a3a6b] hover:text-blue-700'
                }`}
              >
                {excede ? '⚠ Limite excedido — toca para aumentar' : 'Cambiar limite asignado'}
              </button>
            ) : (
              <div className="mt-2 space-y-2">
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map(p => (
                    <button
                      key={p.mb}
                      onClick={() => setLimiteInput(String(p.mb))}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                        limiteInput === String(p.mb)
                          ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]'
                          : 'border-gray-200 text-gray-600 hover:border-[#1a3a6b] hover:text-[#1a3a6b]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* Input manual + confirmar */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    value={limiteInput}
                    onChange={e => setLimiteInput(e.target.value)}
                    className="flex-1 text-sm font-semibold border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] transition"
                    placeholder="MB"
                  />
                  <span className="text-xs text-gray-400 shrink-0">MB</span>
                  <button
                    onClick={guardarLimite}
                    className="shrink-0 text-xs font-bold bg-[#1a3a6b] text-white px-3 py-1.5 rounded-xl hover:bg-[#15306b] transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoLimite(false)}
                    className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* Exportar */}
          <button
            onClick={() => { exportarDatos(); onCerrar(); }}
            className="w-full flex items-center gap-4 py-3 px-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl transition-colors text-left group"
          >
            <span className="text-2xl shrink-0">⬇</span>
            <div>
              <p className="text-sm font-bold text-gray-800 group-hover:text-[#1a3a6b] transition-colors">
                Exportar datos
              </p>
              <p className="text-xs text-gray-400">Descarga copia de seguridad (.json)</p>
            </div>
          </button>

          {/* Importar */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-4 py-3 px-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl transition-colors text-left group"
          >
            <span className="text-2xl shrink-0">⬆</span>
            <div>
              <p className="text-sm font-bold text-gray-800 group-hover:text-[#1a3a6b] transition-colors">
                Importar datos
              </p>
              <p className="text-xs text-gray-400">Restaura desde un archivo .json</p>
            </div>
          </button>

          {/* Feedback importacion */}
          {importOk && (
            <p className="text-xs text-center text-emerald-600 bg-emerald-50 rounded-xl py-2 border border-emerald-100 font-semibold">
              Datos importados correctamente
            </p>
          )}
          {importError && (
            <p className="text-xs text-center text-red-600 bg-red-50 rounded-xl py-2 border border-red-100">
              {importError}
            </p>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportar}
      />
    </div>
  );
}
