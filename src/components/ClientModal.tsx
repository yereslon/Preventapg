import { useState, useMemo } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ClienteRegistrado } from '../types/clients';

interface Props {
  open: boolean;
  clientes: ClienteRegistrado[];
  sesionesActivas: { nombre: string }[];
  onConfirmar: (nombre: string, ubicacion: string, esNuevo: boolean) => void;
  onCancelar?: () => void;
  puedeCancelar: boolean;
}

type Modo = 'registrado' | 'nuevo';

function buscarClientes(clientes: ClienteRegistrado[], q: string): ClienteRegistrado[] {
  if (!q.trim()) return clientes;
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const qn = norm(q);
  return clientes.filter(c => norm(c.nombre).includes(qn));
}

export function ClientModal({
  open,
  clientes,
  sesionesActivas,
  onConfirmar,
  onCancelar,
  puedeCancelar,
}: Props) {
  const [modo, setModo] = useState<Modo>('registrado');
  const [busqueda, setBusqueda] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');
  const [error, setError] = useState('');

  const nombresActivos = new Set(sesionesActivas.map(s => s.nombre.toLowerCase()));

  const resultados = useMemo(
    () => buscarClientes(clientes, busqueda),
    [clientes, busqueda],
  );

  function handleSeleccionar(cliente: ClienteRegistrado) {
    if (nombresActivos.has(cliente.nombre.toLowerCase())) {
      setError(`${cliente.nombre} ya tiene una pestaña abierta.`);
      return;
    }
    onConfirmar(cliente.nombre, cliente.ubicacion, false);
  }

  function handleNuevo() {
    if (!nuevoNombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!nuevaUbicacion.trim()) { setError('La ubicación es obligatoria.'); return; }
    onConfirmar(nuevoNombre.trim(), nuevaUbicacion.trim(), true);
  }

  const handleClose = puedeCancelar && onCancelar ? onCancelar : () => {};

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="relative z-50"
      transition
    >
      {/* Fondo con desenfoque animado */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition duration-200 ease-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden
                     transition duration-200 ease-out
                     data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
            style={{ background: '#1a3a6b' }}
          >
            <DialogTitle className="text-white font-bold text-sm">
              Seleccionar cliente
            </DialogTitle>
            {puedeCancelar && (
              <button
                onClick={onCancelar}
                className="text-white/50 hover:text-white text-lg leading-none transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            )}
          </div>

          {/* Toggle registrado / nuevo */}
          <div className="px-4 pt-4">
            <div className="flex gap-1 bg-blue-50 rounded-lg p-1">
              {(['registrado', 'nuevo'] as Modo[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setModo(m); setError(''); }}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
                    modo === m
                      ? 'bg-[#1a3a6b] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === 'registrado' ? 'Cliente registrado' : 'Nuevo cliente'}
                </button>
              ))}
            </div>
          </div>

          {/* Contenido */}
          <div className="px-4 py-3 space-y-3">
            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {modo === 'registrado' ? (
              <>
                <input
                  type="search"
                  placeholder="Buscar por nombre..."
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); setError(''); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  autoFocus
                />
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {resultados.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">
                      No se encontraron clientes.
                    </p>
                  )}
                  {resultados.map(c => {
                    const activo = nombresActivos.has(c.nombre.toLowerCase());
                    return (
                      <button
                        key={c.nombre}
                        onClick={() => handleSeleccionar(c)}
                        disabled={activo}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${
                          activo
                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer'
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{c.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">📍 {c.ubicacion || '—'}</p>
                        {activo && (
                          <p className="text-[10px] text-blue-500 mt-0.5">Ya tiene pestaña abierta</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={e => { setNuevoNombre(e.target.value); setError(''); }}
                    placeholder="Ej: Roberto Sánchez"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Ubicación *
                  </label>
                  <input
                    type="text"
                    value={nuevaUbicacion}
                    onChange={e => { setNuevaUbicacion(e.target.value); setError(''); }}
                    placeholder="Ej: Los Olivos"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  />
                </div>
                <button
                  onClick={handleNuevo}
                  className="w-full py-2.5 bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Crear pestaña
                </button>
              </div>
            )}
          </div>

          {modo === 'registrado' && <div className="pb-4" />}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
