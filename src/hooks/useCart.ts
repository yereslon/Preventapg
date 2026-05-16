import { useState, useMemo, useEffect } from 'react';
import type { CatalogItem } from '../types/catalog';
import type { CartItem, CartState } from '../types/cart';

const STORAGE_KEY = 'pg_carrito';

function cargarStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(cargarStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { /* cuota o modo privado */ }
  }, [items]);

  const cart: CartState = useMemo(() => ({
    items,
    total: items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    totalUnidades: items.reduce((sum, i) => sum + i.cantidad, 0),
  }), [items]);

  function agregar(producto: CatalogItem, cantidad: number, precioOverride?: number, unidadOverride?: string, opcionIdx?: number, nota?: string) {
    if (cantidad <= 0) return;
    const precio = precioOverride ?? producto.precio;
    const unidad = unidadOverride ?? producto.unidad;
    const cartKey = `${producto.id}_${opcionIdx ?? 0}`;
    setItems(prev => {
      const idx = prev.findIndex(i => i.cartKey === cartKey);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cantidad };
        return next;
      }
      return [...prev, { ...producto, precio, unidad, cartKey, cantidad, nota }];
    });
  }

  function cambiarNota(cartKey: string, nota: string) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.cartKey === cartKey);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], nota: nota.trim() || undefined };
      return next;
    });
  }

  function sumarUno(cartKey: string) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.cartKey === cartKey);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
      return next;
    });
  }

  function quitarUno(cartKey: string) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.cartKey === cartKey);
      if (idx < 0) return prev;
      const next = [...prev];
      if (next[idx].cantidad <= 1) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad - 1 };
      }
      return next;
    });
  }

  function cambiarCantidad(cartKey: string, cantidad: number) {
    const val = Math.round(cantidad * 1000) / 1000;
    if (!isFinite(val) || val <= 0) {
      setItems(prev => prev.filter(i => i.cartKey !== cartKey));
      return;
    }
    setItems(prev => {
      const idx = prev.findIndex(i => i.cartKey === cartKey);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], cantidad: val };
      return next;
    });
  }

  function cambiarPrecio(cartKey: string, precio: number) {
    if (!isFinite(precio) || precio <= 0) return;
    setItems(prev => {
      const idx = prev.findIndex(i => i.cartKey === cartKey);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], precio };
      return next;
    });
  }

  function eliminar(cartKey: string) {
    setItems(prev => prev.filter(i => i.cartKey !== cartKey));
  }

  function vaciar() {
    setItems([]);
  }

  return { cart, agregar, sumarUno, quitarUno, cambiarCantidad, cambiarPrecio, cambiarNota, eliminar, vaciar };
}
