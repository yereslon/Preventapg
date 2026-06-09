import type { CartState } from '../types/cart';
import type { OrderFormData } from '../types/catalog';
import { CartReview } from './CartReview';

interface Props {
  cart: CartState;
  ubicaciones: string[];
  formInicial?: OrderFormData;
  onSumarUno: (cartKey: string) => void;
  onQuitarUno: (cartKey: string) => void;
  onCambiarCantidad: (cartKey: string, cantidad: number) => void;
  onEliminar: (cartKey: string) => void;
  onCambiarPrecio: (cartKey: string, precio: number) => void;
  onCambiarNota: (cartKey: string, nota: string) => void;
  onAgregarManual: (nombre: string, categoria: string, unidad: string, precio: number, cantidad: number) => void;
  onVolver: () => void;
  onConfirmar: (form: OrderFormData) => void;
}

export function RevisionView({
  cart,
  ubicaciones,
  formInicial,
  onSumarUno,
  onQuitarUno,
  onCambiarCantidad,
  onEliminar,
  onCambiarPrecio,
  onCambiarNota,
  onAgregarManual,
  onVolver,
  onConfirmar,
}: Props) {
  return (
    <CartReview
      cart={cart}
      ubicaciones={ubicaciones}
      onSumarUno={onSumarUno}
      onQuitarUno={onQuitarUno}
      onCambiarCantidad={onCambiarCantidad}
      onEliminar={onEliminar}
      onCambiarPrecio={onCambiarPrecio}
      onCambiarNota={onCambiarNota}
      onAgregarManual={onAgregarManual}
      onVolver={onVolver}
      onConfirmar={onConfirmar}
      readOnlyDatos
      formInicial={formInicial}
    />
  );
}
