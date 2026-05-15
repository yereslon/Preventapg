import type { CatalogItem } from './catalog';

export interface CartItem extends CatalogItem {
  cartKey: string;
  cantidad: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  totalUnidades: number;
}
