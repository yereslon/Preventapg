import { useState, useRef, type ChangeEvent } from 'react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { exportarDatos, importarDatos } from '../utils/backup';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

interface Props {
  busqueda: string;
  setBusqueda: (v: string) => void;
  totalUnidades: number;
  cartBumpKey: number;
  onCarritoClick: () => void;
  onRecargar: () => void;
  onHistorial: () => void;
  onLiquidacion: () => void;
}

export function AppHeader({
  busqueda,
  setBusqueda,
  totalUnidades,
  cartBumpKey,
  onCarritoClick,
  onRecargar,
  onHistorial,
  onLiquidacion,
}: Props) {
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { puedeInstalar, instalar } = useInstallPrompt();

  async function handleImportar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importarDatos(file);
      onRecargar();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al importar.');
    }
    e.target.value = '';
  }

  return (
    <header
      className="sticky top-0 z-30 shadow-lg bg-[linear-gradient(135deg,#1a3a6b_0%,#2554a0_60%,#c0392b_100%)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo + marca */}
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 bg-[#c0392b]"
          >
            PG
          </span>
          <div className="min-w-0">
            <p className="text-white font-extrabold text-base leading-tight truncate">
              Plásticos Guerrero
            </p>
            <p className="text-white/60 text-xs uppercase tracking-wide hidden sm:block">
              Catálogo de Productos
            </p>
          </div>
        </div>

        {/* Búsqueda desktop */}
        <div className="flex-1 max-w-md hidden sm:block relative">
          <input
            type="search"
            placeholder="Buscar por nombre, categoría…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-4 pr-8 py-2 rounded-lg bg-white/15 text-white placeholder-white/60 border border-white/20 outline-none focus:bg-white/25 focus:border-white/50 transition text-sm"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-base leading-none transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Botón carrito */}
        <button
          onClick={onCarritoClick}
          className="relative flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-lg transition text-sm font-semibold shrink-0"
        >
          <span key={cartBumpKey} className={cartBumpKey > 0 ? 'cart-bump' : ''}>🛒</span>
          <span className="hidden sm:inline">Pedido</span>
          {totalUnidades > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
              {totalUnidades}
            </span>
          )}
        </button>

        {/* Menú de opciones — Headless UI Menu */}
        <Menu as="div" className="relative shrink-0">
          <MenuButton
            onClick={() => setImportError('')}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-2.5 py-2 rounded-lg transition shrink-0"
            aria-label="Opciones"
          >
            <span className="text-base leading-none">⚙</span>
            <span className="hidden sm:inline text-xs font-semibold">Opciones</span>
          </MenuButton>

          <MenuItems
            transition
            className="absolute right-0 top-full mt-1.5 origin-top-right bg-white rounded-xl shadow-2xl border border-gray-100 py-1 w-48 z-50 outline-none
                       transition duration-150 ease-out
                       data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <MenuItem>
              <button
                onClick={onHistorial}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 data-[focus]:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <span>⏰</span> Historial de pedidos
              </button>
            </MenuItem>

            <MenuItem>
              <button
                onClick={onLiquidacion}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 data-[focus]:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <span>📋</span> Liquidacion del dia
              </button>
            </MenuItem>

            <div className="border-t border-gray-100 my-1" />

            {puedeInstalar && (
              <>
                <MenuItem>
                  <button
                    onClick={instalar}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#1a3a6b] data-[focus]:bg-blue-50 flex items-center gap-2 transition-colors"
                  >
                    <span>📲</span> Instalar como app
                  </button>
                </MenuItem>
                <div className="border-t border-gray-100 my-1" />
              </>
            )}

            <MenuItem>
              <button
                onClick={exportarDatos}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 data-[focus]:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <span>⬇</span> Exportar datos
              </button>
            </MenuItem>

            <MenuItem>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 data-[focus]:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <span>⬆</span> Importar datos
              </button>
            </MenuItem>

            {importError && (
              <p className="px-4 py-2 text-xs text-red-600 border-t border-gray-100">{importError}</p>
            )}
          </MenuItems>
        </Menu>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportar}
        />
      </div>

      {/* Búsqueda móvil */}
      <div className="sm:hidden px-4 pb-3 relative">
        <input
          type="search"
          placeholder="Buscar por nombre, categoría…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-4 pr-8 py-2 rounded-lg bg-white/15 text-white placeholder-white/60 border border-white/20 outline-none focus:bg-white/25 transition text-sm"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-base leading-none transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </header>
  );
}
