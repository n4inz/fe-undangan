import { z } from 'zod';

const requeiredInput = z.string().min(1, { message: "Form harus diisi" });
// const requeiredDate = z.string().min(1, { message: "Date is required" }).refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" });
const requeiredDate = z.union([
  z.string().min(1, { message: "Date is required" }),
  z.date(),
]);

const optionalField = z.string().optional();

export const mainSchema = z.object({
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
  datetimeAkad: requeiredDate,
  datetimeResepsi: requeiredDate,
  timeAkad: requeiredInput,
  timeResepsi: requeiredInput,
})

export const schema = z.object({
  ...mainSchema.shape,
}).passthrough(); // Allows additional fields of any type


export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(1, { message: "Password is required" }),
})

export const staffSchema = z.object({
  name: requeiredInput,
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(1, { message: "Password is required" }),
})

export const expendSchema = z.object({
  name: requeiredInput,
  totalSpending: z.string()
    .regex(/^[\d+\s-]+$/, { message: "Total spending mengharuskan angka" })
    .refine((val) => val !== "", { message: "Total spending harus diisi" }),
});

export const themeSchema = z.object({
  name: requeiredInput,
  link: requeiredInput,
})
export const assetSchema = z.object({
  name: requeiredInput,
})

export const paymentSchema = z.object({
  name: requeiredInput,
  file: z
    .any()
    .refine((file) => file instanceof File && file.size > 0, {
      message: 'File is required',
    })
})