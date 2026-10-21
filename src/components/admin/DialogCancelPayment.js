"use client";

import { useEffect, useRef, useState } from "react";
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

export function DialogCancelPayment({ open, onOpenChange, row, onDataUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);

  useEffect(() => {
    setError("");
  }, [open, row?.id]);

  const handleOpenChange = (nextOpen) => {
    if (saving.current) return;
    setError("");
    onOpenChange(nextOpen);
  };

  const handleCancelPayment = async () => {
    if (saving.current) return;
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
        { isPaid: 1, paymentAmount: 0 },
        { withCredentials: true }
      );

      onOpenChange(false);
      onDataUpdate(response.data?.message);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Status lunas gagal dibatalkan. Silakan coba lagi."
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
          <AlertDialogTitle>Batalkan Status Lunas?</AlertDialogTitle>
          <AlertDialogDescription>
            {row?.id ? `Undangan #${row.id}. ` : ""}
            Status pembayaran akan menjadi belum lunas dan nominal pembayaran
            akan dikembalikan menjadi Rp 0.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={isLoading}>
            Kembali
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isLoading}
            onClick={handleCancelPayment}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? "Menyimpan..." : "Ya, Batalkan"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
