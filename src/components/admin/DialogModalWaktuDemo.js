import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import axios from "axios";

export function DialogModalWaktuDemo({ open, onOpenChange, index, row, formId, onDataUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ waktuDemo: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/update-demo/${row.id}`,
        {
          waktuDemo: formData.waktuDemo
        },
        {
          withCredentials: true
        }
      );
      onOpenChange(false);
      onDataUpdate(response.data.message);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setFormData({ waktuDemo: "" });
    }
    // console.log("row", row);
  }, [open, row]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Waktu Demo</AlertDialogTitle>
          <AlertDialogDescription>
            Masukkan waktu demo dalam hari.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="waktuDemo">Masukkan Waktu Demo (Hari)</Label>
              <Input
                type="number"
                name="waktuDemo"
                value={formData.waktuDemo}
                onChange={handleChange}
                min="1"
                required   // ✅ field wajib diisi
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submit
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}