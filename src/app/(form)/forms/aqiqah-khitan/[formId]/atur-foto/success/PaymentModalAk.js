"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  ImageUp,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { getBankAccounts, getCompanyProfile } from "@/lib/company";

const createEmptyForm = () => ({
  name: "",
  paket: "antri",
  file: null,
  isMusic: false,
  isFont: false,
  isFloatingBar: false,
});

const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

export default function PaymentModalAk({
  formId,
  isPaid = 0,
  buttonClassName = "",
}) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const fileInputRef = useRef(null);
  const previewObjectUrlRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [payment, setPayment] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [price, setPrice] = useState(0);
  const [isMusicDisabled, setIsMusicDisabled] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [company, setCompany] = useState(null);
  const isLocked = Number(isPaid) === 1;

  const setLocalPreview = useCallback((file) => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  }, []);

  const hydrateForm = useCallback((savedPayment) => {
    setFormData({
      name: savedPayment?.name || "",
      paket: savedPayment?.paket || "antri",
      file: null,
      isMusic: Boolean(savedPayment?.isMusic),
      isFont: Boolean(savedPayment?.isFont),
      isFloatingBar: Boolean(savedPayment?.isFloatingBar),
    });
    setLocalPreview(null);
  }, [setLocalPreview]);

  const loadPayment = useCallback(async () => {
    const response = await axios.get(`${apiBase}/payment-ak/${formId}`);
    const savedPayment = response.data || null;
    setPayment(savedPayment);
    hydrateForm(savedPayment);
    return savedPayment;
  }, [apiBase, formId, hydrateForm]);

  const loadData = useCallback(async () => {
    setIsFetching(true);

    try {
      const savedPayment = await loadPayment();
      const [priceResult, accountsResult, companyResult] =
        await Promise.allSettled([
          axios.get(`${apiBase}/tema-price-ak/${formId}`),
          getBankAccounts(),
          getCompanyProfile(),
        ]);

      if (priceResult.status === "fulfilled") {
        const nextPrice = Number(priceResult.value.data?.price || 0);
        const musicDisabled = priceResult.value.data?.music === false;

        setPrice(nextPrice);
        setIsMusicDisabled(musicDisabled);

        if (!savedPayment && musicDisabled) {
          setFormData((current) => ({ ...current, isMusic: true }));
        }
      }

      if (accountsResult.status === "fulfilled") {
        setBankAccounts(
          accountsResult.value?.data || accountsResult.value || []
        );
      }

      if (companyResult.status === "fulfilled") {
        setCompany(
          companyResult.value?.data || companyResult.value || null
        );
      }
    } catch (error) {
      console.error("Error loading AK payment:", error);
      toast({
        title: "Data pembayaran gagal dimuat",
        description: "Silakan tutup lalu buka kembali form pembayaran.",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  }, [apiBase, formId, loadPayment]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const totalPayment = useMemo(() => {
    let total = price;

    if (formData.paket === "express") total += 30000;
    if (formData.isMusic) total += 5000;
    if (formData.isFont) total += 20000;
    if (formData.isFloatingBar) total += 5000;

    return total;
  }, [formData, price]);

  const savedProofUrl = payment?.file
    ? `${apiBase}/payment/${payment.file}`
    : null;
  const displayedProofUrl = previewUrl || savedProofUrl;

  const beginEdit = (replaceProof = false) => {
    if (isLocked) return;

    hydrateForm(payment);
    setIsEditing(true);

    if (replaceProof) {
      window.setTimeout(() => fileInputRef.current?.click(), 0);
    }
  };

  const cancelEdit = () => {
    hydrateForm(payment);
    setIsEditing(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format file tidak didukung",
        description: "Pilih bukti pembayaran dalam format gambar.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Ukuran file terlalu besar",
        description: "Ukuran maksimal bukti pembayaran adalah 10 MB.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    setFormData((current) => ({ ...current, file }));
    setLocalPreview(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isLocked) {
      toast({
        title: "Pembayaran sudah dikonfirmasi",
        description: "Data pembayaran tidak dapat diubah.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Nama rekening belum diisi",
        description: "Masukkan nama rekening atau e-wallet pengirim.",
        variant: "destructive",
      });
      return;
    }

    if (!payment && !formData.file) {
      toast({
        title: "Bukti pembayaran belum dipilih",
        description: "Unggah foto bukti pembayaran untuk melanjutkan.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = new FormData();
      payload.append(
        "data",
        JSON.stringify({
          name: formData.name.trim(),
          paket: formData.paket,
          isMusic: formData.isMusic,
          isFont: formData.isFont,
          isFloatingBar: formData.isFloatingBar,
          themaPrice: price,
          totalPayment,
        })
      );

      if (formData.file) {
        payload.append("payment", formData.file);
      }

      const response = await axios.post(
        `${apiBase}/upload-payment-ak/${formId}`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setPayment(response.data);
      hydrateForm(response.data);
      setIsEditing(false);
      toast({
        title: payment
          ? "Data pembayaran diperbarui"
          : "Bukti pembayaran berhasil dikirim",
      });
    } catch (error) {
      console.error("Error submitting AK payment:", error);
      toast({
        title: "Pembayaran gagal disimpan",
        description:
          error.response?.data?.error ||
          "Periksa kembali data lalu coba beberapa saat lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAccount = async (number) => {
    try {
      await navigator.clipboard.writeText(number);
      toast({ title: "Nomor rekening berhasil disalin" });
    } catch {
      toast({
        title: "Nomor rekening gagal disalin",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (nextOpen) => {
    setIsOpen(nextOpen);

    if (nextOpen && !isFetching) {
      loadPayment().catch((error) => {
        console.error("Error refreshing AK payment:", error);
      });
    }

    if (!nextOpen) {
      setIsEditing(false);
      hydrateForm(payment);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            className={`w-full bg-green-700 text-white hover:bg-green-800 ${buttonClassName}`}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            {payment ? "Lihat Pembayaran" : "Bayar Sekarang"}
          </Button>
        </DialogTrigger>

        <DialogContent className="flex h-[min(92dvh,760px)] max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col gap-3 overflow-hidden p-4">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {payment && !isEditing
                ? "Pembayaran Anda"
                : payment
                  ? "Edit Pembayaran"
                  : "Upload Bukti Pembayaran"}
            </DialogTitle>
            <DialogDescription>
              Simpan nama pengirim dan foto bukti pembayaran.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-3">
            {isFetching ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-gray-500" />
              </div>
            ) : payment && !isEditing ? (
              <div className="space-y-5 pb-2">
                <div className="grid grid-cols-2 gap-3 rounded-md border bg-gray-50 p-4 text-sm">
                  <div>
                    <p className="text-gray-500">Nama rekening/e-wallet</p>
                    <p className="mt-1 font-semibold">{payment.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Paket</p>
                    <p className="mt-1 font-semibold capitalize">
                      {payment.paket}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Total pembayaran</p>
                    <p className="mt-1 text-lg font-bold text-green-700">
                      {formatCurrency(payment.totalPayment)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Layanan dipilih</p>
                  <div className="space-y-2 text-sm">
                    {[
                      ["Tema undangan", true],
                      ["Custom musik", payment.isMusic],
                      ["Custom font/tema", payment.isFont],
                      ["Menu autoscroll", payment.isFloatingBar],
                    ].map(([label, enabled]) => (
                      <p
                        key={label}
                        className={enabled ? "flex items-center" : "hidden"}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        {label}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Bukti pembayaran
                  </p>
                  {savedProofUrl ? (
                    <button
                      type="button"
                      className="block w-full overflow-hidden rounded-md border bg-gray-50"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      <img
                        src={savedProofUrl}
                        alt="Bukti pembayaran"
                        className="max-h-72 w-full object-contain"
                      />
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Bukti pembayaran tidak tersedia.
                    </p>
                  )}
                </div>

                {!isLocked && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => beginEdit()}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Data
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => beginEdit(true)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Ganti Bukti
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 pb-2">
                <div className="space-y-2">
                  <Label htmlFor="payment-name-ak">
                    Nama rekening atau e-wallet
                  </Label>
                  <Input
                    id="payment-name-ak"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nama pemilik rekening/e-wallet"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pilih paket</Label>
                  <RadioGroup
                    value={formData.paket}
                    onValueChange={(value) =>
                      setFormData((current) => ({
                        ...current,
                        paket: value,
                      }))
                    }
                    className="space-y-2"
                  >
                    <label className="flex items-start gap-3 rounded-md border p-3">
                      <RadioGroupItem value="antri" className="mt-0.5" />
                      <span className="text-sm">
                        <span className="block font-medium">Paket Antri</span>
                        1-3 hari, {formatCurrency(price)}
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-md border p-3">
                      <RadioGroupItem value="express" className="mt-0.5" />
                      <span className="text-sm">
                        <span className="block font-medium">Paket Express</span>
                        3 jam, {formatCurrency(price + 30000)}
                      </span>
                    </label>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-file-ak">
                    {payment
                      ? "Ganti foto bukti pembayaran"
                      : "Upload foto bukti pembayaran"}
                  </Label>
                  <Input
                    ref={fileInputRef}
                    id="payment-file-ak"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {payment && !formData.file && (
                    <p className="text-xs text-gray-500">
                      Kosongkan bila ingin tetap memakai bukti sebelumnya.
                    </p>
                  )}
                  {displayedProofUrl && (
                    <button
                      type="button"
                      className="block w-full overflow-hidden rounded-md border bg-gray-50"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      <img
                        src={displayedProofUrl}
                        alt="Preview bukti pembayaran"
                        className="max-h-56 w-full object-contain"
                      />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Tambahan layanan</Label>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox checked disabled />
                    Tema undangan ({formatCurrency(price)})
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={formData.isMusic}
                      disabled={isMusicDisabled}
                      onCheckedChange={(checked) =>
                        setFormData((current) => ({
                          ...current,
                          isMusic: Boolean(checked),
                        }))
                      }
                    />
                    Ganti musik ({formatCurrency(5000)})
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={formData.isFont}
                      onCheckedChange={(checked) =>
                        setFormData((current) => ({
                          ...current,
                          isFont: Boolean(checked),
                        }))
                      }
                    />
                    Custom font/tema ({formatCurrency(20000)})
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={formData.isFloatingBar}
                      onCheckedChange={(checked) =>
                        setFormData((current) => ({
                          ...current,
                          isFloatingBar: Boolean(checked),
                        }))
                      }
                    />
                    Menu autoscroll ({formatCurrency(5000)})
                  </label>
                </div>

                <div className="rounded-md border bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Total pembayaran</p>
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(totalPayment)}
                  </p>
                </div>

                {bankAccounts.length > 0 && (
                  <div className="space-y-2">
                    <Label>Metode pembayaran</Label>
                    {bankAccounts.map((account, index) => (
                      <div
                        key={account.id || `${account.number}-${index}`}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="min-w-0 text-sm">
                          <p className="font-medium">{account.name}</p>
                          <p className="truncate text-gray-600">
                            {account.number}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Salin nomor rekening"
                          onClick={() => copyAccount(account.number)}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Salin nomor rekening</span>
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      Atas nama {company?.ownerName || "-"}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {payment && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={cancelEdit}
                    >
                      Batal
                    </Button>
                  )}
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : payment ? (
                      <Save className="mr-2 h-4 w-4" />
                    ) : (
                      <ImageUp className="mr-2 h-4 w-4" />
                    )}
                    {payment ? "Simpan Perubahan" : "Kirim Pembayaran"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="h-[90dvh] max-w-4xl p-8">
          <DialogTitle className="sr-only">Preview bukti pembayaran</DialogTitle>
          {displayedProofUrl && (
            <img
              src={displayedProofUrl}
              alt="Preview bukti pembayaran"
              className="h-full w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
