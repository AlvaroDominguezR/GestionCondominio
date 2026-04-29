"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ResidenteSchema = z.object({
  nombre:        z.string().min(1, "El nombre es obligatorio"),
  apellido:      z.string().min(1, "El apellido es obligatorio"),
  rut:           z.string().min(1, "El RUT es obligatorio"),
  telefono:      z.string().optional(),
  esJefeHogar:   z.boolean(),
  tipoOcupacion: z.enum(["DUENO", "ARRENDATARIO"]).optional(),
});

const DuenoExternoSchema = z.object({
  nombre:   z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  rut:      z.string().min(1, "El RUT es obligatorio"),
  telefono: z.string().optional(),
});

export async function crearResidente(departamentoId: number, formData: FormData) {
  const esJefeHogar = formData.get("esJefeHogar") === "true";

  const datos = ResidenteSchema.safeParse({
    nombre:        formData.get("nombre"),
    apellido:      formData.get("apellido"),
    rut:           formData.get("rut"),
    telefono:      formData.get("telefono"),
    esJefeHogar,
    tipoOcupacion: formData.get("tipoOcupacion") || undefined,
  });

  if (!datos.success) return { error: datos.error.issues[0].message };

  const { nombre, apellido, rut, telefono, tipoOcupacion } = datos.data;

  if (esJefeHogar) {
    const existe = await prisma.residente.findFirst({ where: { departamentoId, esJefeHogar: true } });
    if (existe) return { error: "Ya existe un jefe de hogar en este departamento." };
  }

  const rutExistente = await prisma.residente.findUnique({ where: { rut } });
  if (rutExistente) return { error: "Ya existe un residente con ese RUT." };

  await prisma.residente.create({
    data: { nombre: `${nombre} ${apellido}`, rut, telefono: telefono || null, esJefeHogar, departamentoId },
  });

  if (esJefeHogar && tipoOcupacion) {
    await prisma.departamento.update({
      where: { id: departamentoId },
      data: { tipoOcupacion },
    });
  }

  const total = await prisma.residente.count({ where: { departamentoId } });
  await prisma.departamento.update({ where: { id: departamentoId }, data: { cantHabitantes: total } });

  revalidatePath(`/departamentos/${departamentoId}`);
  return { ok: true };
}

export async function editarResidente(residenteId: number, departamentoId: number, formData: FormData) {
  const esJefeHogar = formData.get("esJefeHogar") === "true";

  const datos = ResidenteSchema.safeParse({
    nombre:        formData.get("nombre"),
    apellido:      formData.get("apellido"),
    rut:           formData.get("rut"),
    telefono:      formData.get("telefono"),
    esJefeHogar,
    tipoOcupacion: formData.get("tipoOcupacion") || undefined,
  });

  if (!datos.success) return { error: datos.error.issues[0].message };

  const { nombre, apellido, rut, telefono, tipoOcupacion } = datos.data;

  if (esJefeHogar) {
    const existe = await prisma.residente.findFirst({
      where: { departamentoId, esJefeHogar: true, NOT: { id: residenteId } },
    });
    if (existe) return { error: "Ya existe un jefe de hogar en este departamento." };
  }

  const rutExistente = await prisma.residente.findFirst({ where: { rut, NOT: { id: residenteId } } });
  if (rutExistente) return { error: "Ese RUT ya está registrado en otro residente." };

  await prisma.residente.update({
    where: { id: residenteId },
    data: { nombre: `${nombre} ${apellido}`, rut, telefono: telefono || null, esJefeHogar },
  });

  if (esJefeHogar && tipoOcupacion) {
    await prisma.departamento.update({
      where: { id: departamentoId },
      data: { tipoOcupacion },
    });
  }

  revalidatePath(`/departamentos/${departamentoId}`);
  return { ok: true };
}

export async function eliminarResidente(residenteId: number, departamentoId: number) {
  await prisma.residente.delete({ where: { id: residenteId } });
  const total = await prisma.residente.count({ where: { departamentoId } });
  await prisma.departamento.update({ where: { id: departamentoId }, data: { cantHabitantes: total } });
  revalidatePath(`/departamentos/${departamentoId}`);
}

// ─── Definir dueño desde residente existente ───────────────
export async function definirDuenoDesdeResidente(departamentoId: number, residenteId: number) {
  const residente = await prisma.residente.findUnique({ where: { id: residenteId } });
  if (!residente) return { error: "Residente no encontrado." };

  // Buscar si ya existe un Dueno con ese RUT
  let dueno = await prisma.dueno.findUnique({ where: { rut: residente.rut } });

  if (!dueno) {
    dueno = await prisma.dueno.create({
      data: {
        nombre:   residente.nombre,
        rut:      residente.rut,
        telefono: residente.telefono,
      },
    });
  }

  await prisma.departamento.update({
    where: { id: departamentoId },
    data:  { duenoId: dueno.id },
  });

  revalidatePath(`/departamentos/${departamentoId}`);
  return { ok: true };
}

// ─── Definir dueño externo (no vive en el depto) ───────────
export async function definirDuenoExterno(departamentoId: number, formData: FormData) {
  const datos = DuenoExternoSchema.safeParse({
    nombre:   formData.get("nombre"),
    apellido: formData.get("apellido"),
    rut:      formData.get("rut"),
    telefono: formData.get("telefono"),
  });

  if (!datos.success) return { error: datos.error.issues[0].message };

  const { nombre, apellido, rut, telefono } = datos.data;

  // Buscar si ya existe un Dueno con ese RUT
  let dueno = await prisma.dueno.findUnique({ where: { rut } });

  if (!dueno) {
    dueno = await prisma.dueno.create({
      data: { nombre: `${nombre} ${apellido}`, rut, telefono: telefono || null },
    });
  }

  await prisma.departamento.update({
    where: { id: departamentoId },
    data:  { duenoId: dueno.id },
  });

  revalidatePath(`/departamentos/${departamentoId}`);
  return { ok: true };
}

export async function actualizarNumeroDepartamento(id: number, numero: string) {
  await prisma.departamento.update({ where: { id }, data: { numero: numero.trim() } });
  revalidatePath(`/departamentos/${id}`);
}

// ─── Vehículos ──────────────────────────────────────────────
const VehiculoSchema = z.object({
  patente: z.string().min(1, "La patente es obligatoria").toUpperCase(),
  tipo:    z.enum(["AUTO", "MOTO", "CAMIONETA", "FURGON", "OTRO"]),
});

export async function agregarVehiculo(residenteId: number, departamentoId: number, formData: FormData) {
  const datos = VehiculoSchema.safeParse({
    patente: formData.get("patente"),
    tipo:    formData.get("tipo"),
  });

  if (!datos.success) return { error: datos.error.issues[0].message };

  const patenteExistente = await prisma.vehiculo.findUnique({ where: { patente: datos.data.patente } });
  if (patenteExistente) return { error: "Esa patente ya está registrada en el sistema." };

  await prisma.vehiculo.create({
    data: {
      patente:    datos.data.patente,
      tipo:       datos.data.tipo,
      residenteId: residenteId,
    },
  });

  revalidatePath(`/departamentos/${departamentoId}`);
  return { ok: true };
}

export async function eliminarVehiculo(vehiculoId: number, departamentoId: number) {
  await prisma.vehiculo.delete({ where: { id: vehiculoId } });
  revalidatePath(`/departamentos/${departamentoId}`);
}

export async function actualizarDeudaAnterior(id: number, monto: number) {
  await prisma.departamento.update({
    where: { id },
    data: { deudaAnterior: monto },
  });
  revalidatePath(`/departamentos/${id}`);
}