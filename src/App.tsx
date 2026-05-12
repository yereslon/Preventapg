import { useState, useMemo, lazy, Suspense } from 'react';
import { useExcelData } from './hooks/useExcelData';
import { useCart } from './hooks/useCart';
import { ProductCard } from './components/ProductCard';
import { CartPanel } from './components/CartPanel';
import { CartReview } from './components/CartReview';
import { CategoryFilter } from './components/CategoryFilter';
import type { CatalogItem, OrderFormData } from './types/catalog';
import type { OrderSummary } from './types/order';

// Lazy load para aislar @react-pdf/renderer del bundle inicial
const ConfirmView = lazy(() =>
  import('./components/ConfirmView').then(m => ({ default: m.ConfirmView }))
);

type Vista = 'catalogo' | 'revision' | 'confirmado';

function generarNumeroPedido(): string {
  return 'PED-' + Date.now().toString(36).toUpperCase();
}

function fechaHoy(): string {
  return new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function App() {
  const { data, ubicaciones, whatsapp, loading, error } = useExcelData();
  const { cart, agregar, sumarUno, quitarUno, cambiarCantidad, eliminar, vaciar } = useCart();

  const [vista, setVista] = useState<Vista>('catalogo');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [ultimoPedido, setUltimoPedido] = useState<OrderSummary | null>(null);

  const categorias = useMemo(() => {
    const set = new Set(data.map(i => i.categoria).filter(Boolean));
    return ['Todas', ...Array.from(set).sort()];
  }, [data]);

  const productosFiltrados = useMemo(() => {
    return data.filter(item => {
      const matchCat = categoriaActiva === 'Todas' || item.categoria === categoriaActiva;
      const matchBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchBusqueda;
    });
  }, [data, categoriaActiva, busqueda]);

  function handleAgregar(item: CatalogItem, cantidad: number) {
    agregar(item, cantidad);
    if (!carritoAbierto) setCarritoAbierto(true);
  }

  function handleConfirmar(form: OrderFormData) {
    const summary: OrderSummary = {
      numeroPedido: generarNumeroPedido(),
      fecha: fechaHoy(),
      form,
      items: [...cart.items],
      total: cart.total,
    };
    setUltimoPedido(summary);
    vaciar();
    setVista('confirmado');
  }

  function handleNuevoPedido() {
    setUltimoPedido(null);
    setVista('catalogo');
  }

  // ── Vista: confirmado ────────────────────────────────
  if (vista === 'confirmado' && ultimoPedido) {
    return (
      <>
        <AppHeader busqueda="" setBusqueda={() => {}} totalUnidades={0} onCarritoClick={() => {}} />
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
            onNuevoPedido={handleNuevoPedido}
          />
        </Suspense>
      </>
    );
  }

  // ── Vista: revisión ──────────────────────────────────
  if (vista === 'revision') {
    return (
      <>
        <AppHeader
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          totalUnidades={cart.totalUnidades}
          onCarritoClick={() => setVista('catalogo')}
        />
        <CartReview
          cart={cart}
          ubicaciones={ubicaciones}
          onSumarUno={sumarUno}
          onQuitarUno={quitarUno}
          onCambiarCantidad={cambiarCantidad}
          onEliminar={eliminar}
          onVolver={() => setVista('catalogo')}
          onConfirmar={handleConfirmar}
        />
      </>
    );
  }

  // ── Vista: catálogo (principal) ──────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <AppHeader
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        totalUnidades={cart.totalUnidades}
        onCarritoClick={() => setCarritoAbierto(o => !o)}
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex gap-6">
        {/* Catálogo */}
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
              <div className="mb-5">
                <CategoryFilter
                  categorias={categorias}
                  activa={categoriaActiva}
                  onChange={setCategoriaActiva}
                />
              </div>
              <p className="text-xs text-gray-400 mb-4">
                {productosFiltrados.length} producto
                {productosFiltrados.length !== 1 ? 's' : ''}
                {categoriaActiva !== 'Todas' && ` en "${categoriaActiva}"`}
                {busqueda && ` · búsqueda: "${busqueda}"`}
              </p>
              {productosFiltrados.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-sm">
                  No se encontraron productos.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productosFiltrados.map(item => (
                    <ProductCard key={item.id} item={item} onAgregar={handleAgregar} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* Panel carrito desktop */}
        <aside className="hidden lg:flex flex-col w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-[calc(100vh-5rem)] sticky top-20">
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
              <span className="font-bold text-gray-800">Tu Pedido</span>
              <button
                onClick={() => setCarritoAbierto(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <CartPanel
              cart={cart}
              onQuitarUno={quitarUno}
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
    </div>
  );
}

/* ── Header compartido ──────────────────────────────── */
function AppHeader({
  busqueda,
  setBusqueda,
  totalUnidades,
  onCarritoClick,
}: {
  busqueda: string;
  setBusqueda: (v: string) => void;
  totalUnidades: number;
  onCarritoClick: () => void;
}) {
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

        <div className="flex-1 max-w-md hidden sm:block">
          <input
            type="search"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/15 text-white placeholder-white/60 border border-white/20 outline-none focus:bg-white/25 focus:border-white/50 transition text-sm"
          />
        </div>

        <button
          onClick={onCarritoClick}
          className="relative flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-lg transition text-sm font-semibold flex-shrink-0"
        >
          <span>🛒</span>
          <span className="hidden sm:inline">Pedido</span>
          {totalUnidades > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
              {totalUnidades}
            </span>
          )}
        </button>
      </div>

      <div className="sm:hidden px-4 pb-3">
        <input
          type="search"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/15 text-white placeholder-white/60 border border-white/20 outline-none focus:bg-white/25 transition text-sm"
        />
      </div>
    </header>
  );
}
