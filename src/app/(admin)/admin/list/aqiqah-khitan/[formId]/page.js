"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Loader2,
  MoreVertical,
  Pencil,
  UserCircle,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const getPhotoUrl = (photo) => {
  if (photo?.images?.fileImage) {
    return `${apiUrl}/images/${photo.images.fileImage}`;
  }

  if (photo?.asset?.file) {
    return `${apiUrl}/asset/${photo.asset.file}`;
  }

  return "";
};

const formatPhotoLabel = (photo, index) => {
  const rawPartName = String(photo?.partName || "").trim();
  const partName =
    rawPartName && rawPartName !== "-"
      ? rawPartName
          .replace(/-/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "Foto";

  if (photo?.order) {
    return `${partName} ${photo.order}`;
  }

  return rawPartName && rawPartName !== "-"
    ? partName
    : `${partName} ${index + 1}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Makassar",
  }).format(date);
};

const renderValue = (field, form) => {
  const value = form?.[field.name];

  if (field.relationModel) {
    const relation = form?.[field.relationModel];
    return relation?.name
      ? `${relation.name}${value ? ` (#${value})` : ""}`
      : value || "-";
  }

  if (field.inputType === "rekening-list") {
    if (!Array.isArray(value) || value.length === 0) return "-";

    return (
      <ul className="space-y-1">
        {value.map((item, index) => (
          <li key={`${item?.namaRekening || "rekening"}-${index}`}>
            <span className="font-medium">{item?.namaRekening || "-"}</span>
            <span className="text-gray-500"> — </span>
            <span>{item?.nomorRekening || item?.noRekening || "-"}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";

  if (field.inputType === "url") {
    const url = String(value);

    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title={url}
        className="inline-flex max-w-full min-w-0 items-center gap-1 text-blue-600 hover:underline"
      >
        <span className="min-w-0 truncate">{url}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    );
  }

  if (field.inputType === "rich-text") {
    return (
      <div
        className="quill-rendered-html"
        dangerouslySetInnerHTML={{ __html: String(value) }}
      />
    );
  }

  if (field.inputType === "textarea") {
    return <span className="whitespace-pre-line">{String(value)}</span>;
  }

  return String(value);
};

export default function AqiqahKhitanDetailPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fields, setFields] = useState([]);
  const [form, setForm] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(
          `${apiUrl}/admin/forms/aqiqah-khitan/${params.formId}`,
          { withCredentials: true }
        );

        setFields(
          [...(response.data?.fields || [])].sort(
            (first, second) => first.order - second.order
          )
        );
        setForm(response.data?.form || null);
        setIsAdmin(response.data?.isAdmin || 0);
      } catch (requestError) {
        console.error("Gagal memuat detail Aqiqah/Khitan:", requestError);
        setError(
          requestError.response?.data?.error ||
            "Detail form Aqiqah/Khitan gagal dimuat."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [params.formId]);

  useEffect(() => {
    const loadPhotos = async () => {
      setPhotosLoading(true);
      setPhotosError("");

      try {
        const response = await axios.get(
          `${apiUrl}/get-photo-order-ak/${params.formId}`
        );

        setPhotos(response.data?.images || []);
      } catch (requestError) {
        console.error("Gagal memuat foto Aqiqah/Khitan:", requestError);
        setPhotos([]);
        setPhotosError("Foto form Aqiqah/Khitan gagal dimuat.");
      } finally {
        setPhotosLoading(false);
      }
    };

    loadPhotos();
  }, [params.formId]);

  useEffect(() => {
    if (searchParams.get("success") !== "true") return;

    toast({ description: "Data form berhasil diperbarui." });
    router.replace(`/admin/list/aqiqah-khitan/${params.formId}`, {
      scroll: false,
    });
  }, [params.formId, router, searchParams]);

  const rows = useMemo(
    () =>
      fields.map((field) => ({
        name: field.name,
        label: field.label,
        value: renderValue(field, form),
      })),
    [fields, form]
  );

  const photoItems = useMemo(
    () =>
      photos
        .filter((photo) => photo?.partName !== "thumbnail")
        .map((photo, index) => ({
          ...photo,
          imageUrl: getPhotoUrl(photo),
          label: formatPhotoLabel(photo, index),
        }))
        .filter((photo) => photo.imageUrl),
    [photos]
  );

  return (
    <>
      <div className="h-10 w-full border-b bg-white" />
      <div className="mx-4 flex min-h-screen">
        <div className="fixed z-40 hidden h-full w-64 bg-gray-800 md:relative md:block" />

        <main className="flex w-full flex-grow flex-col md:pl-24">
          <div className="mx-auto w-full max-w-5xl p-4">
            <header className="mb-5 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Button asChild variant="ghost" size="icon" title="Kembali">
                  <Link href="/admin/list/aqiqah-khitan">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Kembali</span>
                  </Link>
                </Button>
                <div>
                  <p className="text-sm text-gray-500">
                    Detail Form Aqiqah / Khitan
                  </p>
                  <h1 className="text-xl font-semibold">
                    ID {form?.id || params.formId}
                  </h1>
                </div>
              </div>

              {isAdmin === 1 && form ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Aksi form"
                    >
                      <MoreVertical className="h-5 w-5" />
                      <span className="sr-only">Aksi form</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onSelect={() =>
                        router.push(
                          `/admin/list/aqiqah-khitan/${form.uuid || form.id}/edit`
                        )
                      }
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        window.open(
                          `/forms/aqiqah-khitan/${form.uuid || form.id}/atur-foto/success`,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      Panel User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </header>

            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border bg-white p-12 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Memuat detail...
              </div>
            ) : null}

            {!loading && error ? (
              <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-5">
                <p className="text-sm text-red-700">{error}</p>
                <Button asChild variant="outline">
                  <Link href="/admin/list/aqiqah-khitan">Kembali ke list</Link>
                </Button>
              </div>
            ) : null}

            {!loading && form ? (
              <div className="space-y-5">
                <section className="grid gap-4 rounded-lg border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">
                      Pembayaran
                    </p>
                    <div className="mt-2">
                      {form.isPaid === 1 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Lunas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-600">
                          <XCircle className="h-4 w-4" />
                          Belum lunas
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">
                      UUID
                    </p>
                    <p className="mt-2 break-all text-sm">{form.uuid}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">
                      Dibuat
                    </p>
                    <p className="mt-2 text-sm">
                      {formatDateTime(form.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">
                      Link Undangan
                    </p>
                    {form.linkUndangan ? (
                      <a
                        href={form.linkUndangan}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 break-all text-sm text-blue-600 hover:underline"
                      >
                        Buka link
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="mt-2 text-sm">-</p>
                    )}
                  </div>
                </section>

                <section className="rounded-lg border bg-white p-5">
                  <h2 className="mb-4 font-semibold">Data Form</h2>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {rows.map((row) => (
                      <div
                        key={row.name}
                        className="min-w-0 rounded-md border border-gray-200 p-3"
                      >
                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          {row.label}
                        </dt>
                        <dd className="mt-1 min-w-0 break-words text-sm text-gray-950">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="rounded-lg border bg-white p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-semibold">Foto</h2>
                    {photoItems.length > 0 ? (
                      <span className="text-sm text-gray-500">
                        {photoItems.length} foto
                      </span>
                    ) : null}
                  </div>

                  {photosLoading ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed p-8 text-sm text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Memuat foto...
                    </div>
                  ) : null}

                  {!photosLoading && photosError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {photosError}
                    </div>
                  ) : null}

                  {!photosLoading && !photosError && photoItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center text-sm text-gray-500">
                      <ImageIcon className="mb-2 h-7 w-7 text-gray-400" />
                      Belum ada foto.
                    </div>
                  ) : null}

                  {!photosLoading && !photosError && photoItems.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {photoItems.map((photo, index) => (
                        <button
                          key={`${photo.id || photo.idImage || "photo"}-${index}`}
                          type="button"
                          className="overflow-hidden rounded-md border bg-white text-left transition hover:border-blue-300 hover:shadow-sm"
                          onClick={() => setPreviewImage(photo.imageUrl)}
                          title="Lihat foto"
                        >
                          <div className="relative aspect-[4/3] w-full bg-gray-100">
                            <Image
                              src={photo.imageUrl}
                              alt={photo.label}
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-medium text-gray-950">
                              {photo.label}
                            </p>
                            <p className="mt-1 truncate text-xs text-gray-500">
                              {photo.images?.fileImage || photo.asset?.file}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </section>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      <Dialog
        open={Boolean(previewImage)}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col items-center justify-center overflow-hidden border-0 bg-black/95 p-3 text-white shadow-none [&>button]:right-3 [&>button]:top-3 [&>button]:z-10 [&>button]:rounded-full [&>button]:bg-black/70 [&>button]:p-2 [&>button]:opacity-100 [&>button]:ring-offset-black [&>button:hover]:bg-black sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-6xl sm:rounded-xl sm:p-6">
          <DialogTitle className="sr-only">Preview foto</DialogTitle>
          {previewImage ? (
            <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
              <Image
                src={previewImage}
                alt="Preview foto"
                fill
                sizes="100vw"
                className="object-contain"
                unoptimized
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
