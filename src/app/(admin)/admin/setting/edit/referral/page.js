"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminReferralSettings() {
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [percentage, setPercentage] = useState("");

    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cek-role`, {
                    withCredentials: true,
                });

                if (res.data.isAdmin !== 1) {
                    toast({
                        variant: "destructive",
                        title: "Access Denied",
                        description: "You must be an admin to access this page.",
                    });
                    router.push("/forms");
                } else {
                    fetchPercentage();
                }
            } catch (error) {
                console.error("Error verifying admin status:", error);
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Unable to verify your role. Please login again.",
                });
                router.push("/login");
            }
        };

        if (session?.user?.sessionToken) {
            verifyAdmin();
        }
    }, [session, router]);

    const fetchPercentage = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/referral/percentage`, {
                withCredentials: true,
            });
            setPercentage(res.data.referralPercentage);
        } catch (error) {
            console.error("Error fetching percentage:", error);
            toast({
                variant: "destructive",
                title: "Gagal memuat data",
                description: error.response?.data?.error || "Terjadi kesalahan.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Validate input
        const val = parseInt(percentage);
        if (isNaN(val) || val < 0 || val > 100) {
            toast({
                variant: "destructive",
                title: "Invalid Input",
                description: "Percentage must be a number between 0 and 100.",
            });
            setSaving(false);
            return;
        }

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/referral/percentage`,
                { percentage: val },
                { withCredentials: true }
            );

            toast({
                title: "Berhasil disimpan",
                description: "Persentase referral telah diperbarui.",
            });

            // Redirect to settings page
            setTimeout(() => {
                router.push("/admin/setting");
            }, 1000);
        } catch (error) {
            console.error("Error updating percentage:", error);
            toast({
                variant: "destructive",
                title: "Gagal menyimpan",
                description: error.response?.data?.error || "Terjadi kesalahan.",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex min-h-screen pt-10">
            {/* Sidebar Offset (Mirroring other admin pages) */}
            <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden" />

            {/* Main Content */}
            <div className="flex flex-col flex-grow w-full md:pl-24">
                <div className="container max-w-2xl mx-auto py-8 px-4">
                    <div className="mb-6">
                        <Button variant="ghost" asChild className="pl-0 hover:pl-2 transition-all">
                            <Link href="/admin/setting">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali ke Pengaturan
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan Referral</CardTitle>
                            <CardDescription>
                                Atur persentase komisi global untuk sistem referral.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="percentage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Persentase Komisi (%)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="percentage"
                                            type="number"
                                            min="0"
                                            max="100"
                                            placeholder="Contoh: 10"
                                            value={percentage}
                                            onChange={(e) => setPercentage(e.target.value)}
                                            className="max-w-[200px]"
                                        />
                                        <span className="text-muted-foreground">%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Persentase ini akan diterapkan pada semua komisi baru yang terbentuk saat form selesai (status = Done).
                                    </p>
                                </div>

                                <Button type="submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
