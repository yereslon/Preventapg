export interface FotoEvidencia {
  id: string;
  dataUrl: string;
  timestamp: string;
}

export interface CobroCliente {
  id: string;
  nombre: string;
  efectivo: number;
  yape: number;
  fotos: FotoEvidencia[];
  comentario: string;
}

export interface GastoLinea {
  id: string;
  descripcion: string;
  monto: number;
}

export interface DiaViatico {
  id: string;
  label: string;
  gastos: GastoLinea[];
}

export interface PreventaCliente {
  id: string;
  nombre: string;
  ubicacion: string;
  notas: string;
  visitado: boolean;
}

export interface Liquidacion {
  id: string;
  fecha: string;
  cobros: CobroCliente[];
  dias: DiaViatico[];
  preventas: PreventaCliente[];
  fondoAsignado: number;
  notas: string;
  guardada: boolean;
}

export interface LiquidacionTotales {
  totalEfectivo: number;
  totalYape: number;
  totalRecaudado: number;
  totalGastado: number;
  saldoViaticos: number | null;
  efectivoNetoEntregar: number;
  tieneCobros: boolean;
  tieneGastos: boolean;
  tieneFondo: boolean;
}
