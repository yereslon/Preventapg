import type { CatalogItem } from './catalog';

export interface CartItem extends CatalogItem {
  cartKey: string;
  cantidad: number;
  nota?: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  totalUnidades: number;
}
