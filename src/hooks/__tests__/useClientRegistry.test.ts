import { describe, it, expect } from 'vitest';
import { parseClientesSheet } from '../useClientRegistry';

describe('parseClientesSheet', () => {
  it('parsea filas con columnas Cliente y Ubicacion', () => {
    const rows = [
      { Cliente: 'Juan García', Ubicacion: 'Lima Norte' },
      { Cliente: 'María Pérez', Ubicacion: 'Miraflores' },
    ];
    const result = parseClientesSheet(rows);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ nombre: 'Juan García', ubicacion: 'Lima Norte' });
    expect(result[1]).toEqual({ nombre: 'María Pérez', ubicacion: 'Miraflores' });
  });

  it('acepta columna Ubicación con tilde', () => {
    const rows = [{ Cliente: 'Ana Torres', 'Ubicación': 'San Isidro' }];
    const result = parseClientesSheet(rows);
    expect(result[0].ubicacion).toBe('San Isidro');
  });

  it('ignora filas sin nombre', () => {
    const rows = [
      { Cliente: '', Ubicacion: 'Lima' },
      { Cliente: 'Pedro López', Ubicacion: 'Surco' },
    ];
    expect(parseClientesSheet(rows)).toHaveLength(1);
  });

  it('tolera ubicacion vacía', () => {
    const rows = [{ Cliente: 'Luis', Ubicacion: '' }];
    expect(parseClientesSheet(rows)[0].ubicacion).toBe('');
  });

  it('devuelve array vacío para input vacío', () => {
    expect(parseClientesSheet([])).toEqual([]);
  });
});
