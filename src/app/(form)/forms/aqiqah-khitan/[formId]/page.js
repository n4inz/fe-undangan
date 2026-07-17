"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
};

const renderFieldValue = (field, value) => {
  if (value === null || value === undefined || value === "") return "-";

  if (field.inputType === "rekening-list") {
    if (!Array.isArray(value) || value.length === 0) return "-";

    return (
      <ul className="space-y-1">
        {value.map((item, index) => (
          <li key={`${item?.namaRekening || "rekening"}-${index}`} className="flex items-center gap-2">
            {item?.icon ? (
              <img
                src={`${apiUrl}/images/${item.icon}`}
                alt=""
                className="h-5 w-5 shrink-0 object-contain"
              />
            ) : null}
            <span>
              <span className="font-medium">{item?.namaRekening || "-"}</span>
              <span className="text-gray-500"> - </span>
              <span>{item?.nomorRekening || item?.noRekening || "-"}</span>
            </span>
          </li>
        ))}
      </ul>
    );
  }

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
    return <span className="whitespace-pre-line">{formatValue(value)}</span>;
  }

  return formatValue(value);
};

const AqiqahKhitanSuccessPage = ({ params }) => {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [schemaResponse, formResponse] = await Promise.all([
          axios.get(`${apiUrl}/forms/aqiqah-khitan/schema`),
          axios.get(`${apiUrl}/forms/aqiqah-khitan/${params.formId}`),
        ]);

        setFields([...(schemaResponse.data?.fields || [])].sort((a, b) => a.order - b.order));
        setFormData(formResponse.data?.data || null);
      } catch (requestError) {
        console.error("Gagal memuat data aqiqah khitan:", requestError);
        setError("Data sudah tersimpan, tetapi detailnya belum bisa dimuat.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.formId]);

  const visibleRows = useMemo(() => {
    if (!formData) return [];
    return fields.map((field) => ({
      label: field.label,
      value: renderFieldValue(field, formData[field.name]),
    }));
  }, [fields, formData]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <section className="mx-auto w-full max-w-3xl rounded-lg border bg-white shadow-sm">
        <div className="border-b p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-7 w-7 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">Data berhasil tersimpan</p>
              <h1 className="mt-1 text-2xl font-semibold text-gray-950">
                Form #{params.formId}
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat data...
            </div>
          ) : null}

          {error ? (
            <p className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              {error}
            </p>
          ) : null}

          {!loading && visibleRows.length > 0 ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              {visibleRows.map((row) => (
                <div key={row.label} className="min-w-0 rounded-md border border-gray-200 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {row.label}
                  </dt>
                  <dd className="mt-1 min-w-0 break-words text-sm text-gray-950">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="border-t pt-5">
            <Button asChild variant="outline">
              <Link href="/forms/new/aqiqah-khitan">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Buat form lain
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AqiqahKhitanSuccessPage;
