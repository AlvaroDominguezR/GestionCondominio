import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: "40 50",
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  // ── Encabezado ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottom: "1.5 solid #e5e7eb",
  },
  condoNombre: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#111827" },
  condoInfo:   { fontSize: 8.5, color: "#6b7280", marginTop: 2 },
  badgeWrap:   { alignItems: "flex-end" },
  badge: {
    backgroundColor: "#111827",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  badgeText:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 1 },
  badgeSub:   { fontSize: 8, color: "#6b7280", textAlign: "right" },
  // ── Info depto ──
  infoGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  infoCard: {
    flex: 1,
    border: "1 solid #e5e7eb",
    borderRadius: 5,
    padding: 9,
    backgroundColor: "#f9fafb",
  },
  infoLabel: { fontSize: 7.5, color: "#9ca3af", marginBottom: 2 },
  infoValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827" },
  // ── Tabla de pagos ──
  tableWrap:   { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: "1 solid #e5e7eb",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    padding: "5 8",
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 8",
    borderBottom: "0.5 solid #f3f4f6",
  },
  colPeriodo:  { flex: 2.5, fontSize: 9 },
  colMonto:    { flex: 1.5, fontSize: 9, textAlign: "right" },
  colMetodo:   { flex: 1.8, fontSize: 9, textAlign: "center" },
  colCodigo:   { flex: 1.2, fontSize: 9, textAlign: "center", fontFamily: "Helvetica-Bold" },
  colFecha:    { flex: 2, fontSize: 9, textAlign: "right" },
  colPeriodoH: { flex: 2.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  colMontoH:   { flex: 1.5, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "right" },
  colMetodoH:  { flex: 1.8, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  colCodigoH:  { flex: 1.2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "center" },
  colFechaH:   { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textAlign: "right" },
  // ── Total ──
  totalWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  totalBox: {
    backgroundColor: "#f0fdf4",
    border: "1 solid #bbf7d0",
    borderRadius: 6,
    padding: "10 16",
    alignItems: "flex-end",
    minWidth: 180,
  },
  totalLabel: { fontSize: 8, color: "#6b7280", marginBottom: 2 },
  totalMonto: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#16a34a" },
  totalItems: { fontSize: 7.5, color: "#9ca3af", marginTop: 2 },
  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 28,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "0.5 solid #e5e7eb",
    paddingTop: 6,
  },
  footerText: { fontSize: 7.5, color: "#9ca3af" },
  // ── Sello ──
  sello: {
    position: "absolute",
    bottom: 70,
    right: 50,
    border: "1.5 solid #bbf7d0",
    borderRadius: 50,
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.35,
  },
  selloText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#16a34a", textAlign: "center" },
});

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function formatMes(periodo: string | Date): string {
  const d = new Date(periodo);
  return `${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatFecha(fecha: string | Date | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CL");
}

function formatMonto(monto: number): string {
  return `$${monto.toLocaleString("es-CL")}`;
}

function formatMetodo(metodo: string | null): string {
  if (!metodo) return "—";
  return metodo === "TRANSFERENCIA" ? "Transferencia" : "Efectivo";
}

type GastoComun = {
  id: number;
  monto: number;
  periodo: string | Date;
  fechaPago: string | Date | null;
  metodoPago: string | null;
  codigoTransaccion: string | null;
};

type Perfil = { nombre: string; direccion: string; comuna: string; telefono: string } | null;

type Props = {
  perfil: Perfil;
  depto: {
    numero: string;
    torre: { nombre: string; sector: string };
    dueno: { nombre: string } | null;
  };
  jefeHogar: string | null;
  gastos: GastoComun[];
};

export function VoucherPagoPDF({ perfil, depto, jefeHogar, gastos }: Props) {
  const fechaGeneracion = new Date().toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const total = gastos.reduce((acc, g) => acc + g.monto, 0);
  const condoNombre = perfil?.nombre || "Condominio";

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Encabezado */}
        <View style={styles.header}>
          <View>
            <Text style={styles.condoNombre}>{condoNombre}</Text>
            {perfil?.direccion ? (
              <Text style={styles.condoInfo}>
                {perfil.direccion}{perfil.comuna ? `, ${perfil.comuna}` : ""}
              </Text>
            ) : null}
            {perfil?.telefono ? <Text style={styles.condoInfo}>{perfil.telefono}</Text> : null}
          </View>
          <View style={styles.badgeWrap}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>COMPROBANTE DE PAGO</Text>
            </View>
            <Text style={styles.badgeSub}>Generado el {fechaGeneracion}</Text>
          </View>
        </View>

        {/* Info del departamento */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Torre / Sector</Text>
            <Text style={styles.infoValue}>{depto.torre.nombre} · Sector {depto.torre.sector}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Departamento</Text>
            <Text style={styles.infoValue}>{depto.numero || "S/N"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Jefe de hogar</Text>
            <Text style={styles.infoValue}>{jefeHogar || "—"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Dueño legal</Text>
            <Text style={styles.infoValue}>{depto.dueno?.nombre || "—"}</Text>
          </View>
        </View>

        {/* Tabla de pagos */}
        <View style={styles.tableWrap}>
          <Text style={styles.sectionTitle}>Detalle de Pagos</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colPeriodoH}>Período</Text>
            <Text style={styles.colMontoH}>Monto</Text>
            <Text style={styles.colMetodoH}>Método</Text>
            <Text style={styles.colCodigoH}>Código</Text>
            <Text style={styles.colFechaH}>Fecha de pago</Text>
          </View>
          {gastos.map((g) => (
            <View key={g.id} style={styles.tableRow}>
              <Text style={styles.colPeriodo}>{formatMes(g.periodo)}</Text>
              <Text style={[styles.colMonto, { color: "#16a34a", fontFamily: "Helvetica-Bold" }]}>
                {formatMonto(g.monto)}
              </Text>
              <Text style={[styles.colMetodo, { color: "#6b7280" }]}>{formatMetodo(g.metodoPago)}</Text>
              <Text style={[styles.colCodigo, { color: g.codigoTransaccion ? "#15803d" : "#d1d5db" }]}>
                {g.codigoTransaccion ?? "—"}
              </Text>
              <Text style={[styles.colFecha, { color: "#6b7280" }]}>{formatFecha(g.fechaPago)}</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalWrap}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>TOTAL PAGADO</Text>
            <Text style={styles.totalMonto}>{formatMonto(total)}</Text>
            <Text style={styles.totalItems}>{gastos.length} período{gastos.length !== 1 ? "s" : ""} incluido{gastos.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>

        {/* Sello decorativo */}
        <View style={styles.sello}>
          <Text style={styles.selloText}>PAGADO{"\n"}✓</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{condoNombre} · Depto. {depto.numero || "S/N"} · {depto.torre.nombre}</Text>
          <Text style={styles.footerText}>Documento generado automáticamente · {fechaGeneracion}</Text>
        </View>

      </Page>
    </Document>
  );
}
