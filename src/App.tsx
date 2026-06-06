import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { exportarDatos, importarDatos } from './utils/backup';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { HistorialView } from './components/HistorialView';
import { useExcelData } from './hooks/useExcelData';
import { useClients } from './hooks/useClients';
import { useClientRegistry } from './hooks/useClientRegistry';
import { ProductCard } from './components/ProductCard';
import { CartPanel } from './components/CartPanel';
import { CartReview } from './components/CartReview';
import { CategoryFilter } from './components/CategoryFilter';
import { TabBar } from './components/TabBar';
import { ClientModal } from './components/ClientModal';
import { UltimosProductos } from './components/UltimosProductos';
import type { CatalogItem } from './types/catalog';
import type { OrderSummary } from './types/order';
import { buscarProductos } from './utils/busqueda';

const ConfirmView = lazy(() =>
  import('./components/ConfirmView').then(m => ({ default: m.ConfirmView }))
);

export default function App() {
  const { data, ubicaciones, whatsapp, loading, error } = useExcelData();
  const { clientes } = useClientRegistry();
  const {
    sesiones, activoId, sesionActiva, modalAbierto, setModalAbierto,
    cart, crearSesion, crearSesionConItems, cerrarSesion, setActivo, confirmarSesion,
    setVista, getPrecioNegociado,
    agregar, sumarUno, quitarUno, cambiarCantidad, cambiarPrecio,
    cambiarNota, eliminar, vaciar, agregarManual,
  } = useClients();

  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaFiltro, setBusquedaFiltro] = useState('');
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [cartBumpKey, setCartBumpKey] = useState(0);
  const [ultimoPedido, setUltimoPedido] = useState<OrderSummary | null>(null);
  const [historialAbierto, setHistorialAbierto] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBusquedaFiltro(busqueda), 220);
    return () => clearTimeout(t);
  }, [busqueda]);

  const vista = sesionActiva?.vista ?? 'catalogo';

  const categorias = useMemo(() => {
    const set = new Set(data.map(i => i.categoria).filter(Boolean));
    return ['Todas', ...Array.from(set).sort()];
  }, [data]);

  const productosFiltrados = useMemo(() => {
    const porCategoria = categoriaActiva === 'Todas'
      ? data
      : data.filter(i => i.categoria === categoriaActiva);
    if (!busquedaFiltro.trim()) {
      return [...porCategoria].sort((a, b) => {
        const cat = a.categoria.localeCompare(b.categoria, 'es');
        return cat !== 0 ? cat : a.nombre.localeCompare(b.nombre, 'es');
      });
    }
    return buscarProductos(porCategoria, busquedaFiltro);
  }, [data, categoriaActiva, busquedaFiltro]);

  function handleAgregar(
    item: CatalogItem,
    cantidad: number,
    precioOverride?: number,
    unidadOverride?: string,
    opcionIdx?: number,
    nota?: string,
  ) {
    agregar(item, cantidad, precioOverride, unidadOverride, opcionIdx, nota);
    setCartBumpKey(k => k + 1);
  }

  function handleConfirmar(form: Parameters<typeof confirmarSesion>[0]) {
    const summary = confirmarSesion(form);
    setUltimoPedido(summary);
  }

  function handleCerrarPestana(id: string) {
    const sesion = sesiones.find(s => s.id === id);
    if (sesion && sesion.items.length > 0) {
      if (!confirm(`¿Cerrar la pestaña de ${sesion.nombre}? Se perderá el pedido en curso.`)) return;
    }
    cerrarSesion(id);
  }

  // ── Modal de cliente ─────────────────────────────────
  const clientModal = modalAbierto && (
    <ClientModal
      clientes={clientes}
      sesionesActivas={sesiones}
      onConfirmar={crearSesion}
      onCancelar={() => setModalAbierto(false)}
      puedeCancelar={true}
    />
  );

  // ── Vista: historial ────────────────────────────────
  if (historialAbierto) {
    return (
      <>
        <AppHeader
          busqueda=""
          setBusqueda={() => {}}
          totalUnidades={0}
          cartBumpKey={0}
          onCarritoClick={() => {}}
          onRecargar={() => window.location.reload()}
          onHistorial={() => setHistorialAbierto(true)}
        />
        <TabBar
          sesiones={sesiones}
          activoId={activoId}
          onSeleccionar={setActivo}
          onCerrar={handleCerrarPestana}
          onNuevo={() => setModalAbierto(true)}
          onHistorial={() => setHistorialAbierto(true)}
        />
        <HistorialView
          onCerrar={() => setHistorialAbierto(false)}
          onAbrirPedido={(nombre, ubicacion, items) => {
            crearSesionConItems(nombre, ubicacion, items);
            setVista('revision');
            setHistorialAbierto(false);
          }}
        />
        {clientModal}
      </>
    );
  }

  // ── Vista: confirmado ────────────────────────────────
  if (ultimoPedido) {
    return (
      <>
        <AppHeader
          busqueda=""
          setBusqueda={() => {}}
          totalUnidades={0}
          cartBumpKey={0}
          onCarritoClick={() => {}}
          onRecargar={() => window.location.reload()}
          onHistorial={() => setHistorialAbierto(true)}
        />
        <TabBar
          sesiones={sesiones}
          activoId={activoId}
          onSeleccionar={setActivo}
          onCerrar={handleCerrarPestana}
          onNuevo={() => setModalAbierto(true)}
          onHistorial={() => setHistorialAbierto(true)}
        />
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm">Preparando confirmación...</span>
            </div>
          }
        >
          <ConfirmView
            summary={ultimoPedido}
            whatsapp={whatsapp}
            onCerrar={() => {
              setUltimoPedido(null);
              setModalAbierto(true);
            }}
          />
        </Suspense>
        {clientModal}
      </>
    );
  }

  // ── Vista: revisión ──────────────────────────────────
  if (vista === 'revision') {
    return (
      <>
        <AppHeader
          busqueda=""
          setBusqueda={() => {}}
          totalUnidades={0}
          cartBumpKey={0}
          onCarritoClick={() => {}}
          onRecargar={() => window.location.reload()}
          onHistorial={() => setHistorialAbierto(true)}
        />
        <TabBar
          sesiones={sesiones}
          activoId={activoId}
          onSeleccionar={setActivo}
          onCerrar={handleCerrarPestana}
          onNuevo={() => setModalAbierto(true)}
          onHistorial={() => setHistorialAbierto(true)}
        />
        <CartReview
          cart={cart}
          ubicaciones={ubicaciones}
          onSumarUno={sumarUno}
          onQuitarUno={quitarUno}
          onCambiarCantidad={cambiarCantidad}
          onEliminar={eliminar}
          onCambiarPrecio={cambiarPrecio}
          onCambiarNota={cambiarNota}
          onAgregarManual={agregarManual}
          onVolver={() => setVista('catalogo')}
          onConfirmar={handleConfirmar}
          readOnlyDatos
          formInicial={sesionActiva?.orderForm}
        />
        {clientModal}
      </>
    );
  }

  // ── Vista: catálogo (principal) ──────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <AppHeader
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        totalUnidades={cart.items.length}
        cartBumpKey={cartBumpKey}
        onCarritoClick={() => setCarritoAbierto(o => !o)}
        onRecargar={() => window.location.reload()}
        onHistorial={() => setHistorialAbierto(true)}
      />

      <TabBar
        sesiones={sesiones}
        activoId={activoId}
        onSeleccionar={setActivo}
        onCerrar={handleCerrarPestana}
        onNuevo={() => setModalAbierto(true)}
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex gap-6">
        <main className="flex-1 min-w-0">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm">Cargando catálogo...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-2">
              <p className="text-3xl">⚠️</p>
              <p className="font-bold text-red-800">No se pudo cargar el catálogo</p>
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-sm text-gray-500">
                Coloca{' '}
                <code className="bg-red-100 px-1 rounded">catalogo.xlsx</code> en{' '}
                <code className="bg-red-100 px-1 rounded">/public</code>
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              {sesionActiva && (
                <UltimosProductos
                  productos={sesionActiva.ultimosProductos}
                  catalogData={data}
                  onAgregar={(item, cant, precio, unidad, idx) => {
                    handleAgregar(item, cant, precio, unidad, idx);
                  }}
                  clienteNombre={sesionActiva.nombre}
                />
              )}

              <div className="mt-5 mb-5">
                <CategoryFilter
                  categorias={categorias}
                  activa={categoriaActiva}
                  onChange={setCategoriaActiva}
                />
              </div>

              <p className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                <span>
                  {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
                  {categoriaActiva !== 'Todas' && ` en "${categoriaActiva}"`}
                  {busquedaFiltro && ` · "${busquedaFiltro}"`}
                </span>
                {busqueda !== busquedaFiltro && (
                  <span className="text-[10px] text-gray-300 animate-pulse">buscando…</span>
                )}
              </p>

              {productosFiltrados.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-sm space-y-3">
                  <p className="text-3xl">🔍</p>
                  <p className="font-medium text-gray-500">
                    No se encontraron productos
                    {busquedaFiltro ? ` para "${busquedaFiltro}"` : ''}
                  </p>
                  <div className="flex flex-col items-center gap-2 pt-1">
                    {busquedaFiltro && (
                      <button
                        onClick={() => setBusqueda('')}
                        className="text-[#2554a0] hover:underline text-sm font-semibold"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                    {categoriaActiva !== 'Todas' && (
                      <button
                        onClick={() => setCategoriaActiva('Todas')}
                        className="text-[#2554a0] hover:underline text-sm font-semibold"
                      >
                        Ver todas las categorías
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productosFiltrados.map(item => {
                    const negociado = getPrecioNegociado(item.nombre, item.unidad);
                    const itemsEnCarrito = cart.items.filter(ci => ci.nombre === item.nombre);
                    return (
                      <ProductCard
                        key={item.id}
                        item={item}
                        precioNegociado={negociado}
                        cartItems={sesionActiva ? itemsEnCarrito : []}
                        onAgregar={!sesionActiva ? () => setModalAbierto(true) : handleAgregar}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

        {/* Panel carrito desktop */}
        <aside className="hidden lg:flex flex-col w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-[calc(100vh-8rem)] sticky top-20">
          <CartPanel
            cart={cart}
            onSumarUno={sumarUno}
            onQuitarUno={quitarUno}
            onCambiarCantidad={cambiarCantidad}
            onEliminar={eliminar}
            onVaciar={vaciar}
            onVerPedido={() => setVista('revision')}
          />
        </aside>
      </div>

      {/* Drawer móvil */}
      {carritoAbierto && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setCarritoAbierto(false)}
          />
          <div className="w-80 bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-800">
                Pedido — {sesionActiva?.nombre ?? '—'}
              </span>
              <button
                onClick={() => setCarritoAbierto(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <CartPanel
              cart={cart}
              onSumarUno={sumarUno}
              onQuitarUno={quitarUno}
              onCambiarCantidad={cambiarCantidad}
              onEliminar={eliminar}
              onVaciar={vaciar}
              onVerPedido={() => {
                setCarritoAbierto(false);
                setVista('revision');
              }}
            />
          </div>
        </div>
      )}

      {clientModal}
    </div>
  );
}

/* ── Header compartido ──────────────────────────────── */
function AppHeader({
  busqueda,
  setBusqueda,
  totalUnidades,
  cartBumpKey,
  onCarritoClick,
  onRecargar,
  onHistorial,
}: {
  busqueda: string;
  setBusqueda: (v: string) => void;
  totalUnidades: number;
  cartBumpKey: number;
  onCarritoClick: () => void;
  onRecargar: () => void;
  onHistorial: () => void;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { puedeInstalar, instalar } = useInstallPrompt();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importarDatos(file);
      setMenuAbierto(false);
      onRecargar();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al importar.');
    }
    e.target.value = '';
  }
  return (
    <header
      className="sticky top-0 z-30 shadow-lg"
      style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #2554a0 60%, #c0392b 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ background: '#c0392b' }}
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-base leading-none transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={onCarritoClick}
          className="relative flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-lg transition text-sm font-semibold flex-shrink-0"
        >
          <span key={cartBumpKey} className={cartBumpKey > 0 ? 'cart-bump' : ''}>🛒</span>
          <span className="hidden sm:inline">Pedido</span>
          {totalUnidades > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
              {totalUnidades}
            </span>
          )}
        </button>

        {/* Menú ⚙ */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => { setMenuAbierto(o => !o); setImportError(''); }}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-2.5 py-2 rounded-lg transition flex-shrink-0"
            aria-label="Opciones"
          >
            <span className="text-base leading-none">⚙</span>
            <span className="hidden sm:inline text-xs font-semibold">Opciones</span>
          </button>

          {menuAbierto && (
            <div className="absolute right-0 top-11 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 w-48 z-50">
              <button
                onClick={() => { onHistorial(); setMenuAbierto(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <span>&#9203;</span> Historial de pedidos
              </button>
              <div className="border-t border-gray-100 my-1" />
              {puedeInstalar && (
                <>
                  <button
                    onClick={() => { instalar(); setMenuAbierto(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#1a3a6b] hover:bg-blue-50 flex items-center gap-2"
                  >
                    <span>📲</span> Instalar como app
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                </>
              )}
              <button
                onClick={() => { exportarDatos(); setMenuAbierto(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <span>⬇</span> Exportar datos
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <span>⬆</span> Importar datos
              </button>
              {importError && (
                <p className="px-4 py-2 text-xs text-red-600 border-t border-gray-100">{importError}</p>
              )}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportar}
          />
        </div>
      </div>

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
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-base leading-none transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </header>
  );
}
