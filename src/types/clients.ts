import type { CartItem } from './cart';
import type { OrderFormData } from './catalog';

export interface ClienteRegistrado {
  nombre: string;
  ubicacion: string;
}

export interface ProductoHistorial {
  nombre: string;
  precio: number;
  precioBase: number;
  unidad: string;
  categoria: string;
}

export interface ClienteHistorial {
  ultimosProductos: ProductoHistorial[];
  preciosNegociados: Record<string, number>;
}

export interface ClientSession {
  id: string;
  nombre: string;
  ubicacion: string;
  esNuevo: boolean;
  items: CartItem[];
  vista: 'catalogo' | 'revision' | 'confirmado';
  orderForm: OrderFormData;
  preciosNegociados: Record<string, number>;
  ultimosProductos: ProductoHistorial[];
}
