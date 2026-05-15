export interface PrecioUnidad {
  unidad: string;
  precio: number;
}

export interface CatalogItem {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  unidad: string;
  preciosExtra: PrecioUnidad[];
}

export interface ExcelRow {
  Categoría?: string;
  Categoria?: string;
  Producto?: string;
  'Unidad 1'?: string;
  'Precio 1'?: number | string;
  'Unidad 2'?: string;
  'Precio 2'?: number | string;
  [key: string]: unknown;
}

export interface OrderFormData {
  nombre: string;
  ubicacion: string;
  notas: string;
}
