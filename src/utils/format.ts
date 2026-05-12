export function formatSoles(valor: number): string {
  return 'S/. ' + valor.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
