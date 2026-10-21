"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DialogModalPayment({ open, onOpenChange, row, onDataUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [payment, setPayment] = useState("");
  const [error, setError] = useState("");
  const saving = useRef(false);

  useEffect(() => {
    setPayment("");
    setError("");
  }, [open, row?.id]);

  const handleOpenChange = (nextOpen) => {
    if (saving.current) return;
    setPayment("");
    setError("");
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving.current) return;

    const paymentAmount = Number(payment);
    if (
      !payment.trim() ||
      !Number.isInteger(paymentAmount) ||
      paymentAmount < 0 ||
      paymentAmount > 2147483647
    ) {
      setError("Masukkan nominal bulat antara Rp 0 dan Rp 2.147.483.647.");
      return;
    }
    if (!row?.id) {
      setError("Data undangan tidak tersedia. Muat ulang halaman dan coba lagi.");
      return;
    }

    saving.current = true;
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/update-payment/${row.id}`,
        { isPaid: 0, paymentAmount },
        { withCredentials: true }
      );

      onOpenChange(false);
      onDataUpdate(response.data?.message);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Pembayaran gagal disimpan. Silakan coba lagi."
      );
    } finally {
      saving.current = false;
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Pembayaran Lunas</AlertDialogTitle>
          <AlertDialogDescription>
            {row?.id ? `Undangan #${row.id}. ` : ""}
            Masukkan jumlah pembayaran untuk menandai undangan sebagai lunas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="payment-amount">Jumlah Pembayaran (Rp)</Label>
              <Input
                id="payment-amount"
                type="number"
                name="payment"
                min="0"
                max="2147483647"
                step="1"
                required
                value={payment}
                onChange={(event) => setPayment(event.target.value)}
                disabled={isLoading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "payment-error" : undefined}
              />
            </div>
            {error ? (
              <p id="payment-error" role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel type="button" disabled={isLoading}>
              Kembali
            </AlertDialogCancel>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Menyimpan..." : "Tandai Lunas"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
