import { prisma } from "@/lib/prisma";
import { Building2, Users, Car, Receipt } from "lucide-react";

export default async function DashboardPage() {
  const [totalDeptos, totalResidentes, totalVehiculos, gastosRecientes] =
    await Promise.all([
      prisma.departamento.count(),
      prisma.residente.count(),
      prisma.vehiculo.count(),
      prisma.gastoComun.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { departamento: { include: { torre: true } } },
      }),
    ]);

  const gastosPagados = await prisma.gastoComun.count({
    where: { estadoPago: "PAGADO" },
  });
  const gastosPendientes = await prisma.gastoComun.count({
    where: { estadoPago: "PENDIENTE" },
  });
  const totalMonto = await prisma.gastoComun.aggregate({
    _sum: { monto: true },
  });

  const cards = [
    {
      label: "Total Departamentos",
      value: totalDeptos,
      icon: Building2,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      sub: `${gastosPendientes} con gastos pendientes`,
    },
    {
      label: "Habitantes Registrados",
      value: totalResidentes,
      icon: Users,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
      sub: `${totalResidentes} registrados`,
    },
    {
      label: "Vehículos",
      value: totalVehiculos,
      icon: Car,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
      sub: `${totalVehiculos} registrados`,
    },
    {
      label: "Gastos del Mes",
      value: `$${(totalMonto._sum.monto ?? 0).toLocaleString("es-CL")}`,
      icon: Receipt,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-50",
      sub: `${gastosPagados} pagados, ${gastosPendientes} pendientes`,
    },
  ];

  const estadoColor: Record<string, string> = {
    PAGADO:    "bg-gray-900 text-white",
    PENDIENTE: "bg-red-500 text-white",
    ATRASADO:  "bg-orange-500 text-white",
  };

  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general del condominio</p>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, iconColor, iconBg, sub }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Gastos recientes */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Gastos Recientes</h2>
          <p className="text-sm text-gray-400 mt-0.5">Últimos movimientos registrados</p>
        </div>

        {gastosRecientes.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No hay gastos registrados aún.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {gastosRecientes.map((g) => (
              <div key={g.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Depto {g.departamento.numero}
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      {g.departamento.torre.nombre}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(g.periodo).toLocaleDateString("es-CL", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-semibold text-gray-900">
                    ${g.monto.toLocaleString("es-CL")}
                  </p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColor[g.estadoPago] ?? "bg-gray-100 text-gray-600"}`}>
                    {g.estadoPago.charAt(0) + g.estadoPago.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}