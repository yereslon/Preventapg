import { useState, useMemo } from 'react';
import type { CatalogItem } from '../types/catalog';
import type { CartItem, CartState } from '../types/cart';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const cart: CartState = useMemo(() => ({
    items,
    total: items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    totalUnidades: items.reduce((sum, i) => sum + i.cantidad, 0),
  }), [items]);

  function agregar(producto: CatalogItem, cantidad: number) {
    if (cantidad <= 0) return;
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === producto.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cantidad };
        return next;
      }
      return [...prev, { ...producto, cantidad }];
    });
  }

  function sumarUno(id: number) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
      return next;
    });
  }

  function quitarUno(id: number) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
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

  function cambiarCantidad(id: number, cantidad: number) {
    const val = Math.round(cantidad * 1000) / 1000; // máximo 3 decimales
    if (!isFinite(val) || val <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
      return;
    }
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], cantidad: val };
      return next;
    });
  }

  function eliminar(id: number) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function vaciar() {
    setItems([]);
  }

  return { cart, agregar, sumarUno, quitarUno, cambiarCantidad, eliminar, vaciar };
}
