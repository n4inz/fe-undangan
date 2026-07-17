import { z } from 'zod';

const requeiredInput = z.string().min(1, { message: "Form harus diisi" });
// const requeiredDate = z.string().min(1, { message: "Date is required" }).refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" });
const requeiredDate = z.union([
  z.string().min(1, { message: "Date is required" }),
  z.date(),
]);

const optionalStringWithMax = z
  .union([
    z.string().max(190, { message: "Field tidak boleh lebih dari 190 karakter" }),
    z.literal(''),
    z.null(),
    z.undefined()
  ])
  .optional();

export const mainSchema = z.object({
  name: requeiredInput,
  namaLengkapPria: requeiredInput,
  namaPanggilanPria: requeiredInput,
  namaOrtuPria: requeiredInput,
  namaLengkapWanita: requeiredInput,
  namaPanggilanWanita: requeiredInput,
  namaOrtuWanita: requeiredInput,
  alamatAkad: requeiredInput,
  // alamatResepsi: requeiredInput,
nomorWa: z
  .string()
  .min(7, { message: "Nomor telepon minimal 7 karakter" })
  .regex(/^[A-Za-z0-9+\-\s@.]+$/, { message: "Nomor telepon salah" })
  .refine((val) => val.trim() !== "", { message: "Nomor telepon harus diisi" }),

  datetimeAkad: requeiredDate,
  // datetimeResepsi: requeiredDate,
  timeAkad: requeiredInput,
  // timeResepsi: requeiredInput,
  pilihanTema: z.string().min(1, { message: "Pilihan tema harus dipilih" }),
  idTema: z.coerce.number({
    required_error: "ID tema harus diisi",
    invalid_type_error: "tema harus dipilih",
  }),
  // linkVideo: optionalStringWithMax,
  source: optionalStringWithMax,
  judulTurutMengundang: optionalStringWithMax,
  judulTurutMengundang2: optionalStringWithMax,
  // linkSherlokResepsi: optionalStringWithMax,
});

const excludedFields = ['ceritaAwal', 'ceritaJadian', 'ceritaLamaran', 'quote', 'linkSherlokAkad', 'linkSherlokResepsi', 'turutMengundang', 'turutMengundang2'];

export const schema = mainSchema
  .merge(z.object({}).passthrough()) // allow unknown fields
  .superRefine((data, ctx) => {
    Object.entries(data).forEach(([key, value]) => {
      if (excludedFields.includes(key)) return;

      const stringValue =
        typeof value === 'string'
          ? value
          : value instanceof Date
            ? value.toISOString()
            : typeof value === 'number'
              ? value.toString()
              : '';

      if (stringValue.length > 190) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: 190,
          type: 'string',
          inclusive: true,
          path: [key],
          message: `Field "${key}" tidak boleh lebih dari 190 karakter`,
        });
      }
    });
  });


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
  totalSpending: z.union([
    z.number(),
    z.string().regex(/^\d+$/, { message: "Total spending mengharuskan angka" })
  ]).refine(val => val !== "", { message: "Total spending harus diisi" }),
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

export const quoteSchema = z.object({
  source: requeiredInput,
  quote: requeiredInput,
})
