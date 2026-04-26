"use server";
 
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
 
const TorreSchema = z.object({
  torre: z.string().regex(/^[1-9]\|[AB]$/),
});
 
export async function crearTorre(formData: FormData) {
  const torre = formData.get("torre");
  const datos = TorreSchema.safeParse({ torre });
 
  if (!datos.success) {
    return { error: "Selecciona una torre antes de continuar." };
  }
 
  const [numero, sector] = datos.data.torre.split("|");
  const nombre = `Torre ${numero}${sector}`;
 
  const existe = await prisma.torre.findUnique({ where: { nombre } });
  if (existe) {
    return { error: `La ${nombre} ya está registrada.` };
  }
 
  await prisma.torre.create({
    data: {
      nombre,
      sector,
      departamentos: {
        create: Array.from({ length: 16 }, () => ({
          numero:         "",
          tipoOcupacion:  "DUENO",
          cantHabitantes: 0,
          debeGastoComun: false,
        })),
      },
    },
  });
 
  revalidatePath("/torres");
  redirect("/torres");
}
 
export async function eliminarTorre(id: number) {
  await prisma.departamento.deleteMany({ where: { torreId: id } });
  await prisma.torre.delete({ where: { id } });
  revalidatePath("/torres");
}