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
import placeholder from "/public/images/placeholder.webp";
import { getBankAccounts, getCompanyProfile } from "@/lib/company";

export default function PaymentModal({ formId, phoneNumber, buttonClassName }) {
  // Main form state
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

  // accordion open index for bank accounts
  const [openIndex, setOpenIndex] = useState(null);

  // file input ref
  const fileInputRef = useRef(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // ================== IMAGE PREVIEW (thumbnail + fullscreen) ==================
  // previewUrl: either object URL (created from file) or remote URL (api)
  const [previewUrl, setPreviewUrl] = useState(null);
  // boolean to open preview dialog
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // track if the current previewUrl was created as object URL (so we can revoke)
  const previewObjectUrlRef = useRef(null);

  // helper to safely set preview from a File (object URL)
  const setPreviewFromFile = (file) => {
    // revoke previous object URL if exists
    if (previewObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      } catch (e) {
        // ignore
      }
      previewObjectUrlRef.current = null;
    }

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objUrl;
    setPreviewUrl(objUrl);
  };

  // helper to set preview to a remote URL (e.g., apiBase/...); revoke previous object url
  const setPreviewFromRemote = (url) => {
    if (previewObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      } catch (e) {
        // ignore
      }
      previewObjectUrlRef.current = null;
    }
    setPreviewUrl(url || null);
  };

  // cleanup on unmount: revoke object url if any
  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(previewObjectUrlRef.current);
        } catch (e) {
          // ignore
        }
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  // ================== FETCH DATA ON MOUNT ==================
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

  // ================== CALCULATE TOTAL ==================
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

  // ================== HANDLE INPUT CHANGES ==================
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files && files[0];
      const allowedTypes = ["image/jpg", "image/jpeg", "image/png", "image/gif"];

      if (file && !allowedTypes.includes(file.type)) {
        toast({
          title: "Image only",
          description: "Only jpeg, jpg, png, gif is accepted.",
          variant: "destructive",
        });
        setFormData((prev) => ({ ...prev, file: null }));
        setPreviewFromFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setFormData((prev) => ({ ...prev, file }));
      setPreviewFromFile(file || null);
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

  // ================== SUBMIT PAYMENT ==================
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

      // reset form
      setFormData({
        name: "",
        paket: "antri",
        file: null,
        tema: true,
        isMusic: false,
        isFont: false,
        revisi: true,
      });

      // cleanup preview object url if any
      if (previewObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(previewObjectUrlRef.current);
        } catch (e) {
          // ignore
        }
        previewObjectUrlRef.current = null;
      }
      setPreviewUrl(null);

      if (fileInputRef.current) fileInputRef.current.value = "";

      // check payment after upload
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

  // ================== HELPERS ==================
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

        // set preview to the saved file so user can fullscreen it
        if (response.data.file) {
          const remoteUrl = `${apiBase}/payment/${response.data.file}`;
          setPreviewFromRemote(remoteUrl);
        }
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

  // helper to get filename from stored path or return raw value if it's already filename
  const extractFilename = (filePath) => {
    if (!filePath) return null;
    const m = String(filePath).match(/\/uploads\/asset\/(.+)$/);
    if (m && m[1]) return m[1];
    return String(filePath);
  };

  // show preview modal for a given URL (remote or object)
  const openPreview = (url) => {
    if (!url) return;
    // if url is a remote path but not full, normalize
    setPreviewUrl(url);
    // if it's a remote url we ensure previewObjectUrlRef is cleared
    if (previewObjectUrlRef.current && previewObjectUrlRef.current !== url) {
      try {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      } catch (e) {
        // ignore
      }
      previewObjectUrlRef.current = null;
    }
    setIsPreviewOpen(true);
  };

  const displayTotal = calculateTotal(formData, price);

  useEffect(() => {
    if (formId && phoneNumber) checkPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, phoneNumber]);

  // ================== RENDER ==================
  return (
    <>
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
                  <p>Rp. {Number(formData.totalPayment || 0).toLocaleString("id-ID")}</p>
                </div>
                <div className="mt-4">
                  <p className="font-bold">Screenshot:</p>

                  {/* Use a normal img to allow click handler (Next Image may require remote domains config) */}
                  {formData.file ? (
                    <img
                      src={`${apiBase}/payment/${formData.file}`}
                      alt="Payment"
                      className="rounded-lg cursor-pointer max-w-full h-auto object-contain"
                      onClick={() => {
                        openPreview(`${apiBase}/payment/${formData.file}`);
                      }}
                    />
                  ) : (
                    <p className="text-sm text-gray-500">No image available</p>
                  )}
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

                  {/* Thumbnail preview for uploaded file */}
                  {previewUrl && (
                    <div className="mt-3">
                      <p className="text-sm mb-1">Preview:</p>
                      <div className="flex items-start gap-3">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-28 h-28 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => {
                            // previewUrl may be object or remote
                            openPreview(previewUrl);
                          }}
                        />
                        <div className="flex flex-col gap-2">

                          <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded shadow text-sm hover:bg-gray-100"
                            onClick={() => {
                              // clear preview & file
                              setFormData((p) => ({ ...p, file: null }));
                              if (fileInputRef.current) fileInputRef.current.value = "";
                              if (previewObjectUrlRef.current) {
                                try {
                                  URL.revokeObjectURL(previewObjectUrlRef.current);
                                } catch (e) {}
                                previewObjectUrlRef.current = null;
                              }
                              setPreviewUrl(null);
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
                                    className="max-w-full h-auto object-contain rounded-md border cursor-pointer"
                                    style={{ maxHeight: "420px" }}
                                    onClick={() => {
                                      // open fullscreen preview for bank QR too
                                      openPreview(imageUrl);
                                    }}
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

      {/* ================== FULLSCREEN PREVIEW DIALOG ================== */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-black/90">
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Close button top-right */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-3 right-3 z-30 inline-flex items-center justify-center p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              aria-label="Close preview"
            >
              ✕
            </button>

            {/* Download button top-right (below close) */}
            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  const suggested = `${(formData.name || "preview").replace(/\s+/g, "_")}.png`;
                  handleDownloadImage(previewUrl, suggested);
                }}
                className="absolute top-3 right-12 z-30 inline-flex items-center gap-2 px-3 py-1 bg-white/90 text-black rounded"
                aria-label="Download preview"
              >
                <BiDownload className="w-4 h-4" />
                Download
              </button>
            )}

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Fullscreen Preview"
                className="max-w-full max-h-[90vh] object-contain rounded"
              />
            ) : (
              <p className="text-white">No preview available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
