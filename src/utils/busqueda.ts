import type { CatalogItem } from '../types/catalog';

function normalizar(str: string): string {
  return str
    .replace(/\*/g, 'x')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function puntuar(item: CatalogItem, terminos: string[]): number {
  const nombre = normalizar(item.nombre);
  const cat    = normalizar(item.categoria);

  const todoEnNombre = terminos.every(t => nombre.includes(t));
  const todoEnAlgo   = todoEnNombre || terminos.every(t => nombre.includes(t) || cat.includes(t));
  if (!todoEnAlgo) return -1;

  const q = terminos.join(' ');
  if (nombre === q)            return 4; // coincidencia exacta
  if (nombre.startsWith(q))   return 3; // empieza con la búsqueda
  if (todoEnNombre)            return 2; // todas las palabras en el nombre
  return 1;                              // alguna palabra solo en categoría
}

export function buscarProductos(items: CatalogItem[], query: string): CatalogItem[] {
  const q = normalizar(query);
  if (!q) return items;

  const terminos = q.split(/\s+/).filter(Boolean);

  return items
    .map(item => ({ item, score: puntuar(item, terminos) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) =>
      b.score - a.score ||
      a.item.categoria.localeCompare(b.item.categoria, 'es') ||
      a.item.nombre.localeCompare(b.item.nombre, 'es')
    )
    .map(({ item }) => item);
}
