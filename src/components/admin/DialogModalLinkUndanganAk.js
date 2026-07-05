"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

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

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const invitationBaseUrl = String(
  process.env.NEXT_PUBLIC_LINK_UNDANGAN || ""
).replace(/\/+$/g, "");

const normalizeSlug = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const sanitizeSlugInput = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+/g, "");

export default function DialogModalLinkUndanganAk({
  open,
  onOpenChange,
  row,
  onDataUpdate,
}) {
  const [slug, setSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formId = row?.uuid || row?.id;
  const hasInvitationLink = Boolean(row?.linkUndangan);

  useEffect(() => {
    if (!open || !formId) {
      if (!open) {
        setSlug("");
        setErrorMessage("");
      }
      return undefined;
    }

    const controller = new AbortController();

    const fetchInvitationLink = async () => {
      setSlug(row?.slug || "");
      setErrorMessage("");
      setIsFetching(true);

      try {
        const response = await axios.get(
          `${apiUrl}/admin/forms/aqiqah-khitan/${encodeURIComponent(formId)}/link`,
          {
            withCredentials: true,
            signal: controller.signal,
          }
        );

        setSlug(response.data?.slug || "");
      } catch (error) {
        if (error.code !== "ERR_CANCELED") {
          setErrorMessage(
            error.response?.data?.error ||
              "Slug undangan gagal dimuat. Silakan coba lagi."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFetching(false);
        }
      }
    };

    fetchInvitationLink();

    return () => controller.abort();
  }, [formId, open, row?.slug]);

  const handleSlugChange = (event) => {
    setSlug(sanitizeSlugInput(event.target.value));
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedSlug = normalizeSlug(slug);

    if (!normalizedSlug) {
      setErrorMessage("Slug undangan wajib diisi.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await axios.put(
        `${apiUrl}/admin/forms/aqiqah-khitan/${encodeURIComponent(formId)}/link`,
        { slug: normalizedSlug },
        { withCredentials: true }
      );

      onOpenChange(false);
      onDataUpdate?.(response.data?.message);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error ||
          "Link undangan gagal disimpan. Silakan coba lagi."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[475px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasInvitationLink
              ? "Edit Link Undangan"
              : "Tambah Link Undangan"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Masukkan slug yang akan digunakan sebagai link undangan
            Aqiqah/Khitan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-2 py-4">
            <Label htmlFor="aqiqah-khitan-slug">Slug Undangan</Label>
            <div className="flex">
              <span className="flex max-w-[55%] items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-l-md border border-r-0 bg-gray-100 px-3 text-sm text-gray-600">
                {invitationBaseUrl}/
              </span>
              <Input
                id="aqiqah-khitan-slug"
                name="slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                maxLength={150}
                autoComplete="off"
                required
                disabled={isFetching || isSaving}
                className="rounded-l-none"
                placeholder="nama-anak"
              />
            </div>

            {slug ? (
              <p className="break-all text-xs text-gray-500">
                Preview:{" "}
                <span className="font-medium">
                  {invitationBaseUrl}/{slug}
                </span>
              </p>
            ) : null}

            {errorMessage ? (
              <p className="text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              type="button"
              disabled={isFetching || isSaving}
            >
              Batal
            </AlertDialogCancel>
            <Button
              type="submit"
              disabled={isFetching || isSaving || !slug}
            >
              {isFetching || isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isFetching
                ? "Memuat..."
                : isSaving
                  ? "Menyimpan..."
                  : hasInvitationLink
                    ? "Simpan Perubahan"
                    : "Tambah Link"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
