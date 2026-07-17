"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

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
import { getBankList } from "@/lib/bank";
import { getTemaAk } from "@/lib/tema";
import MusicList from "../../new/musicList";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import QuillHtmlEditor from "@/components/QuillHtmlEditor.client";

const FORM_DATA_KEY = "formAqiqahKhitanData";
const MAX_DEFAULT_STRING_LENGTH = 191;
const NEW_REQUIRED_FIELDS = new Set(["idTema"]);

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const REKENING_EMPTY_ITEM = { icon: "", namaRekening: "", nomorRekening: "" };

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

const isLocalStorageAccessible = () => {
  try {
    const testKey = "__aqiqah_khitan_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const hasOwn = (source, key) => Object.prototype.hasOwnProperty.call(source, key);

const createEmptyRekeningItem = () => ({ ...REKENING_EMPTY_ITEM });

const getRekeningRows = (value) =>
  Array.isArray(value) && value.length > 0 ? value : [createEmptyRekeningItem()];

const isEmptyRekeningRow = (row) =>
  !String(row?.namaRekening || "").trim() &&
  !String(row?.nomorRekening || row?.noRekening || "").trim();

const isPartialRekeningRow = (row) => {
  const namaRekening = String(row?.namaRekening || "").trim();
  const nomorRekening = String(row?.nomorRekening || row?.noRekening || "").trim();
  return Boolean(namaRekening || nomorRekening) && (!namaRekening || !nomorRekening);
};

const emptyValueForField = (field) => {
  if (field.inputType === "checkbox") return false;
  if (field.inputType === "rekening-list") return [createEmptyRekeningItem()];
  return "";
};

const buildInitialFormData = (fields, savedData = {}) =>
  fields.reduce((data, field) => {
    const savedValue = hasOwn(savedData, field.name) ? savedData[field.name] : undefined;
    data[field.name] =
      field.inputType === "rekening-list"
        ? getRekeningRows(savedValue)
        : savedValue ?? emptyValueForField(field);
    return data;
  }, {});

const isEmptyValue = (value) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "");

const isFieldRequired = (field) =>
  field.required || NEW_REQUIRED_FIELDS.has(field.name);

const validateUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const validateFormData = (fields, formData) => {
  const nextErrors = {};

  fields.forEach((field) => {
    const value = formData[field.name];

    if (field.inputType === "rekening-list") {
      const rows = getRekeningRows(value);
      const filledRows = rows.filter((row) => !isEmptyRekeningRow(row));
      const partialIndex = rows.findIndex(isPartialRekeningRow);

      if (isFieldRequired(field) && filledRows.length === 0) {
        nextErrors[field.name] = `${field.label} wajib diisi`;
        return;
      }

      if (partialIndex !== -1) {
        nextErrors[field.name] = `Lengkapi nama dan nomor rekening pada baris ${partialIndex + 1}`;
        return;
      }

      const tooLongIndex = filledRows.findIndex(
        (row) =>
          String(row.namaRekening).trim().length > MAX_DEFAULT_STRING_LENGTH ||
          String(row.nomorRekening).trim().length > MAX_DEFAULT_STRING_LENGTH
      );

      if (tooLongIndex !== -1) {
        nextErrors[field.name] = `Rekening maksimal ${MAX_DEFAULT_STRING_LENGTH} karakter`;
      }

      return;
    }

    const empty = isEmptyValue(value);

    if (isFieldRequired(field) && empty) {
      nextErrors[field.name] = `${field.label} wajib diisi`;
      return;
    }

    if (empty) return;

    if (field.inputType === "select") {
      const allowedValues = getFieldOptions(field).map((option) => option.value);

      if (allowedValues.length > 0 && !allowedValues.includes(String(value))) {
        nextErrors[field.name] = `${field.label} harus dipilih dari daftar`;
        return;
      }
    }

    if (field.type === "String") {
      const maxLength = field.maxLength || MAX_DEFAULT_STRING_LENGTH;

      if (String(value).trim().length > maxLength) {
        nextErrors[field.name] = `${field.label} maksimal ${maxLength} karakter`;
        return;
      }

      if (field.inputType === "url" && !validateUrl(String(value).trim())) {
        nextErrors[field.name] = `${field.label} harus berupa URL valid`;
      }
    }

    if (field.type === "Int") {
      const numericValue = Number(value);

      if (!Number.isInteger(numericValue)) {
        nextErrors[field.name] = `${field.label} harus berupa angka bulat`;
      }
    }
  });

  return nextErrors;
};

const normalizePayload = (fields, formData) =>
  fields.reduce((payload, field) => {
    const value = formData[field.name];

    if (field.inputType === "rekening-list") {
      const normalizedRows = getRekeningRows(value)
        .map((row) => ({
          namaRekening: String(row?.namaRekening || "").trim(),
          nomorRekening: String(row?.nomorRekening || row?.noRekening || "").trim(),
          icon: String(row?.icon || "").trim(),
        }))
        .filter((row) => row.namaRekening && row.nomorRekening);

      payload[field.name] =
        normalizedRows.length > 0
          ? normalizedRows.map((row) => ({
            ...(row.icon ? { icon: row.icon } : {}),
            namaRekening: row.namaRekening,
            nomorRekening: row.nomorRekening,
          }))
          : null;
      return payload;
    }

    if (isEmptyValue(value)) {
      payload[field.name] = null;
      return payload;
    }

    if (field.type === "Int") {
      payload[field.name] = Number(value);
      return payload;
    }

    if (field.inputType === "checkbox") {
      payload[field.name] = Boolean(value);
      return payload;
    }

    payload[field.name] = typeof value === "string" ? value.trim() : value;
    return payload;
  }, {});

const FormAqiqahKhitanPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const audioRef = useRef(null);

  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [bankList, setBankList] = useState([]);
  const [bankListLoading, setBankListLoading] = useState(false);
  const [temaOptions, setTemaOptions] = useState([]);
  const [temaLoading, setTemaLoading] = useState(false);
  const [temaCommandOpen, setTemaCommandOpen] = useState(false);
  const [temaCommandInput, setTemaCommandInput] = useState("");

  const scrollToFirstError = useCallback(
    (fieldErrors) => {
      const firstInvalidField = fields.find((field) => fieldErrors[field.name]);
      if (!firstInvalidField) return;

      document
        .getElementById(`field-${firstInvalidField.name}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [fields]
  );

  const loadSchema = useCallback(async () => {
    setSchemaLoading(true);
    setSchemaError("");

    try {
      const response = await axios.get(`${apiUrl}/forms/aqiqah-khitan/schema`);
      const schemaFields = [...(response.data?.fields || [])].sort(
        (first, second) => first.order - second.order
      );

      let savedData = {};
      const canUseStorage = isLocalStorageAccessible();
      setStorageReady(canUseStorage);

      if (canUseStorage) {
        const rawSavedData = window.localStorage.getItem(FORM_DATA_KEY);
        savedData = rawSavedData ? JSON.parse(rawSavedData) : {};
      }

      setFields(schemaFields);
      setFormData(buildInitialFormData(schemaFields, savedData));
    } catch (error) {
      console.error("Gagal memuat schema aqiqah khitan:", error);
      setSchemaError("Gagal memuat schema form. Silakan coba refresh halaman.");
    } finally {
      setSchemaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  useEffect(() => {
    const loadBankList = async () => {
      setBankListLoading(true);

      try {
        const response = await getBankList();
        setBankList(Array.isArray(response) ? response : response?.data || []);
      } catch (error) {
        console.error("Gagal memuat daftar bank:", error);
        setBankList([]);
      } finally {
        setBankListLoading(false);
      }
    };

    loadBankList();
  }, []);

  useEffect(() => {
    const loadTemaOptions = async () => {
      setTemaLoading(true);

      try {
        const response = await getTemaAk();
        setTemaOptions(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Gagal memuat daftar tema:", error);
        setTemaOptions([]);
      } finally {
        setTemaLoading(false);
      }
    };

    loadTemaOptions();
  }, []);

  useEffect(() => {
    const selectedTema = temaOptions.find(
      (option) => String(option.id) === String(formData.idTema || "")
    );

    if (selectedTema) {
      setTemaCommandInput(selectedTema.name);
    }
  }, [formData.idTema, temaOptions]);

  useEffect(() => {
    if (!storageReady || fields.length === 0) return;

    try {
      window.localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formData));
    } catch (error) {
      console.warn("Gagal menyimpan draft form:", error);
    }
  }, [fields.length, formData, storageReady]);

  const updateField = useCallback((fieldName, value) => {
    setFormData((current) => ({
      ...current,
      [fieldName]: value,
    }));

    setErrors((current) => {
      if (!current[fieldName]) return current;
      const nextErrors = { ...current };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }, []);

  const updateRekeningItem = useCallback(
    (fieldName, index, itemField, value) => {
      const rows = getRekeningRows(formData[fieldName]).map((row, rowIndex) =>
        rowIndex === index ? { ...row, [itemField]: value } : row
      );

      updateField(fieldName, rows);
    },
    [formData, updateField]
  );

  const addRekeningItem = useCallback(
    (fieldName) => {
      updateField(fieldName, [...getRekeningRows(formData[fieldName]), createEmptyRekeningItem()]);
    },
    [formData, updateField]
  );

  const removeRekeningItem = useCallback(
    (fieldName, index) => {
      const rows = getRekeningRows(formData[fieldName]).filter((_, rowIndex) => rowIndex !== index);
      updateField(fieldName, rows.length > 0 ? rows : [createEmptyRekeningItem()]);
    },
    [formData, updateField]
  );

  const renderInput = (field) => {
    const value = formData[field.name] ?? emptyValueForField(field);
    const errorMessage = errors[field.name];
    const describedBy = errorMessage ? `${field.name}-error` : undefined;

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
            <SelectTrigger
              id={field.name}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={describedBy}
            >
              <SelectValue
                placeholder={
                  field.placeholder ||
                  (isFieldRequired(field) ? `Pilih ${field.label}` : "Tidak dipilih")
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
          ariaInvalid={Boolean(errorMessage)}
          ariaDescribedBy={describedBy}
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
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={describedBy}
          onChange={(event) => updateField(field.name, event.target.value)}
          placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}`}
        />
      );
    }

    if (field.inputType === "rekening-list") {
      const rows = getRekeningRows(value);
      const subFields = field.subFields || [
        { name: "namaRekening", label: "Nama Rekening / E-Wallet" },
        { name: "nomorRekening", label: "Nomor Rekening / E-Wallet" },
      ];

      return (
        <div id={field.name} className="space-y-3" aria-describedby={describedBy}>
          {rows.map((row, index) => (
            <div
              key={`${field.name}-${index}`}
              className="relative space-y-3 rounded-lg border border-gray-300 p-4"
            >
              {index > 0 ? (
                <button
                  type="button"
                  onClick={() => removeRekeningItem(field.name, index)}
                  className="absolute right-2 top-2 rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                  title="Hapus Rekening"
                  aria-label="Hapus rekening"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
              {field.withBankIcon ? (
                <div className="space-y-1 pr-8">
                  <Label className="block text-gray-700">Icon Bank {index + 1}</Label>
                  <BankCombobox
                    value={row?.icon || ""}
                    onValueChange={(selectedIcon) =>
                      updateRekeningItem(field.name, index, "icon", selectedIcon)
                    }
                    bankList={bankList}
                    isLoading={bankListLoading}
                  />
                </div>
              ) : null}
              {subFields.map((subField) => (
                <div key={subField.name} className="space-y-1">
                  <Label
                    htmlFor={`${field.name}-${index}-${subField.name}`}
                    className="block text-gray-700"
                  >
                    {subField.name === "namaRekening"
                      ? `Nama Rekening ${index + 1}`
                      : `Nomor Rekening ${index + 1}`}
                  </Label>
                  <Input
                    id={`${field.name}-${index}-${subField.name}`}
                    name={`${field.name}.${index}.${subField.name}`}
                    maxLength={subField.maxLength || MAX_DEFAULT_STRING_LENGTH}
                    value={
                      subField.name === "nomorRekening"
                        ? row?.nomorRekening || row?.noRekening || ""
                        : row?.[subField.name] || ""
                    }
                    aria-invalid={Boolean(errorMessage)}
                    onChange={(event) =>
                      updateRekeningItem(field.name, index, subField.name, event.target.value)
                    }
                    placeholder={
                      subField.name === "namaRekening" ? "Nama Bank a/n Nasabah" : "012345xxxx"
                    }
                    className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                  />
                </div>
              ))}
            </div>
          ))}
          <Button
            type="button"
            className="mt-2 gap-2 bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            onClick={() => addRekeningItem(field.name)}
          >
            <Plus className="h-4 w-4" />
            Tambah rekening
          </Button>
        </div>
      );
    }

    if (field.inputType === "relation-select" && field.relationModel === "music") {
      return (
        <div className="space-y-3">
          <div
            id={field.name}
            className="rounded-lg border border-gray-200 p-3"
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={describedBy}
          >
            <MusicList
              currentlyPlaying={currentlyPlaying}
              setCurrentlyPlaying={setCurrentlyPlaying}
              audioRef={audioRef}
              onSongSelected={(selectedId) => updateField(field.name, selectedId)}
              selectedSongId={value ? String(value) : ""}
            />
          </div>
          {!isFieldRequired(field) && value ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateField(field.name, "")}
            >
              Kosongkan pilihan
            </Button>
          ) : null}
        </div>
      );
    }

    if (field.inputType === "relation-select" && field.relationModel === "tema") {
      const selectedTema = temaOptions.find((option) => String(option.id) === String(value || ""));

      return (
        <div className="space-y-3">
          <div className="relative w-full max-w-md">
            <Command
              id={field.name}
              className="overflow-visible rounded-lg border"
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={describedBy}
            >
              <CommandInput
                placeholder="Pilih Tema..."
                value={temaCommandInput}
                onValueChange={setTemaCommandInput}
                onFocus={() => setTemaCommandOpen(true)}
                onBlur={() => setTimeout(() => setTemaCommandOpen(false), 200)}
                className="h-9 text-sm"
              />

              {temaCommandOpen ? (
                <CommandList className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                  <CommandGroup>
                    {temaLoading ? (
                      <CommandItem value="loading" className="h-8 text-sm" disabled>
                        <span className="text-muted-foreground">Loading...</span>
                      </CommandItem>
                    ) : temaOptions.length > 0 ? (
                      temaOptions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={`${option.name} ${option.id}`}
                          onSelect={() => {
                            updateField(field.name, option.id);
                            setTemaCommandInput(option.name);
                            setTemaCommandOpen(false);
                          }}
                          className="flex h-8 justify-between text-sm"
                        >
                          <span>{option.name}</span>
                        </CommandItem>
                      ))
                    ) : (
                      <CommandItem value="no-options" className="h-8 text-sm" disabled>
                        <span className="text-muted-foreground">Tidak ada pilihan tersedia</span>
                      </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              ) : null}
            </Command>
          </div>
          {selectedTema ? (
            <p className="text-sm text-gray-600">Tema dipilih: {selectedTema.name}</p>
          ) : null}
        </div>
      );
    }

    if (field.inputType === "checkbox") {
      return (
        <label className="flex h-10 items-center gap-3 rounded-md border border-input px-3 text-sm">
          <input
            id={field.name}
            name={field.name}
            type="checkbox"
            checked={Boolean(value)}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={describedBy}
            onChange={(event) => updateField(field.name, event.target.checked)}
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
        maxLength={field.type === "String" ? field.maxLength || undefined : undefined}
        value={value}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={describedBy}
        onChange={(event) => updateField(field.name, event.target.value)}
        placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}`}
      />
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Hindari double click
    if (isSubmitting) return;

    setSubmitError("");

    const validationErrors = validateFormData(fields, formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      scrollToFirstError(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const tokenResponse = await axios.get(`${apiUrl}/form/token`, {
        withCredentials: true,
      });

      const payload = {
        ...normalizePayload(fields, formData),
        customerSessionToken: session?.user?.sessionToken || null,
      };

      const response = await axios.post(
        `${apiUrl}/forms/aqiqah-khitan`,
        payload,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${tokenResponse.data.token}`,
          },
        }
      );

      if (storageReady) {
        window.localStorage.removeItem(FORM_DATA_KEY);
      }

      const formId = response.data?.formId || response.data?.data?.uuid;

      // Jangan setIsSubmitting(false) di sini.
      // Biarkan tombol tetap disable sampai pindah halaman.
      router.push(`/forms/aqiqah-khitan/${formId}/atur-foto`);
    } catch (error) {
      console.error("Gagal submit form aqiqah khitan:", error);

      const serverErrors = error.response?.data?.errors;

      if (serverErrors && typeof serverErrors === "object") {
        setErrors(serverErrors);
        scrollToFirstError(serverErrors);
      } else {
        setSubmitError(
          error.response?.data?.error || "Data belum berhasil disimpan."
        );
      }

      // Aktifkan lagi tombol hanya jika gagal
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (schemaLoading) {
      return (
        <div className="space-y-4 p-5 sm:p-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded-md bg-gray-100" />
            </div>
          ))}
        </div>
      );
    }

    if (schemaError) {
      return (
        <div className="space-y-4 p-5 sm:p-6">
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {schemaError}
          </p>
          <Button type="button" variant="outline" onClick={loadSchema}>
            Coba lagi
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} noValidate className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => {
            const wideField =
              field.inputType === "textarea" ||
              field.inputType === "rich-text" ||
              field.inputType === "relation-select" ||
              field.inputType === "rekening-list";

            return (
              <div
                key={field.name}
                id={`field-${field.name}`}
                className={`space-y-2 ${wideField ? "sm:col-span-2" : ""}`}
              >
                <Label htmlFor={field.name} className="flex items-center gap-1">
                  <span>{field.label}</span>
                  {isFieldRequired(field) ? <span className="text-red-500">*</span> : null}
                </Label>
                {renderInput(field)}
                {errors[field.name] ? (
                  <p id={`${field.name}-error`} className="text-sm text-red-600">
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

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={isSubmitting || fields.length === 0} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan
          </Button>
        </div>
      </form>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <section className="mx-auto w-full max-w-4xl rounded-lg border bg-white shadow-sm">
        <div className="border-b p-5 sm:p-6">
          <p className="text-sm font-medium text-blue-700">Form baru</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950 sm:text-3xl">
            Aqiqah / Khitan
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Isi data acara sesuai kebutuhan undangan.
          </p>
        </div>
        {renderContent()}
      </section>
    </main>
  );
};

export default FormAqiqahKhitanPage;
