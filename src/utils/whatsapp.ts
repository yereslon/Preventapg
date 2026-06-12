import type { OrderSummary } from "../types/order";

export const WA_DEFAULT = "51963243948";

function formatSolesPlano(valor: number): string {
  return (
    "S/. " +
    valor.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

const SEPARADOR = "————————————————";

export function generarMensajeWA(summary: OrderSummary): string {
  const lineas: string[] = [];

  lineas.push("* Plásticos Guerrero — Orden de Preventa*");
  lineas.push(` ${summary.fecha}`);
  lineas.push("");
  lineas.push(`*Cliente:* ${summary.form.nombre}`);
  lineas.push(`*Zona de entrega:* ${summary.form.ubicacion}`);
  lineas.push("");

  for (const item of summary.items) {
    const cant = parseFloat(item.cantidad.toFixed(3));
    lineas.push(`${cant} ${item.unidad} — ${item.nombre}`);
    lineas.push(
      `P. unit.: ${formatSolesPlano(item.precio)}   |   Total: ${formatSolesPlano(item.precio * item.cantidad)}`,
    );
    if (item.nota) lineas.push(`_${item.nota}_`);
    lineas.push(SEPARADOR);
  }

  lineas.push(`*TOTAL: ${formatSolesPlano(summary.total)}*`);

  if (summary.form.notas.trim()) {
    lineas.push("");
    lineas.push(`_Notas: ${summary.form.notas.trim()}_`);
  }

  return lineas.join("\n");
}

export function urlWhatsApp(numero: string, summary: OrderSummary): string {
  const limpio = numero.replace(/[^0-9]/g, "") || WA_DEFAULT;
  const mensaje = generarMensajeWA(summary);
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}
