"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import {
  CheckCircle2,
  FileImage,
  Loader2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

export default function DialogModalProofPaymentAk({ formId }) {
  const [open, setOpen] = useState(false);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadPayment = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.get(
        `${apiUrl}/payment-ak/${encodeURIComponent(formId)}`,
        { withCredentials: true }
      );
      setPayment(response.data || null);
    } catch (error) {
      console.error(
        "Gagal memuat bukti pembayaran Aqiqah/Khitan:",
        error
      );
      setPayment(null);
      setErrorMessage(
        error.response?.data?.error ||
          "Bukti pembayaran gagal dimuat. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);

    if (nextOpen) {
      loadPayment();
    }
  };

  const services = payment
    ? [
        ["Tema undangan", true],
        ["Custom musik", payment.isMusic],
        ["Custom font/tema", payment.isFont],
        ["Menu autoscroll", payment.isFloatingBar],
      ]
    : [];
  const proofUrl = payment?.file
    ? `${apiUrl}/payment/${payment.file}`
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-slate-600 hover:text-slate-900"
          title="Lihat bukti pembayaran"
        >
          <FileImage className="h-4 w-4" />
          <span className="sr-only">Lihat bukti pembayaran</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>Bukti Pembayaran</DialogTitle>
          <DialogDescription>
            Pembayaran form Aqiqah/Khitan ID {formId}.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Memuat bukti pembayaran...
            </div>
          ) : errorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : payment ? (
            <div className="space-y-5 pb-2">
              <div className="grid grid-cols-2 gap-3 rounded-md border bg-gray-50 p-4 text-sm">
                <div>
                  <p className="text-gray-500">Nama rekening/e-wallet</p>
                  <p className="mt-1 font-semibold">{payment.name || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Paket</p>
                  <p className="mt-1 font-semibold capitalize">
                    {payment.paket || "-"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Total pembayaran</p>
                  <p className="mt-1 text-lg font-bold text-green-700">
                    {formatCurrency(payment.totalPayment)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Layanan dipilih</p>
                <div className="space-y-2 text-sm">
                  {services.map(([label, enabled]) => (
                    <p key={label} className="flex items-center">
                      {enabled ? (
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4 text-gray-400" />
                      )}
                      {label}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">
                  Screenshot pembayaran
                </p>
                {proofUrl ? (
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Buka gambar ukuran penuh"
                    className="block overflow-hidden rounded-md border bg-gray-50"
                  >
                    <Image
                      src={proofUrl}
                      alt="Bukti pembayaran Aqiqah/Khitan"
                      width={800}
                      height={800}
                      className="max-h-96 w-full object-contain"
                    />
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">
                    Screenshot pembayaran tidak tersedia.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-md border bg-gray-50 p-4 text-sm text-gray-600">
              Data pembayaran tidak ditemukan.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
