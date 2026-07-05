"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FilePenLine,
  Loader2,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DataPhotoTableAk from "@/components/DataPhotoTableAk";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import PaymentModalAk from "../PaymentModalAk";

export default function ResultAk({ params }) {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await axios.get(
          `${apiBase}/get-photo-order-ak/${params.formId}`
        );
        setForm(response.data?.form || null);
      } catch (error) {
        console.error("Error loading AK result:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [apiBase, params.formId, router]);

  if (loading || !form) return null;

  const invitationUrl =
    form.linkUndangan ||
    (form.slug
      ? `${process.env.NEXT_PUBLIC_LINK_UNDANGAN}/${form.slug}`
      : null);
  const isPaid = Number(form.isPaid) === 1;
  const contactUrl = `https://wa.me/${
    process.env.NEXT_PUBLIC_WA_NUMBER
  }?text=${encodeURIComponent(
    `Halo,\nSaya ingin memesan undangan aqiqah-khitan dengan kode id: ${form.id}`
  )}`;

  return (
    <main className="min-h-screen bg-gray-100 pb-12">
      <Toaster className="z-50" />

      {uploading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 text-white">
          <Loader2 className="h-9 w-9 animate-spin" />
          <p className="mt-3 text-sm font-medium">Mengupload foto...</p>
        </div>
      )}

      <section className="relative mx-auto min-h-screen w-full max-w-2xl bg-white pb-8 shadow-lg sm:my-6 sm:min-h-0 sm:rounded-lg">
        <div className="border-b px-5 py-5 text-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-3 top-3"
            title="Kembali"
            onClick={() =>
              router.push(
                `/forms/aqiqah-khitan/${params.formId}/atur-foto/success`
              )
            }
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Kembali</span>
          </Button>
          <h1 className="text-xl font-bold">Daftar Foto</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pesanan {form.namaAcara} - {form.namaPanggilanAnak}
          </p>
        </div>

        <div className="grid gap-2 px-5 py-5 sm:grid-cols-2">
          {invitationUrl && (
            <Button asChild variant="outline">
              <Link href={invitationUrl} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Link Undangan
              </Link>
            </Button>
          )}

          <Button asChild variant="outline">
            <Link href={contactUrl} target="_blank">
              <MessageCircle className="mr-2 h-4 w-4" />
              Hubungi Admin
            </Link>
          </Button>

          <PaymentModalAk
            formId={params.formId}
            isPaid={isPaid ? 1 : 0}
          />

          <Button asChild variant="outline">
            <Link
              href={`/forms/aqiqah-khitan/${params.formId}/atur-foto/success/result/edit`}
            >
              <FilePenLine className="mr-2 h-4 w-4" />
              Edit Data Undangan
            </Link>
          </Button>

          {isPaid && invitationUrl && (
            <Button asChild variant="outline">
              <Link
                href={`/share?uri=${encodeURIComponent(invitationUrl)}`}
                target="_blank"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Bagikan Undangan
              </Link>
            </Button>
          )}
        </div>

        <DataPhotoTableAk
          formId={params.formId}
          setUploading={setUploading}
        />
      </section>
    </main>
  );
}
