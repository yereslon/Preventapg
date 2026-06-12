import { useState, useMemo, useEffect } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import type { CatalogItem } from "../types/catalog";
import type { CartState } from "../types/cart";
import type { ClientSession } from "../types/clients";
import { ProductCard } from "./ProductCard";
import { CartPanel } from "./CartPanel";
import { buscarProductos } from "../utils/busqueda";
import { formatSoles } from "../utils/format";

type SubVista = "catalogo" | "categorias" | "recientes";

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
  const [busquedaFiltro, setBusquedaFiltro] = useState("");
  const [subVista, setSubVista] = useState<SubVista>("catalogo");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

  // "Últimos Pedidos" solo disponible con sesión activa
  const tabActiva: SubVista =
    subVista === "recientes" && !sesionActiva ? "catalogo" : subVista;

  const SEARCH_DEBOUNCE_MS = 220;

  useEffect(() => {
    const t = setTimeout(() => setBusquedaFiltro(busqueda), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Lista de categorías únicas ordenadas
  const categorias = useMemo(() => {
    const set = new Set(data.map((i) => i.categoria).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [data]);

  // Conteo de productos por categoría
  const conteoCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of data) {
      if (item.categoria) map.set(item.categoria, (map.get(item.categoria) ?? 0) + 1);
    }
    return map;
  }, [data]);

  // Productos del tab Catálogo: todos, ordenados, filtrados solo por búsqueda
  const productosEnCatalogo = useMemo(() => {
    if (!busquedaFiltro.trim()) {
      return [...data].sort((a, b) => {
        const cat = a.categoria.localeCompare(b.categoria, "es");
        return cat !== 0 ? cat : a.nombre.localeCompare(b.nombre, "es");
      });
    }
    return buscarProductos(data, busquedaFiltro);
  }, [data, busquedaFiltro]);

  // Productos del tab Categorías (drill-down): filtrados por categoría + búsqueda
  const productosEnCategoria = useMemo(() => {
    if (!categoriaSeleccionada) return [];
    const porCat = data.filter((i) => i.categoria === categoriaSeleccionada);
    if (!busquedaFiltro.trim()) return [...porCat].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return buscarProductos(porCat, busquedaFiltro);
  }, [data, categoriaSeleccionada, busquedaFiltro]);

  function irATab(tab: SubVista) {
    setSubVista(tab);
    if (tab !== "categorias") setCategoriaSeleccionada(null);
  }

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

  const tabs: { id: SubVista; label: string; badge?: number }[] = [
    { id: "catalogo", label: "Catálogo" },
    { id: "categorias", label: "Categorías", badge: categorias.length },
    ...(sesionActiva
      ? [{ id: "recientes" as SubVista, label: "Últimos Pedidos", badge: sesionActiva.ultimosProductos.length }]
      : []),
  ];

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
              <p className="font-bold text-red-800">No se pudo cargar el catálogo</p>
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
              {/* Barra de sub-tabs */}
              <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl overflow-x-auto [scrollbar-width:none]">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => irATab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      tabActiva === tab.id
                        ? "bg-white text-[#1a3a6b] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          tabActiva === tab.id
                            ? "bg-[#1a3a6b] text-white"
                            : tab.id === "recientes"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Tab: Catálogo ── */}
              {tabActiva === "catalogo" && (
                <>
                  <p className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                    <span>
                      {productosEnCatalogo.length} producto
                      {productosEnCatalogo.length !== 1 ? "s" : ""}
                      {busquedaFiltro && ` · "${busquedaFiltro}"`}
                    </span>
                    {busqueda !== busquedaFiltro && (
                      <span className="text-[10px] text-gray-300 animate-pulse">
                        buscando…
                      </span>
                    )}
                  </p>

                  {productosEnCatalogo.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 text-sm space-y-3">
                      <p className="font-medium text-gray-500">
                        No se encontraron productos
                        {busquedaFiltro ? ` para "${busquedaFiltro}"` : ""}
                      </p>
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
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {productosEnCatalogo.map((item) => {
                        const negociado = getPrecioNegociado(item.nombre, item.unidad);
                        const itemsEnCarrito = cart.items.filter(
                          (ci) => ci.nombre === item.nombre,
                        );
                        return (
                          <ProductCard
                            key={item.id}
                            item={item}
                            precioNegociado={negociado}
                            cartItems={sesionActiva ? itemsEnCarrito : []}
                            onAgregar={!sesionActiva ? () => onNuevoCliente() : onAgregar}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── Tab: Categorías ── */}
              {tabActiva === "categorias" && (
                <>
                  {/* Sin categoría seleccionada: grid de categorías */}
                  {!categoriaSeleccionada && (
                    <>
                      <p className="text-xs text-gray-400 mb-4">
                        {categorias.length} categoría{categorias.length !== 1 ? "s" : ""}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {categorias.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategoriaSeleccionada(cat)}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:border-[#1a3a6b]/30 hover:shadow-md active:scale-95 transition-all group"
                          >
                            <p className="text-sm font-bold text-gray-800 group-hover:text-[#1a3a6b] transition-colors leading-snug">
                              {cat}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              {conteoCategoria.get(cat) ?? 0} producto
                              {(conteoCategoria.get(cat) ?? 0) !== 1 ? "s" : ""}
                            </p>
                            <p className="text-gray-300 text-xs mt-2 group-hover:text-[#1a3a6b] transition-colors">
                              Ver →
                            </p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Con categoría seleccionada: drill-down de productos */}
                  {categoriaSeleccionada && (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={() => setCategoriaSeleccionada(null)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#1a3a6b] transition-colors"
                        >
                          ← Categorías
                        </button>
                        <span className="text-gray-300">/</span>
                        <span className="text-sm font-bold text-gray-800 truncate">
                          {categoriaSeleccionada}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                        <span>
                          {productosEnCategoria.length} producto
                          {productosEnCategoria.length !== 1 ? "s" : ""}
                          {busquedaFiltro && ` · "${busquedaFiltro}"`}
                        </span>
                        {busqueda !== busquedaFiltro && (
                          <span className="text-[10px] text-gray-300 animate-pulse">
                            buscando…
                          </span>
                        )}
                      </p>

                      {productosEnCategoria.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm space-y-2">
                          <p className="font-medium text-gray-500">
                            Sin productos{busquedaFiltro ? ` para "${busquedaFiltro}"` : ""}
                          </p>
                          {busquedaFiltro && (
                            <button
                              onClick={() => { setBusquedaFiltro(""); onLimpiarBusqueda(); }}
                              className="text-[#2554a0] hover:underline text-sm font-semibold"
                            >
                              Limpiar búsqueda
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {productosEnCategoria.map((item) => {
                            const negociado = getPrecioNegociado(item.nombre, item.unidad);
                            const itemsEnCarrito = cart.items.filter(
                              (ci) => ci.nombre === item.nombre,
                            );
                            return (
                              <ProductCard
                                key={item.id}
                                item={item}
                                precioNegociado={negociado}
                                cartItems={sesionActiva ? itemsEnCarrito : []}
                                onAgregar={!sesionActiva ? () => onNuevoCliente() : onAgregar}
                              />
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── Tab: Últimos Pedidos ── */}
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
                        onClick={() => irATab("catalogo")}
                        className="mt-4 text-sm font-semibold text-[#1a3a6b] hover:underline"
                      >
                        Ir al catálogo
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 mb-4">
                        Últimos productos pedidos por{" "}
                        <span className="font-bold text-gray-600">{sesionActiva.nombre}</span>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sesionActiva.ultimosProductos.map((p) => {
                          const catalogItem = data.find((c) => c.nombre === p.nombre);
                          const disponible = Boolean(catalogItem);
                          const opcionIdx = catalogItem
                            ? Math.max(
                                0,
                                catalogItem.preciosExtra.findIndex((pe) => pe.unidad === p.unidad),
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
                                <p className="text-[11px] text-gray-400 mt-0.5">{p.unidad}</p>
                              </div>
                              <button
                                disabled={!disponible}
                                onClick={() =>
                                  catalogItem &&
                                  onAgregar(catalogItem, 1, p.precio, p.unidad, opcionIdx)
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
