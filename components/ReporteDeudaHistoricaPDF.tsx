import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page:        { fontFamily: "Helvetica", fontSize: 10, padding: 40, color: "#1a1a1a" },
  header:      { marginBottom: 20, borderBottom: "1.5 solid #e5e7eb", paddingBottom: 14, flexDirection: "row", justifyContent: "space-between" },
  condoNombre: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#111827" },
  condoInfo:   { fontSize: 9, color: "#6b7280", marginTop: 2 },
  titulo:      { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#111827", textAlign: "right" },
  subtitulo:   { fontSize: 9, color: "#6b7280", textAlign: "right", marginTop: 2 },
  infoBox:     { flexDirection: "row", gap: 10, marginBottom: 20 },
  infoCard:    { flex: 1, backgroundColor: "#f9fafb", borderRadius: 6, padding: 10, border: "1 solid #e5e7eb" },
  infoLabel:   { fontSize: 8, color: "#6b7280", marginBottom: 3 },
  infoValue:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
  sectionTitle:{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 8, paddingBottom: 4, borderBottom: "1 solid #e5e7eb" },
  tableHeader: { flexDirection: "row", backgroundColor: "#111827", padding: "6 8", borderRadius: 4, marginBottom: 2 },
  tableRow:    { flexDirection: "row", padding: "5 8", borderBottom: "0.5 solid #f3f4f6" },
  tableRowAlt: { flexDirection: "row", padding: "5 8", borderBottom: "0.5 solid #f3f4f6", backgroundColor: "#fef2f2" },
  tableRowPag: { flexDirection: "row", padding: "5 8", borderBottom: "0.5 solid #f3f4f6", backgroundColor: "#f0fdf4" },
  colPeriodo:  { flex: 2, fontSize: 9 },
  colMonto:    { flex: 1.5, fontSize: 9, textAlign: "right" },
  colEstado:   { flex: 1.5, fontSize: 9, textAlign: "center" },
  colFecha:    { flex: 2, fontSize: 9, textAlign: "center" },
  colPeriodoH: { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  colMontoH:   { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "right" },
  colEstadoH:  { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "center" },
  colFechaH:   { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "center" },
  totalRow:    { flexDirection: "row", padding: "8 8", marginTop: 4, borderRadius: 4 },
  totalLabel:  { flex: 3.5, fontSize: 9, fontFamily: "Helvetica-Bold" },
  totalMonto:  { flex: 1.5, fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "right" },
  deudaBox:    { backgroundColor: "#fef2f2", border: "1 solid #fecaca", borderRadius: 8, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  deudaLabel:  { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#dc2626" },
  deudaValue:  { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#dc2626" },
  footer:      { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText:  { fontSize: 8, color: "#9ca3af" },
});

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function formatPeriodo(periodo: string | Date) {
  const d = new Date(periodo);
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
function formatFecha(f: string | Date | null) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-CL");
}
function fmt(m: number) { return `$${m.toLocaleString("es-CL")}`; }

type Gasto = { id: number; monto: number; periodo: string | Date; estadoPago: string; fechaPago: string | Date | null };
type Perfil = { nombre: string; direccion: string; comuna: string; telefono: string } | null;
type Props = {
  perfil: Perfil;
  depto: { numero: string; torre: { nombre: string; sector: string }; dueno: { nombre: string } | null };
  gastos: Gasto[];
  totalDeuda: number;
  totalPagado: number;
};

export function ReporteDeudaHistoricaPDF({ perfil, depto, gastos, totalDeuda, totalPagado }: Props) {
  const fechaGen = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  const pendientes = gastos.filter((g) => g.estadoPago === "HISTORICO");
  const pagados    = gastos.filter((g) => g.estadoPago === "HISTORICO_PAGADO");

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          <View>
            <Text style={styles.condoNombre}>{perfil?.nombre || "Condominio"}</Text>
            {perfil?.direccion ? <Text style={styles.condoInfo}>{perfil.direccion}{perfil.comuna ? `, ${perfil.comuna}` : ""}</Text> : null}
            {perfil?.telefono  ? <Text style={styles.condoInfo}>{perfil.telefono}</Text> : null}
          </View>
          <View>
            <Text style={styles.titulo}>Deuda Histórica</Text>
            <Text style={styles.subtitulo}>Depto. {depto.numero || "S/N"} · {depto.torre.nombre} · Sector {depto.torre.sector}</Text>
          </View>
        </View>

        {/* Info depto */}
        <View style={styles.infoBox}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Departamento</Text>
            <Text style={styles.infoValue}>{depto.numero || "S/N"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Torre</Text>
            <Text style={styles.infoValue}>{depto.torre.nombre} · Sector {depto.torre.sector}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Dueño legal</Text>
            <Text style={styles.infoValue}>{depto.dueno?.nombre ?? "—"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Total meses</Text>
            <Text style={styles.infoValue}>{gastos.length} meses</Text>
          </View>
        </View>

        {/* Pendientes */}
        {pendientes.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Meses con Deuda Pendiente ({pendientes.length})</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colPeriodoH}>Período</Text>
              <Text style={styles.colMontoH}>Monto</Text>
              <Text style={styles.colEstadoH}>Estado</Text>
              <Text style={styles.colFechaH}>Fecha pago</Text>
            </View>
            {pendientes.map((g, i) => (
              <View key={g.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.colPeriodo, { color: "#374151" }]}>{formatPeriodo(g.periodo)}</Text>
                <Text style={[styles.colMonto,  { color: "#dc2626" }]}>{fmt(g.monto)}</Text>
                <Text style={[styles.colEstado, { color: "#dc2626" }]}>Pendiente</Text>
                <Text style={[styles.colFecha,  { color: "#9ca3af" }]}>—</Text>
              </View>
            ))}
            <View style={[styles.totalRow, { backgroundColor: "#fef2f2" }]}>
              <Text style={[styles.totalLabel, { color: "#dc2626" }]}>Total deuda pendiente</Text>
              <Text style={[styles.totalMonto, { color: "#dc2626" }]}>{fmt(totalDeuda)}</Text>
            </View>
          </View>
        )}

        {/* Pagados */}
        {pagados.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Meses Pagados ({pagados.length})</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colPeriodoH}>Período</Text>
              <Text style={styles.colMontoH}>Monto</Text>
              <Text style={styles.colEstadoH}>Estado</Text>
              <Text style={styles.colFechaH}>Fecha pago</Text>
            </View>
            {pagados.map((g) => (
              <View key={g.id} style={styles.tableRowPag}>
                <Text style={[styles.colPeriodo, { color: "#374151" }]}>{formatPeriodo(g.periodo)}</Text>
                <Text style={[styles.colMonto,  { color: "#16a34a" }]}>{fmt(g.monto)}</Text>
                <Text style={[styles.colEstado, { color: "#16a34a" }]}>Pagado</Text>
                <Text style={[styles.colFecha,  { color: "#6b7280" }]}>{formatFecha(g.fechaPago)}</Text>
              </View>
            ))}
            <View style={[styles.totalRow, { backgroundColor: "#f0fdf4" }]}>
              <Text style={[styles.totalLabel, { color: "#16a34a" }]}>Total pagado históricamente</Text>
              <Text style={[styles.totalMonto, { color: "#16a34a" }]}>{fmt(totalPagado)}</Text>
            </View>
          </View>
        )}

        {/* Deuda total */}
        <View style={styles.deudaBox}>
          <Text style={styles.deudaLabel}>Deuda histórica pendiente</Text>
          <Text style={styles.deudaValue}>{fmt(totalDeuda)}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{perfil?.nombre || "Condominio"} · Deuda Histórica Depto. {depto.numero || "S/N"}</Text>
          <Text style={styles.footerText}>Generado el {fechaGen}</Text>
        </View>

      </Page>
    </Document>
  );
}