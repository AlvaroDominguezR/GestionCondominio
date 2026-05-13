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
  // Info depto
  infoBox: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    padding: 10,
    border: "1 solid #e5e7eb",
  },
  infoLabel: { fontSize: 8, color: "#6b7280", marginBottom: 3 },
  infoValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
  // Secciones
  section:      { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 6, paddingBottom: 4, borderBottom: "1 solid #e5e7eb" },
  // Tabla
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "5 8", borderRadius: 4, marginBottom: 2 },
  tableRow:    { flexDirection: "row", padding: "4 8", borderBottom: "0.5 solid #f3f4f6" },
  // Residentes
  colNombre:  { flex: 3, fontSize: 9 },
  colRut:     { flex: 2, fontSize: 9 },
  colTel:     { flex: 2, fontSize: 9 },
  colJefe:    { flex: 1, fontSize: 9, textAlign: "center" },
  colNombreH: { flex: 3, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colRutH:    { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colTelH:    { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colJefeH:   { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  // Gastos
  colPeriodo:  { flex: 2, fontSize: 9 },
  colEstado:   { flex: 1.5, fontSize: 9 },
  colMonto:    { flex: 1.5, fontSize: 9, textAlign: "right" },
  colFecha:    { flex: 2, fontSize: 9, textAlign: "center" },
  colPeriodoH: { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colEstadoH:  { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colMontoH:   { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "right" },
  colFechaH:   { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  // Footer
  footer:     { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function formatMes(periodo: string | Date) {
  let date: Date;
  if (typeof periodo === 'string' && /^\d{4}-\d{2}$/.test(periodo)) {
    // '2026-05'
    date = new Date(Date.UTC(Number(periodo.slice(0,4)), Number(periodo.slice(5,7))-1, 1));
  } else {
    // ISO string o Date
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
};

type Perfil = { nombre: string; direccion: string; comuna: string; telefono: string } | null;

type Props = {
  perfil: Perfil;
  depto: {
    numero: string;
    tipoOcupacion: string;
    deudaAnterior: number;
    torre: { nombre: string; sector: string };
    dueno: { nombre: string; telefono: string | null } | null;
  };
  residentes: Residente[];
  gastosComunes: GastoComun[];
};

const estadoColor: Record<string, string> = {
  PAGADO:    "#16a34a",
  PENDIENTE: "#d97706",
  ATRASADO:  "#dc2626",
};

export function ReporteDepartamentoPDF({ perfil, depto, residentes, gastosComunes }: Props) {
  const fechaGeneracion = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  const jefeHogar = residentes.find((r) => r.esJefeHogar);

  const totalPagado    = gastosComunes.filter((g) => g.estadoPago === "PAGADO").reduce((acc, g) => acc + g.monto, 0);
  const totalPendiente = gastosComunes.filter((g) => g.estadoPago !== "PAGADO").reduce((acc, g) => acc + g.monto, 0);

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

        {/* Deuda anterior */}
        {depto.deudaAnterior > 0 && (
          <View style={{ backgroundColor: "#fef2f2", border: "1 solid #fecaca", borderRadius: 6, padding: 10, marginBottom: 18 }}>
            <Text style={{ fontSize: 9, color: "#dc2626", fontFamily: "Helvetica-Bold" }}>
              Deuda anterior al sistema: {formatMonto(depto.deudaAnterior)}
            </Text>
          </View>
        )}

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

        {/* Historial gastos comunes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Gastos Comunes</Text>
          {gastosComunes.length === 0 ? (
            <Text style={{ fontSize: 9, color: "#9ca3af", marginTop: 4 }}>Sin registros de gastos comunes.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={styles.colPeriodoH}>Período</Text>
                <Text style={styles.colEstadoH}>Estado</Text>
                <Text style={styles.colMontoH}>Monto</Text>
                <Text style={styles.colFechaH}>Fecha pago</Text>
              </View>
              {gastosComunes.map((g) => (
                <View key={g.id} style={styles.tableRow}>
                  <Text style={styles.colPeriodo}>{formatMes(g.periodo)}</Text>
                  <Text style={[styles.colEstado, { color: estadoColor[g.estadoPago] ?? "#374151" }]}>
                    {g.estadoPago.charAt(0) + g.estadoPago.slice(1).toLowerCase()}
                  </Text>
                  <Text style={[styles.colMonto, { color: g.estadoPago === "PAGADO" ? "#16a34a" : "#dc2626" }]}>
                    {formatMonto(g.monto)}
                  </Text>
                  <Text style={[styles.colFecha, { color: "#6b7280" }]}>{formatFecha(g.fechaPago)}</Text>
                </View>
              ))}
              {/* Resumen */}
              <View style={{ flexDirection: "row", marginTop: 6, gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: "#f0fdf4", borderRadius: 4, padding: 8 }}>
                  <Text style={{ fontSize: 8, color: "#6b7280" }}>Total pagado</Text>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#16a34a" }}>{formatMonto(totalPagado)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "#fef2f2", borderRadius: 4, padding: 8 }}>
                  <Text style={{ fontSize: 8, color: "#6b7280" }}>Total pendiente / atrasado</Text>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#dc2626" }}>{formatMonto(totalPendiente)}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{perfil?.nombre || "Condominio"} · Depto. {depto.numero || "S/N"} · {depto.torre.nombre}</Text>
          <Text style={styles.footerText}>Generado el {fechaGeneracion}</Text>
        </View>

      </Page>
    </Document>
  );
}