import { useState, useMemo, useEffect } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import type { CatalogItem } from "../types/catalog";
import type { CartState } from "../types/cart";
import type { ClientSession } from "../types/clients";
import { ProductCard } from "./ProductCard";
import { CartPanel } from "./CartPanel";
import { CategoryFilter } from "./CategoryFilter";
import { buscarProductos } from "../utils/busqueda";
import { formatSoles } from "../utils/format";

interface Props {
  sesionActiva: ClientSession | null;
  data: CatalogItem[];
  loading: boolean;
  error: string | null;
  busqueda: string;
  cart: CartState;
  carritoAbierto: boolean;
  onCerrarCarrito: () => void;
  onLimpiarBusqueda: () => void;
  getPrecioNegociado: (nombre: string, unidad: string) => number | undefined;
  onAgregar: (
    item: CatalogItem,
    cantidad: number,
    precioOverride?: number,
    unidadOverride?: string,
    opcionIdx?: number,
    nota?: string,
  ) => void;
  onSumarUno: (cartKey: string) => void;
  onQuitarUno: (cartKey: string) => void;
  onCambiarCantidad: (cartKey: string, cantidad: number) => void;
  onEliminar: (cartKey: string) => void;
  onVaciar: () => void;
  onVerPedido: () => void;
  onNuevoCliente: () => void;
}

export function CatalogoView({
  sesionActiva,
  data,
  loading,
  error,
  busqueda,
  cart,
  carritoAbierto,
  onCerrarCarrito,
  onLimpiarBusqueda,
  getPrecioNegociado,
  onAgregar,
  onSumarUno,
  onQuitarUno,
  onCambiarCantidad,
  onEliminar,
  onVaciar,
  onVerPedido,
  onNuevoCliente,
}: Props) {
  useBodyScrollLock(carritoAbierto);
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [busquedaFiltro, setBusquedaFiltro] = useState("");
  const [subVista, setSubVista] = useState<"catalogo" | "recientes">("catalogo");

  // Si la sesión se cierra, volver al catálogo
  const tabActiva = sesionActiva ? subVista : "catalogo";

  const SEARCH_DEBOUNCE_MS = 220;

  useEffect(() => {
    const t = setTimeout(() => setBusquedaFiltro(busqueda), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [busqueda]);

  const categorias = useMemo(() => {
    const set = new Set(data.map((i) => i.categoria).filter(Boolean));
    return ["Todas", ...Array.from(set).sort()];
  }, [data]);

  const productosFiltrados = useMemo(() => {
    const porCategoria =
      categoriaActiva === "Todas"
        ? data
        : data.filter((i) => i.categoria === categoriaActiva);
    if (!busquedaFiltro.trim()) {
      return [...porCategoria].sort((a, b) => {
        const cat = a.categoria.localeCompare(b.categoria, "es");
        return cat !== 0 ? cat : a.nombre.localeCompare(b.nombre, "es");
      });
    }
    return buscarProductos(porCategoria, busquedaFiltro);
  }, [data, categoriaActiva, busquedaFiltro]);

  const panelCart = (
    <CartPanel
      cart={cart}
      onSumarUno={onSumarUno}
      onQuitarUno={onQuitarUno}
      onCambiarCantidad={onCambiarCantidad}
      onEliminar={onEliminar}
      onVaciar={onVaciar}
      onVerPedido={onVerPedido}
    />
  );

  return (
    <>
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
              <p className="font-bold text-red-800">
                No se pudo cargar el catálogo
              </p>
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-sm text-gray-500">
                Coloca{" "}
                <code className="bg-red-100 px-1 rounded">catalogo.xlsx</code>{" "}
                en <code className="bg-red-100 px-1 rounded">/public</code>
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Sub-tabs: solo cuando hay sesión activa */}
              {sesionActiva && (
                <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
                  <button
                    onClick={() => setSubVista("catalogo")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      tabActiva === "catalogo"
                        ? "bg-white text-[#1a3a6b] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Catálogo
                  </button>
                  <button
                    onClick={() => setSubVista("recientes")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      tabActiva === "recientes"
                        ? "bg-white text-[#1a3a6b] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Recientes
                    {sesionActiva.ultimosProductos.length > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        tabActiva === "recientes"
                          ? "bg-[#1a3a6b] text-white"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {sesionActiva.ultimosProductos.length}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Vista: Recientes */}
              {tabActiva === "recientes" && sesionActiva && (
                <>
                  {sesionActiva.ultimosProductos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <p className="text-3xl mb-3">⏱</p>
                      <p className="text-gray-500 font-medium text-sm">
                        Sin pedidos anteriores
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Los productos pedidos por {sesionActiva.nombre} aparecerán aquí
                      </p>
                      <button
                        onClick={() => setSubVista("catalogo")}
                        className="mt-4 text-sm font-semibold text-[#1a3a6b] hover:underline"
                      >
                        Ir al catálogo
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 mb-4">
                        Últimos productos pedidos por{" "}
                        <span className="font-bold text-gray-600">
                          {sesionActiva.nombre}
                        </span>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sesionActiva.ultimosProductos.map((p) => {
                          const catalogItem = data.find(
                            (c) => c.nombre === p.nombre,
                          );
                          const disponible = Boolean(catalogItem);
                          const opcionIdx = catalogItem
                            ? Math.max(
                                0,
                                catalogItem.preciosExtra.findIndex(
                                  (pe) => pe.unidad === p.unidad,
                                ),
                              )
                            : 0;
                          const esNegociado = p.precio !== p.precioBase;

                          return (
                            <div
                              key={`${p.nombre}||${p.unidad}`}
                              className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex flex-col gap-2"
                            >
                              <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-2 min-h-[2.5rem]">
                                {p.nombre}
                              </p>
                              <div className="flex-1">
                                <p className="text-base font-black text-[#1a3a6b] tabular-nums">
                                  {formatSoles(p.precio)}
                                </p>
                                {esNegociado && (
                                  <p className="text-[11px] text-gray-400 line-through tabular-nums">
                                    {formatSoles(p.precioBase)}
                                  </p>
                                )}
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {p.unidad}
                                </p>
                              </div>
                              <button
                                disabled={!disponible}
                                onClick={() =>
                                  catalogItem &&
                                  onAgregar(
                                    catalogItem,
                                    1,
                                    p.precio,
                                    p.unidad,
                                    opcionIdx,
                                  )
                                }
                                className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                                  disponible
                                    ? "bg-[#1a3a6b] hover:bg-[#2554a0] text-white active:scale-95"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                {disponible ? "+ Agregar" : "No disponible"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Vista: Catálogo */}
              {tabActiva === "catalogo" && (
                <>
                  <div className="mb-5">
                    <CategoryFilter
                      categorias={categorias}
                      activa={categoriaActiva}
                      onChange={setCategoriaActiva}
                    />
                  </div>

                  <p className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                    <span>
                      {productosFiltrados.length} producto
                      {productosFiltrados.length !== 1 ? "s" : ""}
                      {categoriaActiva !== "Todas" &&
                        ` en "${categoriaActiva}"`}
                      {busquedaFiltro && ` · "${busquedaFiltro}"`}
                    </span>
                    {busqueda !== busquedaFiltro && (
                      <span className="text-[10px] text-gray-300 animate-pulse">
                        buscando…
                      </span>
                    )}
                  </p>

                  {productosFiltrados.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 text-sm space-y-3">
                      <p className="font-medium text-gray-500">
                        No se encontraron productos
                        {busquedaFiltro ? ` para "${busquedaFiltro}"` : ""}
                      </p>
                      <div className="flex flex-col items-center gap-2 pt-1">
                        {busquedaFiltro && (
                          <button
                            onClick={() => {
                              setBusquedaFiltro("");
                              onLimpiarBusqueda();
                            }}
                            className="text-[#2554a0] hover:underline text-sm font-semibold"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                        {categoriaActiva !== "Todas" && (
                          <button
                            onClick={() => setCategoriaActiva("Todas")}
                            className="text-[#2554a0] hover:underline text-sm font-semibold"
                          >
                            Ver todas las categorías
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {productosFiltrados.map((item) => {
                        const negociado = getPrecioNegociado(
                          item.nombre,
                          item.unidad,
                        );
                        const itemsEnCarrito = cart.items.filter(
                          (ci) => ci.nombre === item.nombre,
                        );
                        return (
                          <ProductCard
                            key={item.id}
                            item={item}
                            precioNegociado={negociado}
                            cartItems={sesionActiva ? itemsEnCarrito : []}
                            onAgregar={
                              !sesionActiva ? () => onNuevoCliente() : onAgregar
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>

        <aside className="hidden lg:flex flex-col w-80 shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-[calc(100vh-8rem)] sticky top-20">
          {panelCart}
        </aside>
      </div>

      {carritoAbierto && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <button
            className="flex-1 bg-black/40 backdrop-blur-sm cursor-default"
            onClick={onCerrarCarrito}
            aria-label="Cerrar carrito"
          />
          <div className="w-80 bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-800">
                Pedido — {sesionActiva?.nombre ?? "—"}
              </span>
              <button
                onClick={onCerrarCarrito}
                aria-label="Cerrar pedido"
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <CartPanel
              cart={cart}
              onSumarUno={onSumarUno}
              onQuitarUno={onQuitarUno}
              onCambiarCantidad={onCambiarCantidad}
              onEliminar={onEliminar}
              onVaciar={onVaciar}
              onVerPedido={() => {
                onCerrarCarrito();
                onVerPedido();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
