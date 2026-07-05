"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Crop, ImageIcon, Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import ImageEditor from "@/components/atur-foto/aqiqah-khitan/ImageEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { checkFormAk } from "@/utils/checkForm";

const dataUrlToFile = (dataUrl, filename) => {
  const [metadata, content] = dataUrl.split(",");
  const mime = metadata.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, { type: mime });
};

export default function DataPhotoTableAk({ formId, setUploading }) {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const [data, setData] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [editingRow, setEditingRow] = useState(null);

  const getImageUrl = useCallback(
    (row) => {
      if (row.images?.fileImage) {
        return `${apiBase}/images/${row.images.fileImage}`;
      }

      if (row.asset?.file) {
        return `${apiBase}/asset/${row.asset.file}`;
      }

      return null;
    },
    [apiBase]
  );

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiBase}/get-photo-order-ak/${formId}`
      );
      setData(
        (response.data?.images || []).filter(
          (item) => item.partName !== "thumbnail"
        )
      );
    } catch (error) {
      console.error("Error loading AK photos:", error);
      setData([]);
      toast({
        title: "Daftar foto gagal dimuat",
        variant: "destructive",
      });
    }
  }, [apiBase, formId]);

  const uploadPhoto = useCallback(async (file, row) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "File harus berupa gambar",
        variant: "destructive",
      });
      return;
    }

    const payload = new FormData();
    payload.append("file", file);
    payload.append("idImage", row.idImage ?? "");
    payload.append("imageOrderId", row.id ?? "");
    payload.append("order", row.order ?? "");

    setUploading(true);

    try {
      await axios.put(
        `${apiBase}/update-photo-ak/${formId}/${encodeURIComponent(
          row.partName || "foto"
        )}`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      await fetchData();
      toast({ title: "Foto berhasil diperbarui" });
    } catch (error) {
      console.error("Error updating AK photo:", error);
      toast({
        title: "Foto gagal diperbarui",
        description:
          error.response?.data?.message || "Silakan coba beberapa saat lagi.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [apiBase, fetchData, formId, setUploading]);

  const handleSaveEditedImage = async (dataUrl) => {
    try {
      const file = dataUrlToFile(dataUrl, "edited-image.jpg");
      await uploadPhoto(file, editingRow);
    } finally {
      setEditingImage(null);
      setEditingRow(null);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const { error } = await checkFormAk(formId);

      if (error) {
        router.replace("/");
        return;
      }

      await fetchData();
      setPageLoading(false);
    };

    initialize();
  }, [fetchData, formId, router]);

  const columns = useMemo(
    () => [
      {
        name: "#",
        selector: (row, index) =>
          (currentPage - 1) * rowsPerPage + index + 1,
        width: "64px",
      },
      {
        name: "Foto",
        width: "120px",
        cell: (row) => {
          const imageUrl = getImageUrl(row);

          return imageUrl ? (
            <button
              type="button"
              className="my-2 h-20 w-20 overflow-hidden rounded-md border bg-gray-50"
              onClick={() => setPreviewImage(imageUrl)}
              title="Lihat foto"
            >
              <img
                src={imageUrl}
                alt={row.partName || "Foto"}
                className="h-full w-full object-cover"
              />
            </button>
          ) : (
            <div className="my-2 flex h-20 w-20 items-center justify-center rounded-md border bg-gray-50">
              <ImageIcon className="h-6 w-6 text-gray-400" />
            </div>
          );
        },
      },
      {
        name: "Bagian",
        selector: (row) =>
          row.order ? `${row.partName} ${row.order}` : row.partName || "-",
        sortable: true,
        grow: 2,
      },
      {
        name: "Aksi",
        width: "116px",
        cell: (row) => {
          const imageUrl = getImageUrl(row);

          return (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Crop foto"
                disabled={!imageUrl}
                onClick={() => {
                  setEditingImage(imageUrl);
                  setEditingRow(row);
                }}
              >
                <Crop className="h-4 w-4" />
                <span className="sr-only">Crop foto</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Ganti foto"
                onClick={() =>
                  document
                    .getElementById(`ak-photo-upload-${row.id}`)
                    ?.click()
                }
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Ganti foto</span>
              </Button>

              <input
                id={`ak-photo-upload-${row.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  await uploadPhoto(file, row);
                  event.target.value = "";
                }}
              />
            </div>
          );
        },
      },
    ],
    [currentPage, getImageUrl, rowsPerPage, uploadPhoto]
  );

  if (pageLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-hidden border-y">
        <DataTable
          columns={columns}
          data={data}
          pagination
          paginationTotalRows={data.length}
          onChangePage={setCurrentPage}
          onChangeRowsPerPage={setRowsPerPage}
          noDataComponent="Belum ada foto."
        />
      </div>

      <Dialog
        open={Boolean(previewImage)}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col items-center justify-center overflow-hidden border-0 bg-black/95 p-3 text-white shadow-none [&>button]:right-3 [&>button]:top-3 [&>button]:z-10 [&>button]:rounded-full [&>button]:bg-black/70 [&>button]:p-2 [&>button]:opacity-100 [&>button]:ring-offset-black [&>button:hover]:bg-black sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-6xl sm:rounded-xl sm:p-6">
          <DialogTitle className="sr-only">Preview foto</DialogTitle>
          {previewImage && (
            <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
              <img
                src={previewImage}
                alt="Preview foto"
                className="block max-h-full max-w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editingImage && editingRow && (
        <ImageEditor
          image={editingImage}
          idImage={editingRow.idImage}
          onSave={handleSaveEditedImage}
          onCancel={() => {
            setEditingImage(null);
            setEditingRow(null);
          }}
        />
      )}
    </>
  );
}
