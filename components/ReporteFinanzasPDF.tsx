import React from "react";
import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";

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
  condoNombre: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#111827" },
  condoInfo:   { fontSize: 9, color: "#6b7280", marginTop: 2 },
  reporteTitulo: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#111827", textAlign: "right" },
  reporteMes:    { fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 2 },
  cards: { flexDirection: "row", gap: 10, marginBottom: 24 },
  card:  { flex: 1, backgroundColor: "#f9fafb", borderRadius: 6, padding: 12, border: "1 solid #e5e7eb" },
  cardLabel: { fontSize: 8, color: "#6b7280", marginBottom: 4 },
  cardValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 8, paddingBottom: 4, borderBottom: "1 solid #e5e7eb" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "6 8", borderRadius: 4, marginBottom: 2 },
  tableRow:    { flexDirection: "row", padding: "5 8", borderBottom: "0.5 solid #f3f4f6" },
  colDesc:     { flex: 3, fontSize: 9, color: "#374151" },
  colMeses:    { flex: 2, fontSize: 9, color: "#6b7280" },
  colFecha:    { flex: 1.5, fontSize: 9, color: "#374151", textAlign: "center" },
  colMonto:    { flex: 1.5, fontSize: 9, textAlign: "right" },
  colDescH:    { flex: 3, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colMesesH:   { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colFechaH:   { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  colMontoH:   { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "right" },
  totalRow: { flexDirection: "row", padding: "6 8", backgroundColor: "#f9fafb", borderRadius: 4, marginTop: 4 },
  totalLabel: { flex: 4.5, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#374151" },
  totalMonto: { flex: 1.5, fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "right" },
  balanceBox: { backgroundColor: "#111827", borderRadius: 8, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  balanceLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  balanceValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

const MESES_ABREV = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatMonto(monto: number) {
  return `$${monto.toLocaleString("es-CL")}`;
}

function formatFecha(fecha: string | Date) {
  return new Date(fecha).toLocaleDateString("es-CL");
}

type Ingreso  = { id: number; descripcion: string; monto: number; fecha: string | Date };
type Egreso   = { id: number; descripcion: string; monto: number; fecha: string | Date };
type GastoPagado = {
  id: number;
  monto: number;
  periodo: string | Date;
  fechaPago: string | Date | null;
  departamento: { numero: string; torre: { nombre: string } };
};
type Perfil   = { nombre: string; direccion: string; comuna: string; ciudad: string; telefono: string; email: string } | null;
type Totales  = { totalIngresos: number; totalEgresos: number; totalGastosPagados: number; balance: number };

type Props = {
  perfil: Perfil;
  mes: string;
  ingresos: Ingreso[];
  egresos: Egreso[];
  gastosPagados: GastoPagado[];
  totales: Totales;
};

// Agrupar gastos por departamento
type GastoAgrupado = {
  key: string;
  depto: string;
  torre: string;
  cantMeses: number;
  mesesLabel: string;
  totalMonto: number;
};

function agruparGastos(gastos: GastoPagado[]): GastoAgrupado[] {
  const mapa: Record<string, GastoAgrupado & { mesesPorAnio: Record<number, string[]> }> = {};

  for (const g of gastos) {
    const key    = `${g.departamento.numero}-${g.departamento.torre.nombre}`;
    const fecha  = new Date(g.periodo);
    const anio   = fecha.getFullYear();
    const mesIdx = fecha.getMonth();

    if (!mapa[key]) {
      mapa[key] = {
        key,
        depto:         g.departamento.numero || "S/N",
        torre:         g.departamento.torre.nombre,
        cantMeses:     0,
        mesesLabel:    "",
        totalMonto:    0,
        mesesPorAnio:  {},
      };
    }

    if (!mapa[key].mesesPorAnio[anio]) {
      mapa[key].mesesPorAnio[anio] = [];
    }

    mapa[key].mesesPorAnio[anio].push(MESES_ABREV[mesIdx]);
    mapa[key].cantMeses  += 1;
    mapa[key].totalMonto += g.monto;
  }

  // Construir el label agrupado por año
  for (const item of Object.values(mapa)) {
    const partes = Object.entries(item.mesesPorAnio)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([anio, meses]) => `${anio}: ${meses.join(", ")}`);
    item.mesesLabel = partes.join(" / ");
  }

  return Object.values(mapa).sort((a, b) => a.torre.localeCompare(b.torre) || a.depto.localeCompare(b.depto));
}

export function ReporteFinanzasPDF({ perfil, mes, ingresos, egresos, gastosPagados, totales }: Props) {
  const fechaGeneracion = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  const gastosAgrupados = agruparGastos(gastosPagados);

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
              <Text style={styles.reporteTitulo}>Reporte de Finanzas</Text>
              <Text style={styles.reporteMes}>{mes}</Text>
            </View>
          </View>
        </View>

        {/* Tarjetas resumen */}
        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Gastos comunes cobrados</Text>
            <Text style={[styles.cardValue, { color: "#16a34a" }]}>{formatMonto(totales.totalGastosPagados)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Otros ingresos</Text>
            <Text style={[styles.cardValue, { color: "#16a34a" }]}>{formatMonto(totales.totalIngresos)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Egresos</Text>
            <Text style={[styles.cardValue, { color: "#dc2626" }]}>{formatMonto(totales.totalEgresos)}</Text>
          </View>
        </View>

        {/* Gastos comunes agrupados por depto */}
        {gastosAgrupados.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gastos Comunes Cobrados</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescH}>Departamento</Text>
              <Text style={styles.colMesesH}>Torre</Text>
              <Text style={styles.colMesesH}>Meses pagados</Text>
              <Text style={styles.colMontoH}>Total</Text>
            </View>
            {gastosAgrupados.map((g) => (
              <View key={g.key} style={styles.tableRow}>
                <Text style={styles.colDesc}>{g.depto}</Text>
                <Text style={[styles.colMeses, { color: "#6b7280" }]}>{g.torre}</Text>
                <Text style={[styles.colMeses, { color: "#6b7280" }]}>
                  {g.cantMeses} {g.cantMeses === 1 ? "mes" : "meses"} ({g.mesesLabel})
                </Text>
                <Text style={[styles.colMonto, { color: "#16a34a" }]}>{formatMonto(g.totalMonto)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total gastos comunes</Text>
              <Text style={[styles.totalMonto, { color: "#16a34a" }]}>{formatMonto(totales.totalGastosPagados)}</Text>
            </View>
          </View>
        )}

        {/* Otros ingresos */}
        {ingresos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Otros Ingresos</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescH}>Descripción</Text>
              <Text style={styles.colFechaH}>Fecha</Text>
              <Text style={styles.colMontoH}>Monto</Text>
            </View>
            {ingresos.map((i) => (
              <View key={i.id} style={styles.tableRow}>
                <Text style={styles.colDesc}>{i.descripcion}</Text>
                <Text style={[styles.colFecha, { color: "#6b7280" }]}>{formatFecha(i.fecha)}</Text>
                <Text style={[styles.colMonto, { color: "#16a34a" }]}>{formatMonto(i.monto)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total otros ingresos</Text>
              <Text style={[styles.totalMonto, { color: "#16a34a" }]}>{formatMonto(totales.totalIngresos)}</Text>
            </View>
          </View>
        )}

        {/* Egresos */}
        {egresos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Egresos</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescH}>Descripción</Text>
              <Text style={styles.colFechaH}>Fecha</Text>
              <Text style={styles.colMontoH}>Monto</Text>
            </View>
            {egresos.map((e) => (
              <View key={e.id} style={styles.tableRow}>
                <Text style={styles.colDesc}>{e.descripcion}</Text>
                <Text style={[styles.colFecha, { color: "#6b7280" }]}>{formatFecha(e.fecha)}</Text>
                <Text style={[styles.colMonto, { color: "#dc2626" }]}>{formatMonto(e.monto)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total egresos</Text>
              <Text style={[styles.totalMonto, { color: "#dc2626" }]}>{formatMonto(totales.totalEgresos)}</Text>
            </View>
          </View>
        )}

        {/* Balance final */}
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Balance neto del mes</Text>
          <Text style={styles.balanceValue}>{formatMonto(totales.balance)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{perfil?.nombre || "Condominio"} · Reporte {mes}</Text>
          <Text style={styles.footerText}>Generado el {fechaGeneracion}</Text>
        </View>

      </Page>
    </Document>
  );
}