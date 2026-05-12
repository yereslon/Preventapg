export interface CatalogItem {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  unidad: string;
}

export interface ExcelRow {
  Categoría?: string;
  Categoria?: string;
  Producto?: string;
  Precio?: number | string;
  Unidad?: string;
  [key: string]: unknown;
}

export interface OrderFormData {
  nombre: string;
  ubicacion: string;
  notas: string;
}
