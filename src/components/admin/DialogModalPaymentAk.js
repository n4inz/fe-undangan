"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const MAX_PAYMENT_AMOUNT = 2147483647;

const onlyDigits = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "");

const formatThousands = (value) => {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
};

export default function DialogModalPaymentAk({
  open,
  onOpenChange,
  row,
  onDataUpdate,
}) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPaymentAmount(
        Number(row?.paymentAmount) > 0 ? String(row.paymentAmount) : ""
      );
      setError("");
    }
  }, [open, row]);

  const handleChange = (event) => {
    const digits = onlyDigits(event.target.value);
    const amount = Number(digits || 0);

    if (amount > MAX_PAYMENT_AMOUNT) {
      setError("Nominal pembayaran terlalu besar.");
      return;
    }

    setPaymentAmount(digits);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const amount = Number(paymentAmount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Nominal pembayaran wajib diisi dan harus lebih dari 0.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.put(
        `${apiUrl}/admin/forms/aqiqah-khitan/${row.uuid || row.id}/payment`,
        { paymentAmount: amount },
        { withCredentials: true }
      );

      onOpenChange(false);
      onDataUpdate(response.data?.message);
    } catch (requestError) {
      console.error("Gagal memperbarui pembayaran Aqiqah/Khitan:", requestError);
      setError(
        requestError.response?.data?.error ||
          "Status pembayaran gagal diperbarui."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isLoading) onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {row?.isPaid === 1
              ? "Ubah Nominal Pembayaran"
              : "Pembayaran Lunas"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Masukkan nominal pembayaran untuk menandai pesanan sebagai lunas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-2 py-4">
            <Label htmlFor="paymentAmountAk">Jumlah Pembayaran</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-500">
                Rp
              </span>
              <Input
                id="paymentAmountAk"
                name="paymentAmount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={formatThousands(paymentAmount)}
                onChange={handleChange}
                placeholder="0"
                className="pl-10"
                aria-invalid={Boolean(error)}
              />
            </div>
            <p className="text-xs text-gray-500">
              Contoh: 1.500.000
            </p>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel type="button" disabled={isLoading}>
              Batal
            </AlertDialogCancel>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Simpan
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
