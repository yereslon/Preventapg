import { useState, useMemo } from 'react';
import type { CatalogItem, OrderFormData } from '../types/catalog';
import type { CartItem, CartState } from '../types/cart';
import type { ClientSession, ClienteHistorial, ProductoHistorial, PedidoHistorial } from '../types/clients';
import type { OrderSummary } from '../types/order';

const SESIONES_KEY = 'pg_sesiones';
const LEGACY_KEY = 'pg_carrito';

let _idCounter = 0;
function genId(): string {
  return 'ses-' + Date.now().toString(36) + '-' + (++_idCounter).toString(36);
}

function normalizarNombreHist(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_');
}

function histKey(nombre: string): string {
  return `pg_hist_${normalizarNombreHist(nombre)}`;
}

function cargarHistorial(nombre: string): ClienteHistorial {
  try {
    const raw = localStorage.getItem(histKey(nombre));
    if (raw) {
      const parsed = JSON.parse(raw) as ClienteHistorial;
      return { ...parsed, pedidos: parsed.pedidos ?? [] };
    }
  } catch { /* ignore */ }
  return { ultimosProductos: [], preciosNegociados: {}, pedidos: [] };
}

function buildHistorial(
  items: CartItem[],
  historialPrevio: ClienteHistorial,
  nuevoPedido: PedidoHistorial,
): ClienteHistorial {
  const ultimosProductos: ProductoHistorial[] = items.slice(0, 10).map(i => ({
    nombre: i.nombre,
    precio: i.precio,
    precioBase: i.preciosExtra.find(p => p.unidad === i.unidad)?.precio ?? i.precio,
    unidad: i.unidad,
    categoria: i.categoria,
  }));

  const preciosNegociados: Record<string, number> = {};
  items.forEach(i => {
    const catalogPrice = i.preciosExtra.find(p => p.unidad === i.unidad)?.precio ?? i.precio;
    if (i.precio !== catalogPrice) {
      preciosNegociados[`${i.nombre}_${i.unidad}`] = i.precio;
    }
  });

  const pedidos = [nuevoPedido, ...(historialPrevio.pedidos ?? [])].slice(0, 30);

  return { ultimosProductos, preciosNegociados, pedidos };
}

function cargarSesiones(): ClientSession[] {
  try {
    const raw = localStorage.getItem(SESIONES_KEY);
    if (raw) return JSON.parse(raw) as ClientSession[];

    // Migración desde pg_carrito legacy
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const items = JSON.parse(legacy) as CartItem[];
      localStorage.removeItem(LEGACY_KEY);
      if (items.length > 0) {
        return [{
          id: 'migrado-' + Date.now().toString(36),
          nombre: 'Cliente sin asignar',
          ubicacion: '',
          esNuevo: true,
          items,
          vista: 'catalogo',
          orderForm: { nombre: '', ubicacion: '', notas: '' },
          preciosNegociados: {},
          ultimosProductos: [],
        }];
      }
    }
  } catch { /* ignore */ }
  return [];
}

function guardar(sesiones: ClientSession[]) {
  try { localStorage.setItem(SESIONES_KEY, JSON.stringify(sesiones)); } catch { /* quota */ }
}

export function useClients() {
  const initial = cargarSesiones();
  const [sesiones, setSesionesRaw] = useState<ClientSession[]>(initial);
  const [activoId, setActivoId] = useState<string | null>(initial[0]?.id ?? null);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);

  function setSesiones(next: ClientSession[]) {
    setSesionesRaw(next);
    guardar(next);
  }

  const sesionActiva = useMemo(
    () => sesiones.find(s => s.id === activoId) ?? null,
    [sesiones, activoId]
  );

  const cart: CartState = useMemo(() => {
    const items = sesionActiva?.items ?? [];
    return {
      items,
      total: items.reduce((s, i) => s + i.precio * i.cantidad, 0),
      totalUnidades: items.reduce((s, i) => s + i.cantidad, 0),
    };
  }, [sesionActiva]);

  // ── Session management ──────────────────────────────

  function crearSesion(nombre: string, ubicacion: string, esNuevo: boolean) {
    const id = genId();
    const hist = esNuevo
      ? { ultimosProductos: [], preciosNegociados: {} }
      : cargarHistorial(nombre);
    const sesion: ClientSession = {
      id, nombre, ubicacion, esNuevo,
      items: [],
      vista: 'catalogo',
      orderForm: { nombre, ubicacion, notas: '' },
      preciosNegociados: hist.preciosNegociados,
      ultimosProductos: hist.ultimosProductos,
    };
    const next = [...sesiones, sesion];
    setSesiones(next);
    setActivoId(id);
    setModalAbierto(false);
  }

  function crearSesionConItems(nombre: string, ubicacion: string, items: CartItem[]) {
    const id = genId();
    const hist = cargarHistorial(nombre);
    const sesion: ClientSession = {
      id, nombre, ubicacion, esNuevo: false,
      items: items.map((i, idx) => ({ ...i, cartKey: `${i.id}_${idx}` })),
      vista: 'catalogo',
      orderForm: { nombre, ubicacion, notas: '' },
      preciosNegociados: hist.preciosNegociados,
      ultimosProductos: hist.ultimosProductos,
    };
    const next = [...sesiones, sesion];
    setSesiones(next);
    setActivoId(id);
    setModalAbierto(false);
  }

  function cerrarSesion(id: string) {
    const next = sesiones.filter(s => s.id !== id);
    setSesiones(next);
    if (activoId === id) {
      setActivoId(next[0]?.id ?? null);
      // modal no se abre automáticamente — el usuario usa ＋ Nuevo
    }
  }

  function setActivo(id: string) {
    setActivoId(id);
  }

  function confirmarSesion(form: OrderFormData): OrderSummary {
    const sesion = sesiones.find(s => s.id === activoId);
    if (!sesion) throw new Error('No hay sesión activa');

    const summary: OrderSummary = {
      numeroPedido: 'PED-' + Date.now().toString(36).toUpperCase(),
      fecha: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      form,
      items: [...sesion.items],
      total: sesion.items.reduce((s, i) => s + i.precio * i.cantidad, 0),
    };

    try {
      const historialPrevio = cargarHistorial(sesion.nombre);
      const nuevoPedido: PedidoHistorial = {
        numeroPedido: summary.numeroPedido,
        fecha: summary.fecha,
        total: summary.total,
        ubicacion: summary.form.ubicacion,
        notas: summary.form.notas,
        items: [...sesion.items],
      };
      localStorage.setItem(
        histKey(sesion.nombre),
        JSON.stringify(buildHistorial(sesion.items, historialPrevio, nuevoPedido))
      );
    } catch { /* quota */ }

    const next = sesiones.filter(s => s.id !== activoId);
    setSesiones(next);
    setActivoId(next[0]?.id ?? null);

    return summary;
  }

  function setVista(vista: ClientSession['vista']) {
    if (!activoId) return;
    setSesiones(sesiones.map(s => s.id === activoId ? { ...s, vista } : s));
  }

  function setOrderForm(form: OrderFormData) {
    if (!activoId) return;
    setSesiones(sesiones.map(s => s.id === activoId ? { ...s, orderForm: form } : s));
  }

  // ── Cart operations ─────────────────────────────────

  function _updateItems(updater: (items: CartItem[]) => CartItem[]) {
    if (!activoId) return;
    setSesiones(sesiones.map(s =>
      s.id === activoId ? { ...s, items: updater(s.items) } : s
    ));
  }

  function getPrecioNegociado(nombre: string, unidad: string): number | undefined {
    return sesionActiva?.preciosNegociados[`${nombre}_${unidad}`];
  }

  function agregar(
    producto: CatalogItem,
    cantidad: number,
    precioOverride?: number,
    unidadOverride?: string,
    opcionIdx?: number,
    nota?: string,
  ) {
    if (cantidad <= 0) return;
    const unidad = unidadOverride ?? producto.unidad;
    const precio = precioOverride ?? getPrecioNegociado(producto.nombre, unidad) ?? producto.precio;
    const cartKey = `${producto.id}_${opcionIdx ?? 0}`;
    _updateItems(items => {
      const idx = items.findIndex(i => i.cartKey === cartKey);
      if (idx >= 0) {
        const next = [...items];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cantidad };
        return next;
      }
      return [...items, { ...producto, precio, unidad, cartKey, cantidad, nota }];
    });
  }

  function sumarUno(cartKey: string) {
    _updateItems(items => items.map(i =>
      i.cartKey === cartKey ? { ...i, cantidad: i.cantidad + 1 } : i
    ));
  }

  function quitarUno(cartKey: string) {
    _updateItems(items => {
      const idx = items.findIndex(i => i.cartKey === cartKey);
      if (idx < 0) return items;
      const next = [...items];
      if (next[idx].cantidad <= 1) next.splice(idx, 1);
      else next[idx] = { ...next[idx], cantidad: next[idx].cantidad - 1 };
      return next;
    });
  }

  function cambiarCantidad(cartKey: string, cantidad: number) {
    const val = Math.round(cantidad * 1000) / 1000;
    if (!isFinite(val) || val <= 0) {
      _updateItems(items => items.filter(i => i.cartKey !== cartKey));
      return;
    }
    _updateItems(items => items.map(i =>
      i.cartKey === cartKey ? { ...i, cantidad: val } : i
    ));
  }

  function cambiarPrecio(cartKey: string, precio: number) {
    if (!isFinite(precio) || precio <= 0) return;
    _updateItems(items => items.map(i =>
      i.cartKey === cartKey ? { ...i, precio } : i
    ));
  }

  function cambiarNota(cartKey: string, nota: string) {
    _updateItems(items => items.map(i =>
      i.cartKey === cartKey ? { ...i, nota: nota.trim() || undefined } : i
    ));
  }

  function eliminar(cartKey: string) {
    _updateItems(items => items.filter(i => i.cartKey !== cartKey));
  }

  function vaciar() {
    _updateItems(() => []);
  }

  function agregarManual(nombre: string, categoria: string, unidad: string, precio: number, cantidad: number) {
    const item: CatalogItem = {
      id: -Date.now(),
      nombre, categoria, precio, unidad,
      preciosExtra: [{ unidad, precio }],
    };
    agregar(item, cantidad, precio, unidad, 0);
  }

  return {
    sesiones,
    activoId,
    sesionActiva,
    modalAbierto,
    setModalAbierto,
    cart,
    crearSesion,
    crearSesionConItems,
    cerrarSesion,
    setActivo,
    confirmarSesion,
    setVista,
    setOrderForm,
    getPrecioNegociado,
    agregar,
    sumarUno,
    quitarUno,
    cambiarCantidad,
    cambiarPrecio,
    cambiarNota,
    eliminar,
    vaciar,
    agregarManual,
  };
}
