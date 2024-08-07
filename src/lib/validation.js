import { z } from 'zod';

const requeiredInput = z.string().min(1, { message: "Form harus diisi" });
const requeiredTgl = z.string().min(1, { message: "Date is required" }).refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" });

export const schema = z.object({
  name: requeiredInput,
  namaLengkapPria: requeiredInput,
  namaPanggilanPria: requeiredInput,
  namaOrtuPria: requeiredInput,
  tempatLahirPria: requeiredInput,
  namaLengkapWanita: requeiredInput,
  namaPanggilanWanita: requeiredInput,
  namaOrtuWanita: requeiredInput,
  tempatLahirWanita: requeiredInput,
  alamatAkad: requeiredInput,
  alamatResepsi: requeiredInput,
  nomorWa: z
    .string()
    .regex(/^[\d+\s-]+$/, { message: "Nomor telepon mengharuskan angka" })
    .refine((val) => val !== "", { message: "Nomor telepon harus diisi" }),
  tglLahirPria: requeiredTgl,
  tglLahirWanita: requeiredTgl,
  datetimeAkad: requeiredTgl,
  datetimeResepsi: requeiredTgl,
}).catchall(z.string()); // Allow additional fields of type string