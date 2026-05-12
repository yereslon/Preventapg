import type { OrderSummary } from '../types/order';

export const WA_DEFAULT = '51963243948';

function formatSolesPlano(valor: number): string {
  return 'S/. ' + valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generarMensajeWA(summary: OrderSummary): string {
  const lineas: string[] = [];

  lineas.push('*🧾 Plásticos Guerrero — Orden de Preventa*');
  lineas.push(`📅 Fecha: ${summary.fecha}`);
  lineas.push(`🔖 Pedido: ${summary.numeroPedido}`);
  lineas.push('');
  lineas.push(`*Cliente:* ${summary.form.nombre}`);
  lineas.push(`*Zona de entrega:* ${summary.form.ubicacion}`);
  lineas.push('');
  lineas.push('*Productos:*');

  for (const item of summary.items) {
    const subtotal = formatSolesPlano(item.precio * item.cantidad);
    lineas.push(`• ${item.nombre} (x${item.cantidad}) — ${subtotal}`);
  }

  lineas.push('');
  lineas.push(`*TOTAL: ${formatSolesPlano(summary.total)}*`);

  if (summary.form.notas.trim()) {
    lineas.push('');
    lineas.push(`_Notas: ${summary.form.notas.trim()}_`);
  }

  return lineas.join('\n');
}

export function urlWhatsApp(numero: string, summary: OrderSummary): string {
  const limpio = numero.replace(/[^0-9]/g, '') || WA_DEFAULT;
  const mensaje = generarMensajeWA(summary);
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}
