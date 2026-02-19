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

export function DialogModalLinkUndangan({ open, onOpenChange, index, row, formId, onDataUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_LINK_UNDANGAN;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!slug || slug.trim() === "") {
      alert("Slug wajib diisi!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/update-link/${row.id}`,
        { slug },
        { withCredentials: true }
      );

      onOpenChange(false);
      onDataUpdate(response.data.message);
      // console.log("Slug:", slug);
      // console.log("LinkUndangan:", `${baseUrl}/${slug}`);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      // fetch slug/link dari API ketika modal dibuka
      const fetchSlug = async () => {
        setIsFetching(true);
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/get-link/${row.id}`,
            { withCredentials: true }
          );
          setSlug(response.data?.slug || "");
        } catch (error) {
          console.error("Gagal fetch slug:", error);
          setSlug("");
        } finally {
          setIsFetching(false);
        }
      };

      fetchSlug();
    } else {
      setSlug("");
    }
  }, [open, row]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Link Undangan</AlertDialogTitle>
          <AlertDialogDescription>
            Masukkan slug untuk undangan. Link otomatis menggunakan base URL dari konfigurasi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="slug">Slug Undangan</Label>
              <div className="flex">
                <span className="flex items-center px-2 border border-r-0 rounded-l-lg bg-gray-100 text-gray-600 text-sm">
                  {baseUrl}/
                </span>
                <Input
                  type="text"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  disabled={isFetching}
                  className="rounded-l-none"
                />
              </div>
              {slug && (
                <p className="text-xs text-gray-500 mt-1">
                  Preview:{" "}
                  <span className="font-medium">{`${baseUrl}/${slug}`}</span>
                </p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading || isFetching}>Cancel</AlertDialogCancel>
            <Button type="submit" disabled={isLoading || isFetching}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simpan
                </>
              ) : isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memuat...
                </>
              ) : row?.linkUndangan ? (
                "Update Link"
              ) : (
                "Tambah Link"
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}