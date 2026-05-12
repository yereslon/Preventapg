import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { OrderSummary } from '../types/order';

const AZUL      = '#1a3a6b';
const AZUL_MID  = '#2554a0';
const ROJO      = '#c0392b';
const GRIS_BG   = '#f5f6fa';
const GRIS_BD   = '#dde1ea';
const TEXTO     = '#2c3e50';
const SUAVE     = '#6c7a89';
const BLANCO    = '#ffffff';
const BLANCO_75 = '#bfcbde'; // blanco al 75% sobre fondo azul
const BLANCO_60 = '#a8bdcf'; // blanco al 60%

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: TEXTO, backgroundColor: BLANCO },

  /* Header */
  header: {
    backgroundColor: AZUL,
    paddingHorizontal: 32,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', columnGap: 10 },
  badge: {
    backgroundColor: ROJO,
    width: 36, height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText:   { color: BLANCO, fontFamily: 'Helvetica-Bold', fontSize: 13 },
  companyName: { color: BLANCO, fontFamily: 'Helvetica-Bold', fontSize: 16 },
  docTitle:    { color: BLANCO_75, fontSize: 9, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  orderNum:    { color: BLANCO, fontFamily: 'Helvetica-Bold', fontSize: 11 },
  orderDate:   { color: BLANCO_60, fontSize: 8, marginTop: 2 },

  /* Body */
  body: { paddingHorizontal: 32, paddingVertical: 20 },

  /* Info cliente */
  infoBox: {
    backgroundColor: GRIS_BG,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GRIS_BD,
    borderStyle: 'solid',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    columnGap: 30,
    marginBottom: 20,
  },
  infoLabel: { color: SUAVE, fontSize: 8, marginBottom: 2 },
  infoValue: { color: TEXTO, fontFamily: 'Helvetica-Bold', fontSize: 10 },

  /* Tabla */
  tableHeader: {
    backgroundColor: AZUL_MID,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    marginBottom: 1,
  },
  thText: { color: BLANCO, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: GRIS_BD,
    borderBottomStyle: 'solid',
  },
  tableRowAlt: { backgroundColor: GRIS_BG },
  colProducto: { flex: 4 },
  colCant:     { flex: 1 },
  colPrecio:   { flex: 2 },
  colSubtotal: { flex: 2 },
  tdBold: { fontFamily: 'Helvetica-Bold' },

  /* Total */
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    columnGap: 16,
    marginTop: 4,
  },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: TEXTO },
  totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: ROJO },

  /* Notas */
  notasBox: {
    backgroundColor: GRIS_BG,
    borderWidth: 1,
    borderColor: GRIS_BD,
    borderStyle: 'solid',
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
  },
  notasLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: SUAVE, marginBottom: 4 },
  notasText:  { color: TEXTO, fontSize: 9 },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 24, left: 32, right: 32,
    borderTopWidth: 1,
    borderTopColor: GRIS_BD,
    borderTopStyle: 'solid',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { color: SUAVE, fontSize: 7 },
});

function fmt(v: number) {
  return 'S/. ' + v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function OrderPDF({ summary }: { summary: OrderSummary }) {
  return (
    <Document title={`Pedido ${summary.numeroPedido}`} author="Plásticos Guerrero">
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.badge}>
              <Text style={s.badgeText}>PG</Text>
            </View>
            <View>
              <Text style={s.companyName}>Plásticos Guerrero</Text>
              <Text style={s.docTitle}>ORDEN DE PREVENTA</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.orderNum}>{summary.numeroPedido}</Text>
            <Text style={s.orderDate}>{summary.fecha}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={s.body}>

          {/* Info cliente */}
          <View style={s.infoBox}>
            <View>
              <Text style={s.infoLabel}>CLIENTE</Text>
              <Text style={s.infoValue}>{summary.form.nombre}</Text>
            </View>
            <View>
              <Text style={s.infoLabel}>ZONA DE ENTREGA</Text>
              <Text style={s.infoValue}>{summary.form.ubicacion}</Text>
            </View>
            <View>
              <Text style={s.infoLabel}>FECHA</Text>
              <Text style={s.infoValue}>{summary.fecha}</Text>
            </View>
          </View>

          {/* Encabezado tabla */}
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.colProducto]}>Producto</Text>
            <Text style={[s.thText, s.colCant]}>Cant.</Text>
            <Text style={[s.thText, s.colPrecio]}>P. Unit.</Text>
            <Text style={[s.thText, s.colSubtotal]}>Subtotal</Text>
          </View>

          {/* Filas */}
          {summary.items.map((item, i) => (
            <View key={item.id} style={[s.tableRow, i % 2 !== 0 ? s.tableRowAlt : {}]}>
              <View style={s.colProducto}>
                <Text style={s.tdBold}>{item.nombre}</Text>
                <Text style={{ color: SUAVE, fontSize: 7, marginTop: 1 }}>
                  {item.categoria} · {item.unidad}
                </Text>
              </View>
              <Text style={s.colCant}>{item.cantidad}</Text>
              <Text style={s.colPrecio}>{fmt(item.precio)}</Text>
              <Text style={[s.colSubtotal, s.tdBold, { color: ROJO }]}>
                {fmt(item.precio * item.cantidad)}
              </Text>
            </View>
          ))}

          {/* Total */}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>TOTAL</Text>
            <Text style={s.totalValue}>{fmt(summary.total)}</Text>
          </View>

          {/* Notas */}
          {summary.form.notas.trim() !== '' && (
            <View style={s.notasBox}>
              <Text style={s.notasLabel}>NOTAS ADICIONALES</Text>
              <Text style={s.notasText}>{summary.form.notas}</Text>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Plásticos Guerrero — Documento generado automáticamente</Text>
          <Text style={s.footerText}>{summary.numeroPedido}</Text>
        </View>

      </Page>
    </Document>
  );
}
