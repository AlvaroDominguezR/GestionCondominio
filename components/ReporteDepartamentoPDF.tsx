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
    marginBottom: 20,
    borderBottom: "1.5 solid #e5e7eb",
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  condoNombre:   { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#111827" },
  condoInfo:     { fontSize: 9, color: "#6b7280", marginTop: 2 },
  reporteTitulo: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#111827", textAlign: "right" },
  reporteSub:    { fontSize: 9, color: "#6b7280", textAlign: "right", marginTop: 2 },
  infoBox: { flexDirection: "row", gap: 10, marginBottom: 20 },
  infoCard: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 6, padding: 10, border: "1 solid #e5e7eb" },
  infoLabel: { fontSize: 8, color: "#6b7280", marginBottom: 3 },
  infoValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
  section:      { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 6, paddingBottom: 4, borderBottom: "1 solid #e5e7eb" },
  subLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 4, marginTop: 6 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "5 8", borderRadius: 4, marginBottom: 2 },
  tableRow:    { flexDirection: "row", padding: "4 8", borderBottom: "0.5 solid #f3f4f6" },
  totalRow:    { flexDirection: "row", padding: "5 8", backgroundColor: "#f9fafb", borderRadius: 4, marginTop: 3 },
  totalLabel:  { flex: 5, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#374151" },
  totalMonto:  { flex: 1.5, fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "right" },
  // Residentes
  colNombre:  { flex: 3, fontSize: 9 },
  colRut:     { flex: 2, fontSize: 9 },
  colTel:     { flex: 2, fontSize: 9 },
  colJefe:    { flex: 1, fontSize: 9, textAlign: "center" },
  colNombreH: { flex: 3, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colRutH:    { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colTelH:    { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colJefeH:   { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  // Pagos agrupados (pagados)
  colMeses:   { flex: 3, fontSize: 9, color: "#6b7280" },
  colMesesH:  { flex: 3, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colMetodo:  { flex: 1.5, fontSize: 9, textAlign: "center" },
  colMetodoH: { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  colCodigo:  { flex: 1.2, fontSize: 9, textAlign: "center", fontFamily: "Helvetica-Bold" },
  colCodigoH: { flex: 1.2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  colMonto:   { flex: 1.5, fontSize: 9, textAlign: "right" },
  colMontoH:  { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "right" },
  colFecha:   { flex: 2, fontSize: 9, textAlign: "center", color: "#6b7280" },
  colFechaH:  { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  // Pendientes (individuales)
  colPeriodo:  { flex: 2.5, fontSize: 9 },
  colEstado:   { flex: 1.5, fontSize: 9 },
  colMontoP:   { flex: 1.5, fontSize: 9, textAlign: "right" },
  colPeriodoH: { flex: 2.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colEstadoH:  { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colMontoPH:  { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "right" },
  footer:     { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_ABREV = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatMes(periodo: string | Date) {
  let date: Date;
  if (typeof periodo === "string" && /^\d{4}-\d{2}$/.test(periodo)) {
    date = new Date(Date.UTC(Number(periodo.slice(0, 4)), Number(periodo.slice(5, 7)) - 1, 1));
  } else {
    date = new Date(periodo);
  }
  return `${MESES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatFecha(fecha: string | Date | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CL");
}

function formatMonto(monto: number) {
  return `$${monto.toLocaleString("es-CL")}`;
}

type Residente = {
  id: number;
  nombre: string;
  rut: string;
  telefono: string | null;
  esJefeHogar: boolean;
};

type GastoComun = {
  id: number;
  monto: number;
  periodo: string | Date;
  estadoPago: string;
  fechaPago: string | Date | null;
  metodoPago?: string | null;
  codigoTransaccion?: string | null;
};

type GastoPagadoAgrupado = {
  key: string;
  cantMeses: number;
  mesesLabel: string;
  metodoPago: string;
  codigoTransaccion: string | null;
  totalMonto: number;
  fechaPago: string | Date | null;
};

type Perfil = { nombre: string; direccion: string; comuna: string; telefono: string } | null;

type Props = {
  perfil: Perfil;
  depto: {
    numero: string;
    tipoOcupacion: string;
    torre: { nombre: string; sector: string };
    dueno: { nombre: string; telefono: string | null } | null;
  };
  residentes: Residente[];
  gastosComunes: GastoComun[];
};

const estadoColor: Record<string, string> = {
  PAGADO:           "#16a34a",
  PENDIENTE:        "#d97706",
  ATRASADO:         "#dc2626",
  HISTORICO:        "#dc2626",
  HISTORICO_PAGADO: "#16a34a",
};

const estadoLabel: Record<string, string> = {
  PAGADO:           "Pagado",
  PENDIENTE:        "Pendiente",
  ATRASADO:         "Atrasado",
  HISTORICO:        "Pendiente",
  HISTORICO_PAGADO: "Pagado",
};

function agruparPagados(gastos: GastoComun[]): GastoPagadoAgrupado[] {
  const mapa: Record<string, GastoPagadoAgrupado & { mesesPorAnio: Record<number, string[]> }> = {};

  for (const g of gastos) {
    const metodo  = g.metodoPago ?? "TRANSFERENCIA";
    const codigo  = g.codigoTransaccion ?? null;
    const fechaKey = g.fechaPago ? new Date(g.fechaPago).toISOString() : "sin-fecha";
    const key     = `${metodo}-${codigo ?? "sin-codigo"}-${fechaKey}`;
    const periodo = new Date(g.periodo);
    const anio    = periodo.getUTCFullYear();
    const mesAbrev = MESES_ABREV[periodo.getUTCMonth()];

    if (!mapa[key]) {
      mapa[key] = { key, cantMeses: 0, mesesLabel: "", metodoPago: metodo, codigoTransaccion: codigo, totalMonto: 0, fechaPago: g.fechaPago, mesesPorAnio: {} };
    }
    if (!mapa[key].mesesPorAnio[anio]) mapa[key].mesesPorAnio[anio] = [];
    mapa[key].mesesPorAnio[anio].push(mesAbrev);
    mapa[key].cantMeses  += 1;
    mapa[key].totalMonto += g.monto;
  }

  return Object.values(mapa).map((item) => {
    const partes = Object.entries(item.mesesPorAnio)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([anio, meses]) => {
        const sorted = [...meses].sort((a, b) => MESES_ABREV.indexOf(a) - MESES_ABREV.indexOf(b));
        return `${anio}: ${sorted.join(", ")}`;
      });
    return {
      key: item.key,
      cantMeses: item.cantMeses,
      mesesLabel: partes.join(" / "),
      metodoPago: item.metodoPago,
      codigoTransaccion: item.codigoTransaccion,
      totalMonto: item.totalMonto,
      fechaPago: item.fechaPago,
    };
  });
}

function TablaAgrupada({ grupos, totalLabel, totalMonto }: { grupos: GastoPagadoAgrupado[]; totalLabel: string; totalMonto: number }) {
  return (
    <>
      <View style={styles.tableHeader}>
        <Text style={styles.colMesesH}>Meses pagados</Text>
        <Text style={styles.colMetodoH}>Método</Text>
        <Text style={styles.colCodigoH}>Código</Text>
        <Text style={styles.colMontoH}>Total</Text>
        <Text style={styles.colFechaH}>Fecha pago</Text>
      </View>
      {grupos.map((g) => (
        <View key={g.key} style={styles.tableRow}>
          <Text style={styles.colMeses}>
            {g.cantMeses} {g.cantMeses === 1 ? "mes" : "meses"} ({g.mesesLabel})
          </Text>
          <Text style={[styles.colMetodo, { color: g.metodoPago === "EFECTIVO" ? "#4b5563" : "#15803d" }]}>
            {g.metodoPago === "EFECTIVO" ? "Efectivo" : "Transf."}
          </Text>
          <Text style={[styles.colCodigo, { color: g.codigoTransaccion ? "#15803d" : "#d1d5db" }]}>
            {g.codigoTransaccion ?? "—"}
          </Text>
          <Text style={[styles.colMonto, { color: "#16a34a" }]}>{formatMonto(g.totalMonto)}</Text>
          <Text style={styles.colFecha}>{formatFecha(g.fechaPago)}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{totalLabel}</Text>
        <Text style={[styles.totalMonto, { color: "#16a34a" }]}>{formatMonto(totalMonto)}</Text>
      </View>
    </>
  );
}

function TablaPendientes({ gastos }: { gastos: GastoComun[] }) {
  return (
    <>
      <View style={styles.tableHeader}>
        <Text style={styles.colPeriodoH}>Período</Text>
        <Text style={styles.colEstadoH}>Estado</Text>
        <Text style={styles.colMontoPH}>Monto</Text>
      </View>
      {gastos.map((g) => (
        <View key={g.id} style={styles.tableRow}>
          <Text style={styles.colPeriodo}>{formatMes(g.periodo)}</Text>
          <Text style={[styles.colEstado, { color: estadoColor[g.estadoPago] ?? "#374151" }]}>
            {estadoLabel[g.estadoPago] ?? g.estadoPago}
          </Text>
          <Text style={[styles.colMontoP, { color: "#dc2626" }]}>{formatMonto(g.monto)}</Text>
        </View>
      ))}
    </>
  );
}

export function ReporteDepartamentoPDF({ perfil, depto, residentes, gastosComunes }: Props) {
  const fechaGeneracion = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  const jefeHogar = residentes.find((r) => r.esJefeHogar);

  // Separar por tipo
  const regulares  = gastosComunes.filter((g) => !g.estadoPago.startsWith("HISTORICO"));
  const historicos = gastosComunes.filter((g) => g.estadoPago.startsWith("HISTORICO"));

  const regularesPagados    = regulares.filter((g) => g.estadoPago === "PAGADO");
  const regularesPendientes = regulares.filter((g) => g.estadoPago !== "PAGADO");
  const historicosPagados   = historicos.filter((g) => g.estadoPago === "HISTORICO_PAGADO");
  const historicosPendientes= historicos.filter((g) => g.estadoPago === "HISTORICO");

  const gruposRegulares  = agruparPagados(regularesPagados);
  const gruposHistoricos = agruparPagados(historicosPagados);

  const totalPagadoRegular   = regularesPagados.reduce((s, g) => s + g.monto, 0);
  const totalPendienteRegular= regularesPendientes.reduce((s, g) => s + g.monto, 0);
  const totalPagadoHistorico = historicosPagados.reduce((s, g) => s + g.monto, 0);
  const totalPendienteHist   = historicosPendientes.reduce((s, g) => s + g.monto, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Encabezado */}
        <View style={styles.header}>
          <View>
            <Text style={styles.condoNombre}>{perfil?.nombre || "Condominio"}</Text>
            {perfil?.direccion ? <Text style={styles.condoInfo}>{perfil.direccion}{perfil.comuna ? `, ${perfil.comuna}` : ""}</Text> : null}
            {perfil?.telefono  ? <Text style={styles.condoInfo}>{perfil.telefono}</Text> : null}
          </View>
          <View>
            <Text style={styles.reporteTitulo}>Reporte de Departamento</Text>
            <Text style={styles.reporteSub}>Depto. {depto.numero || "S/N"} · {depto.torre.nombre} · Sector {depto.torre.sector}</Text>
          </View>
        </View>

        {/* Info del departamento */}
        <View style={styles.infoBox}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Tipo de ocupación</Text>
            <Text style={styles.infoValue}>{depto.tipoOcupacion === "DUENO" ? "Dueño" : "Arrendatario"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Dueño legal</Text>
            <Text style={styles.infoValue}>{depto.dueno?.nombre ?? "—"}</Text>
            {depto.dueno?.telefono ? <Text style={[styles.infoLabel, { marginTop: 2 }]}>{depto.dueno.telefono}</Text> : null}
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Jefe de hogar</Text>
            <Text style={styles.infoValue}>{jefeHogar?.nombre ?? "—"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Total residentes</Text>
            <Text style={styles.infoValue}>{residentes.length}</Text>
          </View>
        </View>

        {/* Residentes */}
        {residentes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Residentes ({residentes.length})</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colNombreH}>Nombre</Text>
              <Text style={styles.colRutH}>RUT</Text>
              <Text style={styles.colTelH}>Teléfono</Text>
              <Text style={styles.colJefeH}>Jefe hogar</Text>
            </View>
            {residentes.map((r) => (
              <View key={r.id} style={styles.tableRow}>
                <Text style={styles.colNombre}>{r.nombre}</Text>
                <Text style={[styles.colRut, { color: "#6b7280" }]}>{r.rut}</Text>
                <Text style={[styles.colTel, { color: "#6b7280" }]}>{r.telefono ?? "—"}</Text>
                <Text style={[styles.colJefe, { color: r.esJefeHogar ? "#111827" : "#9ca3af", fontFamily: r.esJefeHogar ? "Helvetica-Bold" : "Helvetica" }]}>
                  {r.esJefeHogar ? "Sí" : "—"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Gastos Comunes */}
        {regulares.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gastos Comunes</Text>

            {gruposRegulares.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.subLabel, { color: "#16a34a" }]}>Pagados</Text>
                <TablaAgrupada grupos={gruposRegulares} totalLabel="Total pagado" totalMonto={totalPagadoRegular} />
              </View>
            )}

            {regularesPendientes.length > 0 && (
              <View style={{ marginBottom: 4 }}>
                <Text style={[styles.subLabel, { color: "#d97706" }]}>Pendientes / Atrasados</Text>
                <TablaPendientes gastos={regularesPendientes} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total pendiente / atrasado</Text>
                  <Text style={[styles.totalMonto, { color: "#dc2626" }]}>{formatMonto(totalPendienteRegular)}</Text>
                </View>
              </View>
            )}

            {regulares.length === 0 && (
              <Text style={{ fontSize: 9, color: "#9ca3af", marginTop: 4 }}>Sin registros de gastos comunes.</Text>
            )}
          </View>
        )}

        {/* Deuda Histórica */}
        {historicos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deuda Histórica</Text>

            {gruposHistoricos.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.subLabel, { color: "#16a34a" }]}>Pagados</Text>
                <TablaAgrupada grupos={gruposHistoricos} totalLabel="Total pagado" totalMonto={totalPagadoHistorico} />
              </View>
            )}

            {historicosPendientes.length > 0 && (
              <View style={{ marginBottom: 4 }}>
                <Text style={[styles.subLabel, { color: "#dc2626" }]}>Pendientes</Text>
                <TablaPendientes gastos={historicosPendientes} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total pendiente</Text>
                  <Text style={[styles.totalMonto, { color: "#dc2626" }]}>{formatMonto(totalPendienteHist)}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{perfil?.nombre || "Condominio"} · Depto. {depto.numero || "S/N"} · {depto.torre.nombre}</Text>
          <Text style={styles.footerText}>Generado el {fechaGeneracion}</Text>
        </View>

      </Page>
    </Document>
  );
}
