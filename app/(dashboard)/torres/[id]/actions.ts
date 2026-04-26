"use server";
 
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
 
export async function actualizarNumeroDepartamento(id: number, numero: string) {
  await prisma.departamento.update({
    where: { id },
    data: { numero: numero.trim() },
  });
  revalidatePath("/torres");
}
 