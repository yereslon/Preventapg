import type { CartItem } from './cart';
import type { OrderFormData } from './catalog';

export interface OrderSummary {
  numeroPedido: string;
  fecha: string;
  form: OrderFormData;
  items: CartItem[];
  total: number;
}
