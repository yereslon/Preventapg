import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Liquidacion, LiquidacionTotales } from '../types/liquidacion';

// ── Colores de marca ─────────────────────────────────────────
const C_AZUL   = [26,  58,  107] as const;
const C_AZUL2  = [37,  84,  160] as const;
const C_GRIS_F = [245, 246, 250] as const;
const C_GRIS_B = [221, 225, 234] as const;
const C_TEXTO  = [44,  62,  80]  as const;
const C_SUAVE  = [108, 122, 137] as const;
const C_ALT    = [249, 250, 251] as const;

const MARGEN = 14;
const ANCHO  = 210 - MARGEN * 2; // 182 mm

// ── Helpers ──────────────────────────────────────────────────

function fmt(n: number): string {
  return 'S/. ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fechaLarga(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function dibujarEncabezado(doc: jsPDF, subtitulo: string, fecha: string): void {
  doc.setFillColor(...C_AZUL);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Plasticos Guerrero', MARGEN, 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(subtitulo, MARGEN, 17.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(fecha, 210 - MARGEN, 10.5, { align: 'right' });
  doc.setTextColor(...C_TEXTO);
}

function dibujarSeccion(doc: jsPDF, titulo: string, y: number): void {
  doc.setFillColor(...C_AZUL2);
  doc.rect(MARGEN, y, ANCHO, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(titulo, MARGEN + 3, y + 4.4);
  doc.setTextColor(...C_TEXTO);
}

function finalY(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

// ── Exportar PDF ─────────────────────────────────────────────

export function exportarLiquidacionPDF(liq: Liquidacion, tot: LiquidacionTotales): void {
  const doc    = new jsPDF({ unit: 'mm', format: 'a4' });
  const fecha  = fechaLarga(liq.fecha);
  let y = 30;

  dibujarEncabezado(doc, 'LIQUIDACION DEL DIA', fecha);

  // ── Cobros ────────────────────────────────────────────────

  if (liq.cobros.length > 0) {
    dibujarSeccion(doc, 'COBROS A CLIENTES', y);
    y += 6.5;

    autoTable(doc, {
      startY: y,
      head: [['Cliente', 'Efectivo', 'Yape / Plin', 'Total cobrado']],
      body: liq.cobros.map(c => [
        c.nombre || 'Sin nombre',
        fmt(c.efectivo),
        fmt(c.yape),
        fmt(c.efectivo + c.yape),
      ]),
      foot: [['Total', fmt(tot.totalEfectivo), fmt(tot.totalYape), fmt(tot.totalRecaudado)]],
      showFoot: 'lastPage',
      margin: { left: MARGEN, right: MARGEN },
      headStyles: { fillColor: [...C_AZUL2], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      footStyles: { fillColor: [...C_GRIS_F], textColor: [...C_TEXTO], fontSize: 8, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...C_ALT] },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [...C_TEXTO] },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
    });
    y = finalY(doc) + 9;
  }

  // ── Gastos de viaticos ────────────────────────────────────

  const diasConGastos = liq.dias.filter(d => d.gastos.length > 0);
  if (diasConGastos.length > 0) {
    if (y > 240) { doc.addPage(); dibujarEncabezado(doc, 'LIQUIDACION DEL DIA', fecha); y = 30; }

    dibujarSeccion(doc, 'GASTOS DE VIATICOS', y);
    y += 6.5;

    const cuerpo = diasConGastos.flatMap(d =>
      d.gastos.map((g, i) => [
        i === 0 ? (d.label || 'Sin etiqueta') : '',
        g.descripcion || '—',
        fmt(g.monto),
      ])
    );

    autoTable(doc, {
      startY: y,
      head: [['Dia', 'Descripcion', 'Monto']],
      body: cuerpo,
      foot: [['', 'Total gastado', fmt(tot.totalGastado)]],
      showFoot: 'lastPage',
      margin: { left: MARGEN, right: MARGEN },
      headStyles: { fillColor: [...C_AZUL2], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      footStyles: { fillColor: [...C_GRIS_F], textColor: [...C_TEXTO], fontSize: 8, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [...C_ALT] },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [...C_TEXTO] },
      columnStyles: {
        0: { halign: 'left', cellWidth: 48, fontStyle: 'bold' },
        1: { halign: 'left' },
        2: { halign: 'right', cellWidth: 32 },
      },
    });
    y = finalY(doc) + 9;
  }

  // ── Resumen financiero ────────────────────────────────────

  if (y > 220) { doc.addPage(); dibujarEncabezado(doc, 'LIQUIDACION DEL DIA', fecha); y = 30; }

  dibujarSeccion(doc, 'RESUMEN FINANCIERO', y);
  y += 6.5;

  const filas: [string, string][] = [];
  if (tot.tieneCobros) {
    filas.push(['Efectivo cobrado', fmt(tot.totalEfectivo)]);
    filas.push(['Yape / Plin', fmt(tot.totalYape)]);
    filas.push(['Total recaudado', fmt(tot.totalRecaudado)]);
  }
  if (tot.tieneFondo) {
    filas.push(['Fondo asignado', fmt(liq.fondoAsignado)]);
  }
  if (tot.tieneGastos) {
    filas.push(['Total gastado', fmt(tot.totalGastado)]);
  }
  if (tot.tieneFondo && tot.saldoViaticos !== null) {
    const etiqueta = tot.saldoViaticos >= 0 ? 'Sobrante del fondo' : 'Deficit del fondo';
    filas.push([etiqueta, fmt(Math.abs(tot.saldoViaticos))]);
  }

  const altFilas  = filas.length * 7;
  const altFinal  = 11;
  const altCaja   = altFilas + altFinal + 10;

  doc.setFillColor(...C_GRIS_F);
  doc.setDrawColor(...C_GRIS_B);
  doc.roundedRect(MARGEN, y, ANCHO, altCaja, 2, 2, 'FD');

  let ry = y + 7;
  filas.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C_SUAVE);
    doc.text(k, MARGEN + 5, ry);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C_TEXTO);
    doc.text(v, 210 - MARGEN - 5, ry, { align: 'right' });
    ry += 7;
  });

  // Fila destacada: efectivo a entregar
  doc.setFillColor(...C_AZUL);
  doc.roundedRect(MARGEN, ry, ANCHO, altFinal, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Efectivo a entregar', MARGEN + 5, ry + 7);
  doc.setFontSize(11);
  doc.text(fmt(tot.efectivoNetoEntregar), 210 - MARGEN - 5, ry + 7, { align: 'right' });
  doc.setTextColor(...C_TEXTO);

  y += altCaja + 8;

  // ── Notas del dia ─────────────────────────────────────────

  if (liq.notas.trim()) {
    if (y > 250) { doc.addPage(); dibujarEncabezado(doc, 'LIQUIDACION DEL DIA', fecha); y = 30; }

    dibujarSeccion(doc, 'NOTAS DEL DIA', y);
    y += 6.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const lineas = doc.splitTextToSize(liq.notas.trim(), ANCHO - 10) as string[];
    const altNota = lineas.length * 5 + 10;
    doc.setFillColor(...C_GRIS_F);
    doc.setDrawColor(...C_GRIS_B);
    doc.roundedRect(MARGEN, y, ANCHO, altNota, 2, 2, 'FD');
    doc.setTextColor(...C_TEXTO);
    doc.text(lineas, MARGEN + 5, y + 6);
    y += altNota + 8;
  }

  // ── Anexo de evidencias (fotos) ───────────────────────────

  const cobrosConFotos = liq.cobros.filter(c => c.fotos.length > 0);
  if (cobrosConFotos.length > 0) {
    doc.addPage();
    dibujarEncabezado(doc, 'LIQUIDACION DEL DIA — ANEXO DE EVIDENCIAS', fecha);
    y = 30;

    const FW   = 88;  // ancho foto mm (2 columnas en 182 mm con gap de 6)
    const FH   = 66;  // alto foto mm  (~3:4)
    const FGAP = 6;   // espacio entre fotos
    const COLS = 2;

    cobrosConFotos.forEach(cobro => {
      // Altura del bloque de cabecera: nombre + comentario (si lo hay)
      const comentario = cobro.comentario?.trim() ?? '';
      const lineasComentario = comentario
        ? (doc.splitTextToSize(comentario, ANCHO - 6) as string[])
        : [];
      const altCabecera = 6.5 + (lineasComentario.length > 0 ? lineasComentario.length * 4.5 + 4 : 0);

      if (y + altCabecera + FH > 285) {
        doc.addPage();
        dibujarEncabezado(doc, 'LIQUIDACION DEL DIA — ANEXO DE EVIDENCIAS', fecha);
        y = 30;
      }

      // Nombre del cobro
      doc.setFillColor(...C_GRIS_F);
      doc.setDrawColor(...C_GRIS_B);
      doc.rect(MARGEN, y, ANCHO, 6.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...C_TEXTO);
      doc.text(cobro.nombre || 'Sin nombre', MARGEN + 3, y + 4.4);
      y += 6.5;

      // Comentario (si existe)
      if (lineasComentario.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(...C_SUAVE);
        doc.text(lineasComentario, MARGEN + 3, y + 4);
        y += lineasComentario.length * 4.5 + 4;
        doc.setTextColor(...C_TEXTO);
      }

      y += 2; // espacio entre cabecera y primera fila de fotos

      // Fotos en grilla 2 col × 3 filas
      cobro.fotos.forEach((foto, idx) => {
        const col = idx % COLS;

        if (col === 0 && idx > 0) {
          y += FH + FGAP;
          if (y + FH > 285) {
            doc.addPage();
            dibujarEncabezado(doc, 'LIQUIDACION DEL DIA — ANEXO DE EVIDENCIAS', fecha);
            y = 30;
          }
        }

        const x = MARGEN + col * (FW + FGAP);
        try {
          const formato = foto.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(foto.dataUrl, formato, x, y, FW, FH);
        } catch {
          doc.setFillColor(220, 220, 220);
          doc.rect(x, y, FW, FH, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text('Imagen no disponible', x + FW / 2, y + FH / 2, { align: 'center' });
          doc.setTextColor(...C_TEXTO);
        }
      });

      // Avanzar Y al final de la ultima fila de fotos
      y += FH + FGAP * 2;
    });
  }

  // ── Descargar ─────────────────────────────────────────────

  doc.save(`liquidacion-${liq.fecha}.pdf`);
}
