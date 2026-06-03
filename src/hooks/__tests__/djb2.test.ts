import { describe, it, expect } from 'vitest';
import { djb2 } from '../useExcelData';

describe('djb2', () => {
  it('devuelve un número no-negativo', () => {
    expect(djb2('Bolsa Negra')).toBeGreaterThanOrEqual(0);
  });

  it('es determinista — misma entrada, mismo resultado', () => {
    expect(djb2('Bolsa Negra')).toBe(djb2('Bolsa Negra'));
  });

  it('produce valores distintos para entradas distintas', () => {
    expect(djb2('Bolsa Negra')).not.toBe(djb2('Tubo PVC'));
  });

  it('no produce cero para string vacío — devuelve valor inicial 5381', () => {
    expect(djb2('')).toBe(5381);
  });

  it('distingue combinaciones distintas del mismo set de chars', () => {
    expect(djb2('ProductoXCategoria A')).not.toBe(djb2('Producto XCategoria A'));
  });
});
