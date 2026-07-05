"use client";

import { useState } from "react";
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

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function DialogCancelPaymentAk({
  open,
  onOpenChange,
  row,
  onDataUpdate,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCancelPayment = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.put(
        `${apiUrl}/admin/forms/aqiqah-khitan/${row.uuid || row.id}/payment/cancel`,
        {},
        { withCredentials: true }
      );

      onOpenChange(false);
      onDataUpdate(response.data?.message);
    } catch (requestError) {
      console.error("Gagal membatalkan pembayaran Aqiqah/Khitan:", requestError);
      setError(
        requestError.response?.data?.error ||
          "Status lunas gagal dibatalkan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isLoading) {
          setError("");
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan Status Lunas?</AlertDialogTitle>
          <AlertDialogDescription>
            Status pembayaran akan menjadi belum lunas dan nominal pembayaran
            akan dikembalikan menjadi Rp 0.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Ya, Batalkan
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
