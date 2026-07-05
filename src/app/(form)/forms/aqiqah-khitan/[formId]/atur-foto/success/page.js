"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Images } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { checkFormAk } from "@/utils/checkForm";
import PaymentModalAk from "./PaymentModalAk";

export default function SuccessAk({ params }) {
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      const { data, error } = await checkFormAk(params.formId);

      if (error || !data?.form) {
        router.replace("/");
        return;
      }

      setForm(data.form);
      setLoading(false);
    };

    fetchForm();
  }, [params.formId, router]);

  if (loading || !form) return null;

  const invitationUrl =
    form.linkUndangan ||
    (form.slug
      ? `${process.env.NEXT_PUBLIC_LINK_UNDANGAN}/${form.slug}`
      : null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <Toaster className="z-50" />
      <section className="relative flex w-full max-w-lg flex-col items-center bg-white px-6 py-10 text-center shadow-lg sm:rounded-lg">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4"
          title="Kembali ke atur foto"
        >
          <Link
            href={`/forms/aqiqah-khitan/${params.formId}/atur-foto`}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Kembali ke atur foto</span>
          </Link>
        </Button>

        <Image
          src="/images/success-form.gif"
          alt="Foto berhasil disimpan"
          width={112}
          height={112}
          priority
        />

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Foto Berhasil Disimpan
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">
          Terima kasih. Pesanan dengan ID {form.id} akan diproses setelah
          pembayaran dikirim.
        </p>

        <div className="mt-7 grid w-full gap-3">
          {invitationUrl && (
            <Button asChild variant="outline" className="w-full">
              <Link href={invitationUrl} target="_blank">
                <ExternalLink className="mr-2 h-5 w-5" />
                Link Undangan
              </Link>
            </Button>
          )}

          <PaymentModalAk formId={params.formId} isPaid={form.isPaid} />

          <Button asChild className="w-full bg-gray-700 hover:bg-gray-800">
            <Link
              href={`/forms/aqiqah-khitan/${params.formId}/atur-foto/success/result`}
            >
              <Images className="mr-2 h-5 w-5" />
              {form.isPaid === 1 ? "Lihat Foto" : "Lihat dan Edit Foto"}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
