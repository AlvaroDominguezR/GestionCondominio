import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 40, color: "#1a1a1a" },
  header: { marginBottom: 20, borderBottom: "1.5 solid #e5e7eb", paddingBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  condoNombre:    { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#111827" },
  condoInfo:      { fontSize: 9, color: "#6b7280", marginTop: 2 },
  reporteTitulo:  { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#111827", textAlign: "right" },
  reportePeriodo: { fontSize: 9, color: "#6b7280", textAlign: "right", marginTop: 2 },
  // Mes header
  mesHeader: { backgroundColor: "#111827", borderRadius: 6, padding: "8 12", marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mesLabel:  { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  mesBalance:{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  // Cards resumen mes
  cards: { flexDirection: "row", gap: 8, marginBottom: 14 },
  card:  { flex: 1, backgroundColor: "#f9fafb", borderRadius: 5, padding: 8, border: "1 solid #e5e7eb" },
  cardLabel: { fontSize: 7, color: "#6b7280", marginBottom: 3 },
  cardValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  // Sección
  section:      { marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#374151", marginBottom: 4, paddingBottom: 3, borderBottom: "0.5 solid #e5e7eb" },
  // Tabla
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "4 6", borderRadius: 3, marginBottom: 1 },
  tableRow:    { flexDirection: "row", padding: "3 6", borderBottom: "0.5 solid #f9fafb" },
  // Gastos cols
  colDepto:  { flex: 1, fontSize: 8 },
  colTorre:  { flex: 1.5, fontSize: 8 },
  colMeses:  { flex: 2.5, fontSize: 8 },
  colMonto:  { flex: 1.5, fontSize: 8, textAlign: "right" },
  colDeptoH: { flex: 1, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colTorreH: { flex: 1.5, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colMesesH: { flex: 2.5, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colMontoH: { flex: 1.5, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "right" },
  // Ing/Egr cols
  colDesc:  { flex: 4, fontSize: 8 },
  colFecha: { flex: 1.5, fontSize: 8, textAlign: "center" },
  colMon:   { flex: 1.5, fontSize: 8, textAlign: "right" },
  colDescH: { flex: 4, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colFechaH:{ flex: 1.5, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  colMonH:  { flex: 1.5, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "right" },
  // Total row
  totalRow:   { flexDirection: "row", padding: "4 6", backgroundColor: "#f3f4f6", borderRadius: 3, marginTop: 2 },
  totalLabel: { flex: 5.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#374151" },
  totalMonto: { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right" },
  // Resumen final
  resumenPage: { fontFamily: "Helvetica", fontSize: 10, padding: 40, color: "#1a1a1a" },
  resumenHeader: { marginBottom: 20, borderBottom: "1.5 solid #e5e7eb", paddingBottom: 14, flexDirection: "row", justifyContent: "space-between" },
  resumenTableHeader: { flexDirection: "row", backgroundColor: "#111827", padding: "7 8", borderRadius: 4, marginBottom: 2 },
  resumenRow:    { flexDirection: "row", padding: "6 8", borderBottom: "0.5 solid #f3f4f6" },
  resumenRowAlt: { flexDirection: "row", padding: "6 8", borderBottom: "0.5 solid #f3f4f6", backgroundColor: "#f9fafb" },
  resumenTotalRow: { flexDirection: "row", padding: "8 8", backgroundColor: "#f3f4f6", borderRadius: 4, marginTop: 4 },
  rColMes:  { flex: 2.5, fontSize: 9 },
  rColVal:  { flex: 2, fontSize: 9, textAlign: "right" },
  rColMesH: { flex: 2.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  rColValH: { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "right" },
  rColMesT: { flex: 2.5, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111827" },
  rColValT: { flex: 2, fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "right" },
  // Footer
  footer:     { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

function fmt(monto: number) { return `$${monto.toLocaleString("es-CL")}`; }
function fmtFecha(f: string | Date) { return new Date(f).toLocaleDateString("es-CL"); }

type GastoPagado = { numero: string; torre: string; mesesLabel: string; totalMonto: number };
type Movimiento  = { id: number; descripcion: string; monto: number; fecha: string | Date };
type MesDetalle  = { label: string; gastosPagados: GastoPagado[]; ingresos: Movimiento[]; egresos: Movimiento[]; totalGastos: number; totalIngresos: number; totalEgresos: number; balance: number; saldoApertura: number; saldoCierre: number };
type Perfil      = { nombre: string; direccion: string; comuna: string; telefono: string } | null;
type Totales     = { totalGastos: number; totalIngresos: number; totalEgresos: number; balance: number; saldoInicial: number; saldoFinal: number };

type Props = { perfil: Perfil; periodo: string; meses: MesDetalle[]; totales: Totales };

function PaginaMes({ perfil, mes, periodo, isFirst }: { perfil: Perfil; mes: MesDetalle; periodo: string; isFirst: boolean }) {
  const fechaGen = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Page size="A4" style={styles.page}>
      {/* Header solo en primera página */}
      {isFirst && (
        <View style={styles.header}>
          <View>
            <Text style={styles.condoNombre}>{perfil?.nombre || "Condominio"}</Text>
            {perfil?.direccion ? <Text style={styles.condoInfo}>{perfil.direccion}{perfil.comuna ? `, ${perfil.comuna}` : ""}</Text> : null}
          </View>
          <View>
            <Text style={styles.reporteTitulo}>Reporte de Finanzas</Text>
            <Text style={styles.reportePeriodo}>{periodo}</Text>
          </View>
        </View>
      )}

      {/* Header del mes */}
      <View style={styles.mesHeader}>
        <Text style={styles.mesLabel}>{mes.label}</Text>
        <Text style={styles.mesBalance}>Balance: {fmt(mes.balance)}</Text>
      </View>

      {/* Cards resumen */}
      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Saldo apertura</Text>
          <Text style={[styles.cardValue, { color: "#111827" }]}>{fmt(mes.saldoApertura)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Gastos comunes</Text>
          <Text style={[styles.cardValue, { color: "#16a34a" }]}>{fmt(mes.totalGastos)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Otros ingresos</Text>
          <Text style={[styles.cardValue, { color: "#16a34a" }]}>{fmt(mes.totalIngresos)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Egresos</Text>
          <Text style={[styles.cardValue, { color: "#dc2626" }]}>{fmt(mes.totalEgresos)}</Text>
        </View>
      </View>
      <View style={[styles.cards, { marginTop: 4 }]}> 
        <View style={[styles.card, { flex: 1, minWidth: 0 }]}> 
          <Text style={styles.cardLabel}>Saldo cierre</Text>
          <Text style={[styles.cardValue, { color: mes.saldoCierre >= 0 ? "#16a34a" : "#dc2626" }]}>{fmt(mes.saldoCierre)}</Text>
        </View>
      </View>

      {/* Gastos comunes */}
      {mes.gastosPagados.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gastos Comunes Cobrados</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDeptoH}>Depto.</Text>
            <Text style={styles.colTorreH}>Torre</Text>
            <Text style={styles.colMesesH}>Meses pagados</Text>
            <Text style={styles.colMontoH}>Total</Text>
          </View>
          {mes.gastosPagados.map((g, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.colDepto, { color: "#374151" }]}>{g.numero}</Text>
              <Text style={[styles.colTorre, { color: "#6b7280" }]}>{g.torre}</Text>
              <Text style={[styles.colMeses, { color: "#6b7280" }]}>{g.mesesLabel}</Text>
              <Text style={[styles.colMonto, { color: "#16a34a" }]}>{fmt(g.totalMonto)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total gastos comunes</Text>
            <Text style={[styles.totalMonto, { color: "#16a34a" }]}>{fmt(mes.totalGastos)}</Text>
          </View>
        </View>
      )}

      {/* Otros ingresos */}
      {mes.ingresos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Otros Ingresos</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescH}>Descripción</Text>
            <Text style={styles.colFechaH}>Fecha</Text>
            <Text style={styles.colMonH}>Monto</Text>
          </View>
          {mes.ingresos.map((i) => (
            <View key={i.id} style={styles.tableRow}>
              <Text style={[styles.colDesc, { color: "#374151" }]}>{i.descripcion}</Text>
              <Text style={[styles.colFecha, { color: "#6b7280" }]}>{fmtFecha(i.fecha)}</Text>
              <Text style={[styles.colMon, { color: "#16a34a" }]}>{fmt(i.monto)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total otros ingresos</Text>
            <Text style={[styles.totalMonto, { color: "#16a34a" }]}>{fmt(mes.totalIngresos)}</Text>
          </View>
        </View>
      )}

      {/* Egresos */}
      {mes.egresos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Egresos</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescH}>Descripción</Text>
            <Text style={styles.colFechaH}>Fecha</Text>
            <Text style={styles.colMonH}>Monto</Text>
          </View>
          {mes.egresos.map((e) => (
            <View key={e.id} style={styles.tableRow}>
              <Text style={[styles.colDesc, { color: "#374151" }]}>{e.descripcion}</Text>
              <Text style={[styles.colFecha, { color: "#6b7280" }]}>{fmtFecha(e.fecha)}</Text>
              <Text style={[styles.colMon, { color: "#dc2626" }]}>{fmt(e.monto)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total egresos</Text>
            <Text style={[styles.totalMonto, { color: "#dc2626" }]}>{fmt(mes.totalEgresos)}</Text>
          </View>
        </View>
      )}

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>{perfil?.nombre || "Condominio"} · {mes.label}</Text>
        <Text style={styles.footerText}>Generado el {new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}</Text>
      </View>
    </Page>
  );
}

export function ReporteFinanzasAnualPDF({ perfil, periodo, meses, totales }: Props) {
  return (
    <Document>
      {/* Una página por mes */}
      {meses.map((mes, i) => (
        <PaginaMes key={mes.label} perfil={perfil} mes={mes} periodo={periodo} isFirst={i === 0} />
      ))}

      {/* Página resumen final */}
      <Page size="A4" style={styles.resumenPage}>
        <View style={styles.resumenHeader}>
          <View>
            <Text style={styles.condoNombre}>{perfil?.nombre || "Condominio"}</Text>
            {perfil?.direccion ? <Text style={styles.condoInfo}>{perfil.direccion}</Text> : null}
          </View>
          <View>
            <Text style={styles.reporteTitulo}>Resumen del Período</Text>
            <Text style={styles.reportePeriodo}>{periodo}</Text>
          </View>
        </View>

        <View style={styles.resumenTableHeader}>
          <Text style={styles.rColMesH}>Mes</Text>
          <Text style={styles.rColValH}>Gastos comunes</Text>
          <Text style={styles.rColValH}>Otros ingresos</Text>
          <Text style={styles.rColValH}>Egresos</Text>
          <Text style={styles.rColValH}>Balance</Text>
        </View>

        {meses.map((m, i) => (
          <View key={m.label} style={i % 2 === 0 ? styles.resumenRow : styles.resumenRowAlt}>
            <Text style={[styles.rColMes, { color: "#374151" }]}>{m.label}</Text>
            <Text style={[styles.rColVal, { color: "#16a34a" }]}>{fmt(m.totalGastos)}</Text>
            <Text style={[styles.rColVal, { color: "#16a34a" }]}>{fmt(m.totalIngresos)}</Text>
            <Text style={[styles.rColVal, { color: m.totalEgresos > 0 ? "#dc2626" : "#9ca3af" }]}>{fmt(m.totalEgresos)}</Text>
            <Text style={[styles.rColVal, { color: m.balance >= 0 ? "#111827" : "#dc2626", fontFamily: "Helvetica-Bold" }]}>{fmt(m.balance)}</Text>
          </View>
        ))}

        <View style={styles.resumenTotalRow}>
          <Text style={styles.rColMesT}>TOTAL PERÍODO</Text>
          <Text style={[styles.rColValT, { color: "#16a34a" }]}>{fmt(totales.totalGastos)}</Text>
          <Text style={[styles.rColValT, { color: "#16a34a" }]}>{fmt(totales.totalIngresos)}</Text>
          <Text style={[styles.rColValT, { color: "#dc2626" }]}>{fmt(totales.totalEgresos)}</Text>
          <Text style={[styles.rColValT, { color: totales.balance >= 0 ? "#16a34a" : "#dc2626" }]}>{fmt(totales.balance)}</Text>
        </View>
        <View style={[styles.resumenRow, { marginTop: 10, paddingTop: 10, borderTop: "0.5 solid #e5e7eb" }]}> 
          <Text style={[styles.rColMes, { color: "#374151", flex: 6 }]}>Saldo apertura del período</Text>
          <Text style={[styles.rColVal, { color: "#111827", flex: 2 }]}>{fmt(totales.saldoInicial)}</Text>
        </View>
        <View style={[styles.resumenRowAlt]}> 
          <Text style={[styles.rColMes, { color: "#374151", flex: 6 }]}>Saldo cierre del período</Text>
          <Text style={[styles.rColVal, { color: totales.saldoFinal >= 0 ? "#16a34a" : "#dc2626", flex: 2 }]}>{fmt(totales.saldoFinal)}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{perfil?.nombre || "Condominio"} · Resumen {periodo}</Text>
          <Text style={styles.footerText}>Generado el {new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}</Text>
        </View>
      </Page>
    </Document>
  );
}