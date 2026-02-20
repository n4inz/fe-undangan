"use client";

import { useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function WithdrawalModal({ isOpen, onClose, balance, onRefresh, sessionToken }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        method: "BANK",
        bankName: "",
        accountNumber: "",
        accountName: ""
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.accountNumber || !formData.accountName || (formData.method === "BANK" && !formData.bankName)) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Harap isi semua field yang wajib.",
            });
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/referral/withdrawal/request`,
                formData,
                { headers: { Authorization: `Bearer ${sessionToken}` } }
            );

            toast({
                title: "Berhasil",
                description: "Permintaan penarikan Anda telah dikirim.",
            });

            onRefresh();
            onClose();
        } catch (error) {
            console.error("Error requesting withdrawal:", error);
            toast({
                variant: "destructive",
                title: "Gagal",
                description: error.response?.data?.message || "Terjadi kesalahan pada server.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tarik Komisi</DialogTitle>
                    <DialogDescription>
                        Seluruh saldo Anda sebesar <span className="font-bold">{formatCurrency(balance)}</span> akan ditarik.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="method">Metode Penarikan</Label>
                            <Select
                                value={formData.method}
                                onValueChange={(v) => setFormData({ ...formData, method: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih metode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK">Transfer Bank</SelectItem>
                                    <SelectItem value="EWALLET">E-Wallet (Dana/OVO/GoPay)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.method === "BANK" && (
                            <div className="grid gap-2">
                                <Label htmlFor="bankName">Nama Bank</Label>
                                <Input
                                    id="bankName"
                                    placeholder="Contoh: BCA, Mandiri, BNI"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    required={formData.method === "BANK"}
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="accountNumber">
                                {formData.method === "BANK" ? "Nomor Rekening" : "Nomor HP E-Wallet"}
                            </Label>
                            <Input
                                id="accountNumber"
                                placeholder={formData.method === "BANK" ? "Masukkan nomor rekening" : "Masukkan nomor HP"}
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="accountName">Atas Nama (Pemilik Rekening/Akun)</Label>
                            <Input
                                id="accountName"
                                placeholder="Masukkan nama lengkap"
                                value={formData.accountName}
                                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Penarikan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
