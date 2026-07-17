"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";

import BankCombobox from "@/components/admin/BankComboBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { getBankList } from "@/lib/bank";
import QuillHtmlEditor from "@/components/QuillHtmlEditor.client";
import MusicCombobox from "@/components/admin/MusicComboBox";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const MAX_STRING_LENGTH = 191;
const EMPTY_REKENING = {
  icon: "",
  namaRekening: "",
  nomorRekening: "",
};

const getFieldOptions = (field) =>
  (field.options || [])
    .map((option) =>
      typeof option === "string"
        ? { value: option, label: option }
        : {
            value: String(option?.value ?? ""),
            label: option?.label || String(option?.value ?? ""),
          }
    )
    .filter((option) => option.value);

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

const validateForm = (fields, formData) => {
  const errors = {};

  fields.forEach((field) => {
    const value = formData[field.name];

    if (field.inputType === "rekening-list") {
      const rows = getRekeningRows(value);
      const completedRows = rows.filter(
        (row) =>
          String(row.namaRekening || "").trim() &&
          String(row.nomorRekening || "").trim()
      );
      const incompleteIndex = rows.findIndex((row) => {
        const name = String(row.namaRekening || "").trim();
        const number = String(row.nomorRekening || "").trim();
        return Boolean(name || number) && (!name || !number);
      });

      if (field.required && completedRows.length === 0) {
        errors[field.name] = `${field.label} wajib diisi`;
      } else if (incompleteIndex >= 0) {
        errors[field.name] =
          `Lengkapi nama dan nomor rekening pada baris ${incompleteIndex + 1}`;
      }
      return;
    }

    if (field.required && isEmptyValue(value)) {
      errors[field.name] = `${field.label} wajib diisi`;
      return;
    }

    if (isEmptyValue(value)) return;

    if (field.inputType === "select") {
      const allowedValues = getFieldOptions(field).map((option) => option.value);

      if (allowedValues.length > 0 && !allowedValues.includes(String(value))) {
        errors[field.name] = `${field.label} harus dipilih dari daftar`;
        return;
      }
    }

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

export default function EditAqiqahKhitanPage({ params }) {
  const router = useRouter();
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [relationOptions, setRelationOptions] = useState({});
  const [errors, setErrors] = useState({});
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bankList, setBankList] = useState([]);
  const [bankListLoading, setBankListLoading] = useState(false);

  const detailPath = `/admin/list/aqiqah-khitan/${params.formId}`;

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
    const loadEditor = async () => {
      setLoading(true);
      setPageError("");

      try {
        const response = await axios.get(
          `${apiUrl}/admin/forms/aqiqah-khitan/${params.formId}/edit`,
          { withCredentials: true }
        );
        const nextFields = [...(response.data?.fields || [])].sort(
          (first, second) => first.order - second.order
        );
        const nextForm = { ...(response.data?.form || {}) };

        nextFields.forEach((field) => {
          if (field.inputType === "rekening-list") {
            nextForm[field.name] = getRekeningRows(nextForm[field.name]);
          } else if (nextForm[field.name] === null) {
            nextForm[field.name] = "";
          }
        });

        setFields(nextFields);
        setFormData(nextForm);
        setRelationOptions(response.data?.options || {});
      } catch (error) {
        console.error("Gagal memuat editor Aqiqah/Khitan:", error);

        if (error.response?.status === 401 || error.response?.status === 403) {
          toast({
            title: "Akses ditolak",
            description: "Hanya admin yang dapat mengedit data ini.",
            variant: "destructive",
          });
          router.replace(detailPath);
          return;
        }

        setPageError(
          error.response?.data?.error ||
            "Data editor Aqiqah/Khitan gagal dimuat."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEditor();
  }, [detailPath, params.formId, router]);

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
    updateField(fieldName, rows.length > 0 ? rows : [{ ...EMPTY_REKENING }]);
  };

  const renderInput = (field) => {
    const value = formData[field.name] ?? "";
    const error = errors[field.name];

    if (field.inputType === "select") {
      const options = getFieldOptions(field);

      return (
        <div className="space-y-2">
          <Select
            value={value ? String(value) : ""}
            onValueChange={(selectedValue) =>
              updateField(field.name, selectedValue)
            }
          >
            <SelectTrigger id={field.name} aria-invalid={Boolean(error)}>
              <SelectValue
                placeholder={
                  field.placeholder ||
                  (field.required ? `Pilih ${field.label}` : "Tidak dipilih")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.inputType === "rich-text") {
      return (
        <QuillHtmlEditor
          id={field.name}
          name={field.name}
          value={value}
          ariaInvalid={Boolean(error)}
          onChange={(html) => updateField(field.name, html)}
          placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}`}
        />
      );
    }

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
              {rows.length > 1 ? (
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
              ) : null}

              {field.withBankIcon ? (
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
              ) : null}

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
            <Plus className="h-4 w-4" />
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
        <MusicCombobox
          value={value ? String(value) : ""}
          onValueChange={(selectedValue) =>
            updateField(field.name, selectedValue)
          }
          apiUrl={apiUrl}
          placeholder="Tidak dipilih"
          allowClear
        />
      );
    }

    if (field.inputType === "relation-select") {
      const options = relationOptions[field.relationModel] || [];

      return (
        <select
          id={field.name}
          name={field.name}
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(event) => updateField(field.name, event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">
            {field.required ? `Pilih ${field.label}` : "Tidak dipilih"}
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
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
        `${apiUrl}/admin/forms/aqiqah-khitan/${params.formId}`,
        normalizePayload(fields, formData),
        { withCredentials: true }
      );
      router.push(`${detailPath}?success=true`);
    } catch (error) {
      console.error("Gagal memperbarui form Aqiqah/Khitan:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        toast({
          title: "Akses ditolak",
          description: "Sesi admin tidak valid atau sudah berakhir.",
          variant: "destructive",
        });
        router.replace(detailPath);
        return;
      }

      const serverErrors = error.response?.data?.errors;

      if (serverErrors && typeof serverErrors === "object") {
        setErrors(serverErrors);
      } else {
        setSubmitError(
          error.response?.data?.error ||
            "Data form Aqiqah/Khitan gagal diperbarui."
        );
      }
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="h-10 w-full border-b bg-white" />
      <div className="mx-4 flex min-h-screen">
        <div className="fixed z-40 hidden h-full w-64 bg-gray-800 md:relative md:block" />

        <main className="flex w-full flex-grow flex-col md:pl-24">
          <div className="mx-auto w-full max-w-4xl p-4">
            <header className="mb-5 flex items-start gap-3 border-b pb-5">
              <Button asChild variant="ghost" size="icon" title="Kembali">
                <Link href={detailPath}>
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Kembali</span>
                </Link>
              </Button>
              <div>
                <p className="text-sm text-gray-500">Admin</p>
                <h1 className="text-xl font-semibold sm:text-2xl">
                  Edit Form Aqiqah / Khitan
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  ID {formData.id || params.formId}
                </p>
              </div>
            </header>

            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border bg-white p-12 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Memuat editor...
              </div>
            ) : null}

            {!loading && pageError ? (
              <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-5">
                <p className="text-sm text-red-700">{pageError}</p>
                <Button asChild variant="outline">
                  <Link href={detailPath}>Kembali ke detail</Link>
                </Button>
              </div>
            ) : null}

            {!loading && !pageError && fields.length > 0 ? (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-6 rounded-lg border bg-white p-5 sm:p-6"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  {fields.map((field) => {
                    const wideField =
                      field.inputType === "textarea" ||
                      field.inputType === "rich-text" ||
                      field.inputType === "rekening-list";

                    return (
                      <div
                        id={`field-${field.name}`}
                        key={field.name}
                        className={`space-y-2 ${
                          wideField ? "sm:col-span-2" : ""
                        }`}
                      >
                        <Label htmlFor={field.name}>
                          {field.label}
                          {field.required ? (
                            <span className="ml-1 text-red-500">*</span>
                          ) : null}
                        </Label>
                        {renderInput(field)}
                        {errors[field.name] ? (
                          <p className="text-sm text-red-600">
                            {errors[field.name]}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {submitError ? (
                  <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {submitError}
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                  <Button asChild type="button" variant="outline">
                    <Link href={detailPath}>Batal</Link>
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        </main>
      </div>
    </>
  );
}
