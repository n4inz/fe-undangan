"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BiCheck, BiCopy, BiMoney, BiX, BiChevronDown, BiDownload } from "react-icons/bi";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { paymentSchema } from "@/lib/validation";
import { Loader2 } from "lucide-react";
import axios from "axios";
import Image from "next/image";
import placeholder from "/public/images/placeholder.png";
import { getBankAccounts, getCompanyProfile } from "@/lib/company";

export default function PaymentModal({ formId, phoneNumber, buttonClassName }) {
  const [formData, setFormData] = useState({
    name: "",
    paket: "antri",
    file: null,
    tema: true,
    isMusic: false,
    isFont: false,
    revisi: true,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [company, setCompany] = useState(null);
  const [price, setPrice] = useState(0);
  const [isMusicDisabled, setIsMusicDisabled] = useState(false);

  // accordion open index
  const [openIndex, setOpenIndex] = useState(null);

  const fileInputRef = useRef(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // Fetch data on mount
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const data = await getBankAccounts();
        setBankAccounts(data.data || []);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load bank accounts. Using defaults.",
          variant: "destructive",
        });
        setBankAccounts([]);
      }
    };

    const fetchCompanyProfile = async () => {
      try {
        const data = await getCompanyProfile();
        setCompany(data.data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load company profile.",
          variant: "destructive",
        });
        setCompany(null);
      }
    };

    const fetchPriceTheme = async () => {
      try {
        const response = await axios.get(`${apiBase}/tema-price/${formId}`);
        setPrice(response.data?.price || 0);
        if (response.data?.music === false) {
          setFormData((prev) => ({ ...prev, isMusic: true }));
          setIsMusicDisabled(true);
        }
      } catch (error) {
        console.error("Error fetching theme price:", error);
        setPrice(0);
      }
    };

    fetchPriceTheme();
    fetchBankAccounts();
    fetchCompanyProfile();
  }, [formId, apiBase]);

  // Calculate total (always fresh)
  const calculateTotal = useCallback(
    (data = formData, currentPrice = price) => {
      let total = 0;
      if (data.tema) total += currentPrice;
      if (data.paket === "express") total += 30000;
      if (data.isMusic) total += 5000;
      if (data.isFont) total += 20000;
      return total;
    },
    [formData, price]
  );

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files[0];
      const allowedTypes = ["image/jpg", "image/jpeg", "image/png", "image/gif"];

      if (file && !allowedTypes.includes(file.type)) {
        toast({
          title: "Image only",
          description: "Only jpeg, jpg, png, gif is accepted.",
          variant: "destructive",
        });
        setFormData((prev) => ({ ...prev, file: null }));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFormData((prev) => ({ ...prev, file }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleRadioChange = (value) => {
    setFormData((prev) => ({ ...prev, paket: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formId || !phoneNumber) {
      toast({
        title: "Error",
        description: "Invalid form ID or phone number.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const currentTotal = calculateTotal(formData, price);
      const updatedFormData = { ...formData, totalPayment: currentTotal };

      paymentSchema.parse(updatedFormData);
      setErrors({});

      const formDataToSend = new FormData();
      const jsonData = {
        name: updatedFormData.name,
        paket: updatedFormData.paket,
        isMusic: updatedFormData.isMusic,
        isFont: updatedFormData.isFont,
        totalPayment: currentTotal,
      };
      formDataToSend.append("data", JSON.stringify(jsonData));

      if (updatedFormData.file) {
        formDataToSend.append("payment", updatedFormData.file);
      }

      const response = await axios.post(
        `${apiBase}/upload-payment/${formId}/${phoneNumber}`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status !== 200) throw new Error("Payment submission failed");

      toast({ title: "Payment submitted successfully!" });

      setFormData({
        name: "",
        paket: "antri",
        file: null,
        tema: true,
        isMusic: false,
        isFont: false,
        revisi: true,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";

      await checkPayment();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form for errors.",
          variant: "destructive",
        });
      } else {
        console.error("Submission error:", error);
        toast({
          title: "Submission Error",
          description: error.message || "Failed to submit payment. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, event) => {
    event?.preventDefault();
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: "Berhasil menyalin rekening." }))
      .catch(() => toast({ title: "Gagal menyalin rekening.", variant: "destructive" }));
  };

  const checkPayment = async () => {
    if (!formId || !phoneNumber) {
      toast({
        title: "Error",
        description: "Invalid form ID or phone number.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.get(`${apiBase}/payment/${formId}/${phoneNumber}`);
      if (response.data != null) {
        setFormData({ ...response.data });
        setPaymentStatus(true);
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      toast({
        title: "Error",
        description: "Failed to check payment status.",
        variant: "destructive",
      });
    }
  };

  const displayTotal = calculateTotal(formData, price);

  useEffect(() => {
    if (formId && phoneNumber) checkPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, phoneNumber]);

  // helper to get filename from stored path or return raw value if it's already filename
  const extractFilename = (filePath) => {
    if (!filePath) return null;
    const m = String(filePath).match(/\/uploads\/asset\/(.+)$/);
    if (m && m[1]) return m[1];
    return String(filePath);
  };

  // Download helper: fetch blob then download (works even if server doesn't set download header)
  const handleDownloadImage = async (url, suggestedFilename) => {
    try {
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to fetch image");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = suggestedFilename || "qris.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      toast({ title: "Download started" });
    } catch (err) {
      console.error("Download failed:", err);
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={`bg-green-700 hover:bg-green-900 text-white font-bold py-4 px-4 rounded-full flex items-center text-sm w-full justify-center ${buttonClassName}`}
        >
          <BiMoney className="h-8 w-8" />
          Bayar Sekarang
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md w-full p-4 h-[100dvh] flex flex-col">
        <DialogTitle>
          {paymentStatus ? (
            <h2 className="text-xl font-bold">Pembayaran Anda</h2>
          ) : (
            <h2 className="text-xl font-bold">Upload Bukti Transfer</h2>
          )}
        </DialogTitle>

        <ScrollArea className="flex-1 p-2">
          {paymentStatus ? (
            <div>
              <div className="mt-4">
                <p className="font-bold">Nama Rekening:</p>
                <p>{formData.name}</p>
              </div>
              <div className="mt-4">
                <p className="font-bold">Paket:</p>
                <p>{formData.paket}</p>
              </div>
              <div className="mt-4">
                <p className="font-bold">Ekstra:</p>
                <p className="flex items-center">
                  {formData.isMusic ? <BiCheck className="mr-2 text-green-600" /> : <BiX className="mr-2 text-red-600" />}
                  Custom Musik
                </p>
                <p className="flex items-center">
                  {formData.isFont ? <BiCheck className="mr-2 text-green-600" /> : <BiX className="mr-2 text-red-600" />}
                  Custom Font
                </p>
                <p className="flex items-center">
                  <BiCheck className="mr-2 text-green-600" /> Thema
                </p>
                <p className="flex items-center">
                  <BiCheck className="mr-2 text-green-600" /> Revisi 5x
                </p>
              </div>
              <div className="mt-4">
                <p className="font-bold">Total:</p>
                <p>Rp. {formData.totalPayment.toLocaleString("id-ID")}</p>
              </div>
              <div className="mt-4">
                <p className="font-bold">Screenshot:</p>
                <Image
                  src={`${apiBase}/payment/${formData.file}`}
                  alt="Payment"
                  width={400}
                  height={400}
                  className="rounded-lg"
                  placeholder="blur"
                  blurDataURL={placeholder.src}
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Rekening</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label>Pilih Paket</Label>
                <div className="space-y-2">
                  <RadioGroup value={formData.paket} onValueChange={handleRadioChange} className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <RadioGroupItem value="antri" />
                      <span>Paket Antri (1-3 Hari) - Rp {price.toLocaleString("id-ID")}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <RadioGroupItem value="express" />
                      <span>Paket Express (3 Jam) - Rp {(price + 30000).toLocaleString("id-ID")}</span>
                    </label>
                  </RadioGroup>
                </div>
              </div>

              <div>
                <Label htmlFor="file">Upload Bukti TF</Label>
                <Input type="file" id="file" name="file" accept="image/*" onChange={handleChange} ref={fileInputRef} />
                {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
              </div>

              <div>
                <Label>Req dan Pembayaran:</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <Checkbox name="tema" disabled checked={formData.tema} />
                    <span>Thema = Rp {price.toLocaleString("id-ID")}</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      name="isMusic"
                      checked={formData.isMusic}
                      onCheckedChange={(checked) => {
                        if (!isMusicDisabled) {
                          setFormData({ ...formData, isMusic: checked });
                        }
                      }}
                      disabled={isMusicDisabled}
                    />
                    <span>Request Ganti Music = 5rb</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      name="isFont"
                      checked={formData.isFont}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFont: checked })}
                    />
                    <span>Custom Font/Thema = 20rb</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox name="revisi" disabled checked={formData.revisi} />
                    <span>Revisi 5x = 0</span>
                  </label>
                </div>
              </div>

              <div className="font-bold">Total: Rp. {displayTotal.toLocaleString("id-ID")} IDR</div>

              <div>
                <Label>Metode Pembayaran</Label>
                <ul className="text-sm space-y-3">
                  {bankAccounts.length > 0 ? (
                    bankAccounts.map((account, i) => {
                      const filename = extractFilename(account.fileImage);
                      const imageUrl = filename ? `${apiBase}/asset/${filename}` : null;
                      const isOpen = openIndex === i;

                      return (
                        <li key={account.id ?? `ba-${i}`} className="border rounded-lg overflow-hidden">
                          {/* header */}
                          <div
                            className="flex items-center justify-between px-3 py-2 bg-white cursor-pointer"
                            onClick={() => {
                              if (imageUrl) {
                                setOpenIndex(isOpen ? null : i);
                              }
                            }}
                            role={imageUrl ? "button" : undefined}
                            aria-expanded={imageUrl ? isOpen : undefined}
                          >
                            <div>
                              <div className="font-medium">{account.name}</div>
                              <div className="text-xs text-gray-600">{account.number}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              {imageUrl ? (
                                <div className="flex items-center gap-2">
                                  {/* <span className="text-xs text-gray-500 mr-2">QRIS</span> */}
                                  <button
                                    type="button"
                                    aria-label={isOpen ? "Tutup" : "Buka"}
                                    className={`p-2 rounded hover:bg-gray-100 transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenIndex(isOpen ? null : i);
                                    }}
                                  >
                                    <BiChevronDown className="w-5 h-5" />
                                  </button>
                                </div>
                              ) : (
                                <Button type="button" variant="ghost" size="sm" onClick={(e) => handleCopy(account.number, e)}>
                                  <BiCopy className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* panel (expanded) */}
                          {imageUrl && isOpen && (
                            <div className="bg-gray-50 p-3 relative">
                              {/* download button top-right */}
                              <div className="absolute top-2 right-2 z-20">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const suggested = `${account.number.replace(/\s+/g, "_")}_qris.png`;
                                    await handleDownloadImage(imageUrl, suggested);
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded shadow text-sm hover:bg-gray-100"
                                  title="Download QRIS"
                                >
                                  <BiDownload className="w-4 h-4" />
                                  Download
                                </button>
                              </div>

                              <div className="w-full flex flex-col items-center justify-center">
                                {/* show full image; use object-contain so entire QR stays visible */}
                                <img
                                  src={imageUrl}
                                  alt={`${account.name} qris`}
                                  className="max-w-full h-auto object-contain rounded-md border"
                                  style={{ maxHeight: "420px" }}
                                />
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-red-500">No bank accounts available</li>
                  )}
                </ul>
                <p className="text-sm mt-2">Atas nama {company?.ownerName || "Unknown"}</p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submit
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
