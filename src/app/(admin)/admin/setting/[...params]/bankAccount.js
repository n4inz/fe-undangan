"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaTrash, FaPlus, FaImage, FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Trash, UploadCloud, UploadIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BankAccountForm() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([
    { name: "", number: "", file: null, preview: null, id: null },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'image' | 'account', index: number }
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const response = await axios.get(`${apiBase}/bank-accounts`, {
          withCredentials: true,
        });

        if (response.data?.data?.length > 0) {
          const formattedAccounts = response.data.data.map((account) => {
            let fileName = null;
            if (account.fileImage) {
              fileName = account.fileImage.replace(/^.*\/uploads\/asset\//, "");
            } else if (account.icon) {
              fileName = account.icon.replace(/^.*\/uploads\/asset\//, "");
            }
            return {
              id: account.id,
              name: account.name,
              number: account.number || account.noRekening || "",
              file: null,
              preview: fileName ? fileName : null,
            };
          });
          setAccounts(formattedAccounts);
        } else {
          setAccounts([{ name: "", number: "", file: null, preview: null, id: null }]);
        }
      } catch (error) {
        console.error("Failed to fetch bank accounts:", error);
        setAccounts([{ name: "", number: "", file: null, preview: null, id: null }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBankAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (index, field, value) => {
    setAccounts((prev) =>
      prev.map((acc, i) => (i === index ? { ...acc, [field]: value } : acc))
    );
  };

  // for new uploads (not yet saved on server)
  const handleFileChangeLocal = (index, file) => {
    const updated = [...accounts];
    updated[index].file = file || null;

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updated[index].preview = e.target.result; // data URL
        setAccounts(updated);
      };
      reader.readAsDataURL(file);
    } else {
      updated[index].preview = null;
      setAccounts(updated);
    }
  };

  // replace image for an existing account (upload immediately to server)
  const handleReplaceImage = async (index, file) => {
    const acc = accounts[index];
    if (!acc?.id) {
      // for new (unsaved) account, behave like local change
      handleFileChangeLocal(index, file);
      return;
    }

    if (!file) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("fileImage", file);

      const res = await axios.put(`${apiBase}/bank-accounts/${acc.id}/image`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      // server returns new fileImage path (e.g. /uploads/asset/<filename>)
      const returnedPath = res.data?.data?.fileImage || null;
      const filename = returnedPath ? returnedPath.replace(/^.*\/uploads\/asset\//, "") : null;

      const updated = [...accounts];
      updated[index].preview = filename;
      updated[index].file = null;
      setAccounts(updated);
    } catch (err) {
      console.error("Failed to replace image:", err);
      alert(err.response?.data?.error || "Gagal mengganti gambar");
    } finally {
      setIsLoading(false);
    }
  };

  // delete image on server (for existing account)
  const handleDeleteImageServer = (index) => {
    const acc = accounts[index];
    if (!acc?.id) {
      // local unsaved item: just clear preview
      const updated = [...accounts];
      updated[index].file = null;
      updated[index].preview = null;
      setAccounts(updated);
      return;
    }

    setDeleteConfirm({ type: "image", index });
  };

  const removeFileFromAccount = (index) => {
    // clear local preview and file (for unsaved)
    const updated = [...accounts];
    updated[index].file = null;
    updated[index].preview = null;
    setAccounts(updated);

    const inputEl = document.getElementById(`file-${index}`);
    if (inputEl) inputEl.value = "";
  };

  const addAccount = () => {
    setAccounts((prev) => [...prev, { name: "", number: "", file: null, preview: null, id: null }]);
  };

  // remove entire account (uses API if id present)
  const removeAccount = (index) => {
    setDeleteConfirm({ type: "account", index });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { type, index } = deleteConfirm;
    const acc = accounts[index];

    if (type === "image") {
      try {
        setIsLoading(true);
        await axios.delete(`${apiBase}/bank-accounts/${acc.id}/image`, { withCredentials: true });

        const updated = [...accounts];
        updated[index].preview = null;
        setAccounts(updated);
      } catch (err) {
        console.error("Failed to delete image:", err);
        alert(err.response?.data?.error || "Gagal menghapus gambar di server");
      } finally {
        setIsLoading(false);
      }
    } else if (type === "account") {
      if (acc?.id) {
        try {
          setIsLoading(true);
          await axios.delete(`${apiBase}/bank-accounts/${acc.id}`, {
            withCredentials: true,
          });
        } catch (error) {
          console.error("Failed to delete bank account:", error);
          alert("Gagal menghapus rekening di server");
          setIsLoading(false);
          setDeleteConfirm(null);
          return;
        } finally {
          setIsLoading(false);
        }
      }
      setAccounts((prev) => prev.filter((_, i) => i !== index));
    }

    setDeleteConfirm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newAccounts = accounts.filter((acc) => !acc.id);
      const existingAccounts = accounts.filter((acc) => acc.id);

      if (newAccounts.length === 0 && existingAccounts.length === 0) {
        router.push("/admin/setting");
        return;
      }

      const promises = [];

      // Create new accounts
      newAccounts.forEach((account) => {
        const formData = new FormData();
        formData.append("name", account.name);
        formData.append("number", account.number);
        if (account.file) {
          formData.append("fileImage", account.file);
        }
        promises.push(
          axios.post(`${apiBase}/bank-accounts`, formData, {
            withCredentials: true,
          })
        );
      });

      // Update existing accounts
      existingAccounts.forEach((account) => {
        promises.push(
          axios.put(
            `${apiBase}/bank-accounts/${account.id}`,
            {
              name: account.name,
              number: account.number,
            },
            {
              withCredentials: true,
            }
          )
        );
      });

      await Promise.all(promises);

      router.push("/admin/setting");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Gagal menyimpan bank accounts");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <FaSpinner className="animate-spin text-2xl text-gray-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {accounts.map((account, idx) => (
        <div
          key={account.id || `new-${idx}`}
          className="bg-white border rounded-lg p-4 shadow-sm grid grid-cols-12 gap-4 items-center"
        >
          {/* Inputs */}
          <div className="col-span-12 md:col-span-8 grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`name-${idx}`} className="text-sm font-medium text-slate-700">
                Nama Rekening
              </Label>
              <Input
                id={`name-${idx}`}
                value={account.name}
                onChange={(e) => handleChange(idx, "name", e.target.value)}
                placeholder="Contoh: BCA - KCP Jakarta"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor={`number-${idx}`} className="text-sm font-medium text-slate-700">
                Nomor Rekening
              </Label>
              <Input
                id={`number-${idx}`}
                value={account.number}
                onChange={(e) => handleChange(idx, "number", e.target.value)}
                placeholder="1234-5678-9012"
                required
                className="mt-1"
              />
            </div>
          </div>

          {/* Image / controls */}
          <div className="col-span-12 md:col-span-4 flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-28 h-28 bg-gray-50 rounded-md border flex items-center justify-center overflow-hidden relative">
                {account.preview ? (
                  <img
                    alt="preview"
                    src={
                      typeof account.preview === "string" && account.preview.startsWith("data:")
                        ? account.preview
                        : `${apiBase}/asset/${String(account.preview).replace(/^.*\/uploads\/asset\//, "")}`
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <FaImage className="mb-1" />
                    <span className="text-xs">No image</span>
                  </div>
                )}

                {/* small trash icon: still deletes image (server) */}
                {account.preview && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImageServer(idx);
                    }}
                    title="Hapus gambar"
                    className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-600 hover:scale-105 shadow"
                  >
                    <FaTrash size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1">
              <Label className="text-sm font-medium text-slate-700">Logo / Gambar</Label>

              <div className="mt-1 flex items-center gap-2">
                {/* Hidden input for replace (existing accounts) */}
                <input
                  id={`replace-file-${idx}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (account.id) {
                      handleReplaceImage(idx, f);
                    } else {
                      handleFileChangeLocal(idx, f);
                    }
                    // reset input to allow re-select same file later
                    e.currentTarget.value = "";
                  }}
                  className="text-sm file:bg-transparent file:border-0 file:text-sm"
                />
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    // trigger file input click
                    const el = document.getElementById(`replace-file-${idx}`);
                    if (el) el.click();
                  }}
                  className="px-3 py-1 text-sm"
                >
                  <UploadCloud className="mr-1 h-4 w-4" />
                </Button>

                {/* Hapus Rekening (menghapus baris / memanggil API delete) */}
                <Button
                  type="button"
                  onClick={() => removeAccount(idx)}
                  className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-100"
                >
                  <Trash className="mr-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <Button type="button" onClick={addAccount} className="flex items-center gap-2 px-4 py-2">
          <FaPlus />
          Tambah Rekening
        </Button>

        <div className="ml-auto flex gap-2 mb-8">
          <Button type="button" onClick={() => router.push("/admin/setting")} className="px-4 py-2 bg-gray-50 text-gray-700">
            Batal
          </Button>

          <Button type="submit" className="px-4 py-2">
            Simpan
          </Button>
        </div>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "image"
                ? "Apakah Anda yakin ingin menghapus gambar logo ini dari server? Tindakan ini tidak dapat dibatalkan."
                : "Apakah Anda yakin ingin menghapus rekening ini? Tindakan ini tidak dapat dibatalkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
