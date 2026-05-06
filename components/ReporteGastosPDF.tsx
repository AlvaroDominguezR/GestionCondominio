import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottom: "1.5 solid #e5e7eb",
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  condoNombre:   { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#111827" },
  condoInfo:     { fontSize: 9,  color: "#6b7280", marginTop: 2 },
  reporteTitulo: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#111827", textAlign: "right" },
  reporteMes:    { fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 2 },
  // Resumen
  cards: { flexDirection: "row", gap: 10, marginBottom: 24 },
  card:  { flex: 1, backgroundColor: "#f9fafb", borderRadius: 6, padding: 12, border: "1 solid #e5e7eb" },
  cardLabel: { fontSize: 8,  color: "#6b7280", marginBottom: 4 },
  cardValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  // Sección
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 8, paddingBottom: 4, borderBottom: "1 solid #e5e7eb" },
  // Tabla
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "6 8", borderRadius: 4, marginBottom: 2 },
  tableRow:    { flexDirection: "row", padding: "5 8", borderBottom: "0.5 solid #f3f4f6" },
  colDepto:  { flex: 1.5, fontSize: 9 },
  colTorre:  { flex: 2,   fontSize: 9 },
  colMonto:  { flex: 1.5, fontSize: 9, textAlign: "right" },
  colFecha:  { flex: 1.5, fontSize: 9, textAlign: "center" },
  colDeptoH: { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colTorreH: { flex: 2,   fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colMontoH: { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "right" },
  colFechaH: { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  // Totales
  totalRow:   { flexDirection: "row", padding: "6 8", backgroundColor: "#f9fafb", borderRadius: 4, marginTop: 4 },
  totalLabel: { flex: 5,   fontSize: 9, fontFamily: "Helvetica-Bold", color: "#374151" },
  totalMonto: { flex: 1.5, fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "right" },
  // Footer
  footer:     { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

function formatMonto(monto: number) {
  return `$${monto.toLocaleString("es-CL")}`;
}

function formatFecha(fecha: string | Date | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CL");
}

type Gasto = {
  id: number;
  monto: number;
  estadoPago: string;
  fechaPago: string | Date | null;
  departamento: { numero: string; torre: { nombre: string } };
};

type Perfil = { nombre: string; direccion: string; comuna: string; telefono: string } | null;

type Props = {
  perfil: Perfil;
  mes: string;
  pagados: Gasto[];
  pendientes: Gasto[];
  atrasados: Gasto[];
  totales: {
    montoPagado: number;
    montoPendiente: number;
    montoAtrasado: number;
    totalDeptos: number;
  };
};

function TablaGastos({ gastos, colorMonto }: { gastos: Gasto[]; colorMonto: string }) {
  return (
    <>
      <View style={styles.tableHeader}>
        <Text style={styles.colDeptoH}>Departamento</Text>
        <Text style={styles.colTorreH}>Torre</Text>
        <Text style={styles.colFechaH}>Fecha pago</Text>
        <Text style={styles.colMontoH}>Monto</Text>
      </View>
      {gastos.map((g) => (
        <View key={g.id} style={styles.tableRow}>
          <Text style={[styles.colDepto, { color: "#374151" }]}>{g.departamento.numero || "S/N"}</Text>
          <Text style={[styles.colTorre,  { color: "#6b7280" }]}>{g.departamento.torre.nombre}</Text>
          <Text style={[styles.colFecha,  { color: "#6b7280" }]}>{formatFecha(g.fechaPago)}</Text>
          <Text style={[styles.colMonto,  { color: colorMonto }]}>{formatMonto(g.monto)}</Text>
        </View>
      ))}
    </>
  );
}

export function ReporteGastosPDF({ perfil, mes, pagados, pendientes, atrasados, totales }: Props) {
  const fechaGeneracion = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Encabezado */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.condoNombre}>{perfil?.nombre || "Condominio"}</Text>
              {perfil?.direccion ? <Text style={styles.condoInfo}>{perfil.direccion}{perfil.comuna ? `, ${perfil.comuna}` : ""}</Text> : null}
              {perfil?.telefono  ? <Text style={styles.condoInfo}>{perfil.telefono}</Text> : null}
            </View>
            <View>
              <Text style={styles.reporteTitulo}>Estado Gastos Comunes</Text>
              <Text style={styles.reporteMes}>{mes}</Text>
            </View>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total departamentos</Text>
            <Text style={[styles.cardValue, { color: "#111827" }]}>{totales.totalDeptos}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Pagados</Text>
            <Text style={[styles.cardValue, { color: "#16a34a" }]}>{pagados.length}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Pendientes</Text>
            <Text style={[styles.cardValue, { color: "#d97706" }]}>{pendientes.length}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Atrasados</Text>
            <Text style={[styles.cardValue, { color: "#dc2626" }]}>{atrasados.length}</Text>
          </View>
        </View>

        {/* Pagados */}
        {pagados.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pagados ({pagados.length})</Text>
            <TablaGastos gastos={pagados} colorMonto="#16a34a" />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total cobrado</Text>
              <Text style={[styles.totalMonto, { color: "#16a34a" }]}>{formatMonto(totales.montoPagado)}</Text>
            </View>
          </View>
        )}

        {/* Pendientes */}
        {pendientes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pendientes ({pendientes.length})</Text>
            <TablaGastos gastos={pendientes} colorMonto="#d97706" />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total pendiente</Text>
              <Text style={[styles.totalMonto, { color: "#d97706" }]}>{formatMonto(totales.montoPendiente)}</Text>
            </View>
          </View>
        )}

        {/* Atrasados */}
        {atrasados.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atrasados ({atrasados.length})</Text>
            <TablaGastos gastos={atrasados} colorMonto="#dc2626" />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total atrasado</Text>
              <Text style={[styles.totalMonto, { color: "#dc2626" }]}>{formatMonto(totales.montoAtrasado)}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{perfil?.nombre || "Condominio"} · Estado Gastos Comunes {mes}</Text>
          <Text style={styles.footerText}>Generado el {fechaGeneracion}</Text>
        </View>

      </Page>
    </Document>
  );
}