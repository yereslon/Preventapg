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

export interface Liquidacion {
  id: string;
  fecha: string;
  cobros: CobroCliente[];
  dias: DiaViatico[];
  fondoAsignado: number;
  notas: string;
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
