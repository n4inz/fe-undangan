"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import BankCombobox from "@/components/admin/BankComboBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getBankList } from "@/lib/bank";
import MusicList from "../../../../../../new/musicList";

const MAX_STRING_LENGTH = 191;
const HIDDEN_EDIT_FIELDS = new Set(["nomorWhatsapp", "idTema"]);
const EMPTY_REKENING = {
  icon: "",
  namaRekening: "",
  nomorRekening: "",
};

const isEmptyValue = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const getRekeningRows = (value) =>
  Array.isArray(value) && value.length > 0
    ? value.map((row) => ({
        icon: row?.icon || "",
        namaRekening: row?.namaRekening || "",
        nomorRekening: row?.nomorRekening || row?.noRekening || "",
      }))
    : [{ ...EMPTY_REKENING }];

const isEmptyRekening = (row) =>
  !String(row?.namaRekening || "").trim() &&
  !String(row?.nomorRekening || "").trim();

const validateForm = (fields, formData) => {
  const errors = {};

  fields.forEach((field) => {
    const value = formData[field.name];

    if (field.inputType === "rekening-list") {
      const rows = getRekeningRows(value);
      const filledRows = rows.filter((row) => !isEmptyRekening(row));
      const incompleteRow = rows.findIndex((row) => {
        const name = String(row.namaRekening || "").trim();
        const number = String(row.nomorRekening || "").trim();
        return Boolean(name || number) && (!name || !number);
      });

      if (field.required && filledRows.length === 0) {
        errors[field.name] = `${field.label} wajib diisi`;
      } else if (incompleteRow >= 0) {
        errors[field.name] =
          `Lengkapi nama dan nomor rekening pada baris ${incompleteRow + 1}`;
      }
      return;
    }

    if (field.required && isEmptyValue(value)) {
      errors[field.name] = `${field.label} wajib diisi`;
      return;
    }

    if (isEmptyValue(value)) return;

    if (
      field.type === "String" &&
      String(value).trim().length > (field.maxLength || MAX_STRING_LENGTH)
    ) {
      errors[field.name] =
        `${field.label} maksimal ${field.maxLength || MAX_STRING_LENGTH} karakter`;
      return;
    }

    if (field.inputType === "url") {
      try {
        new URL(String(value).trim());
      } catch {
        errors[field.name] = `${field.label} harus berupa URL valid`;
      }
    }

    if (field.type === "Int" && !Number.isInteger(Number(value))) {
      errors[field.name] = `${field.label} harus berupa angka bulat`;
    }
  });

  return errors;
};

const normalizePayload = (fields, formData) =>
  fields.reduce((payload, field) => {
    const value = formData[field.name];

    if (field.inputType === "rekening-list") {
      const rows = getRekeningRows(value)
        .map((row) => ({
          icon: String(row.icon || "").trim(),
          namaRekening: String(row.namaRekening || "").trim(),
          nomorRekening: String(row.nomorRekening || "").trim(),
        }))
        .filter((row) => row.namaRekening && row.nomorRekening);

      payload[field.name] =
        rows.length > 0
          ? rows.map((row) => ({
              ...(row.icon ? { icon: row.icon } : {}),
              namaRekening: row.namaRekening,
              nomorRekening: row.nomorRekening,
            }))
          : null;
      return payload;
    }

    if (isEmptyValue(value)) {
      payload[field.name] = null;
    } else if (field.type === "Int") {
      payload[field.name] = Number(value);
    } else if (field.inputType === "checkbox") {
      payload[field.name] = Boolean(value);
    } else {
      payload[field.name] =
        typeof value === "string" ? value.trim() : value;
    }

    return payload;
  }, {});

export default function EditFormAk({ params }) {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const audioRef = useRef(null);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bankList, setBankList] = useState([]);
  const [bankListLoading, setBankListLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  const resultPath =
    `/forms/aqiqah-khitan/${params.formId}/atur-foto/success/result`;

  const updateField = useCallback((fieldName, value) => {
    setFormData((current) => ({ ...current, [fieldName]: value }));
    setErrors((current) => {
      if (!current[fieldName]) return current;
      const nextErrors = { ...current };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }, []);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `${apiBase}/form-edit-ak/${params.formId}`
        );
        const nextFields = [...(response.data?.fields || [])]
          .filter((field) => !HIDDEN_EDIT_FIELDS.has(field.name))
          .sort((first, second) => first.order - second.order);
        const nextForm = response.data?.form || {};

        nextFields.forEach((field) => {
          if (field.inputType === "rekening-list") {
            nextForm[field.name] = getRekeningRows(nextForm[field.name]);
          } else if (nextForm[field.name] === null) {
            nextForm[field.name] = "";
          }
        });

        setFields(nextFields);
        setFormData(nextForm);
      } catch (error) {
        console.error("Gagal memuat form AK:", error);
        setPageError(
          error.response?.data?.error || "Data form gagal dimuat."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [apiBase, params.formId]);

  useEffect(() => {
    const loadBankList = async () => {
      setBankListLoading(true);
      try {
        const response = await getBankList();
        setBankList(Array.isArray(response) ? response : response?.data || []);
      } catch {
        setBankList([]);
      } finally {
        setBankListLoading(false);
      }
    };

    loadBankList();
  }, []);

  const updateRekening = (fieldName, index, key, value) => {
    const rows = getRekeningRows(formData[fieldName]).map((row, rowIndex) =>
      rowIndex === index ? { ...row, [key]: value } : row
    );
    updateField(fieldName, rows);
  };

  const addRekening = (fieldName) => {
    updateField(fieldName, [
      ...getRekeningRows(formData[fieldName]),
      { ...EMPTY_REKENING },
    ]);
  };

  const removeRekening = (fieldName, index) => {
    const rows = getRekeningRows(formData[fieldName]).filter(
      (_, rowIndex) => rowIndex !== index
    );
    updateField(fieldName, rows.length ? rows : [{ ...EMPTY_REKENING }]);
  };

  const renderInput = (field) => {
    const value = formData[field.name] ?? "";
    const error = errors[field.name];

    if (field.inputType === "textarea") {
      return (
        <Textarea
          id={field.name}
          name={field.name}
          rows={4}
          maxLength={field.maxLength || undefined}
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(event) => updateField(field.name, event.target.value)}
        />
      );
    }

    if (field.inputType === "rekening-list") {
      const rows = getRekeningRows(value);

      return (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={`${field.name}-${index}`}
              className="relative space-y-3 rounded-md border p-4"
            >
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-red-600"
                  title="Hapus rekening"
                  onClick={() => removeRekening(field.name, index)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Hapus rekening</span>
                </Button>
              )}

              {field.withBankIcon && (
                <div className="space-y-2 pr-10">
                  <Label>Icon Bank {index + 1}</Label>
                  <BankCombobox
                    value={row.icon}
                    bankList={bankList}
                    isLoading={bankListLoading}
                    onValueChange={(icon) =>
                      updateRekening(field.name, index, "icon", icon)
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${field.name}-${index}-name`}>
                  Nama Rekening / E-Wallet
                </Label>
                <Input
                  id={`${field.name}-${index}-name`}
                  value={row.namaRekening}
                  onChange={(event) =>
                    updateRekening(
                      field.name,
                      index,
                      "namaRekening",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${field.name}-${index}-number`}>
                  Nomor Rekening / E-Wallet
                </Label>
                <Input
                  id={`${field.name}-${index}-number`}
                  value={row.nomorRekening}
                  onChange={(event) =>
                    updateRekening(
                      field.name,
                      index,
                      "nomorRekening",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => addRekening(field.name)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Rekening
          </Button>
        </div>
      );
    }

    if (
      field.inputType === "relation-select" &&
      field.relationModel === "music"
    ) {
      return (
        <div className="space-y-3 rounded-md border p-3">
          <MusicList
            currentlyPlaying={currentlyPlaying}
            setCurrentlyPlaying={setCurrentlyPlaying}
            audioRef={audioRef}
            onSongSelected={(selectedId) =>
              updateField(field.name, selectedId)
            }
            selectedSongId={value ? String(value) : ""}
          />
          {!field.required && value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateField(field.name, "")}
            >
              Kosongkan Pilihan
            </Button>
          )}
        </div>
      );
    }

    if (field.inputType === "checkbox") {
      return (
        <label className="flex h-10 items-center gap-3 rounded-md border px-3 text-sm">
          <input
            id={field.name}
            name={field.name}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) =>
              updateField(field.name, event.target.checked)
            }
          />
          Ya
        </label>
      );
    }

    return (
      <Input
        id={field.name}
        name={field.name}
        type={field.inputType || "text"}
        inputMode={field.type === "Int" ? "numeric" : undefined}
        maxLength={
          field.type === "String" ? field.maxLength || undefined : undefined
        }
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(event) => updateField(field.name, event.target.value)}
      />
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validateForm(fields, formData);
    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidField = fields.find(
        (field) => nextErrors[field.name]
      );
      document
        .getElementById(`field-${firstInvalidField?.name}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);

    try {
      await axios.put(
        `${apiBase}/form-edit-ak/${params.formId}`,
        normalizePayload(fields, formData)
      );
      router.push(resultPath);
    } catch (error) {
      console.error("Gagal memperbarui form AK:", error);
      const serverErrors = error.response?.data?.errors;

      if (serverErrors && typeof serverErrors === "object") {
        setErrors(serverErrors);
      } else {
        setSubmitError(
          error.response?.data?.error || "Data form gagal diperbarui."
        );
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-lg border bg-white shadow-sm">
        <header className="flex items-start gap-3 border-b p-5 sm:p-6">
          <Button asChild variant="ghost" size="icon" title="Kembali">
            <Link href={resultPath}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Kembali</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Edit Data Aqiqah / Khitan
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Pesanan #{formData.id}
            </p>
          </div>
        </header>

        {pageError ? (
          <div className="space-y-4 p-5 sm:p-6">
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {pageError}
            </p>
            <Button asChild variant="outline">
              <Link href={resultPath}>Kembali</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6 p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((field) => {
                const wideField =
                  field.inputType === "textarea" ||
                  field.inputType === "relation-select" ||
                  field.inputType === "rekening-list";

                return (
                  <div
                    id={`field-${field.name}`}
                    key={field.name}
                    className={`space-y-2 ${wideField ? "sm:col-span-2" : ""}`}
                  >
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </Label>
                    {renderInput(field)}
                    {errors[field.name] && (
                      <p className="text-sm text-red-600">
                        {errors[field.name]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {submitError && (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {submitError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
              <Button asChild type="button" variant="outline">
                <Link href={resultPath}>Batal</Link>
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
