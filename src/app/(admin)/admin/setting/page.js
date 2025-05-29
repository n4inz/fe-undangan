"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const [companyInfo, setCompanyInfo] = useState({
        logo: null,
        name: "",
        url: "",
        phone: "",
        address: "",
        ownerName: "",
    });
    const [bankAccounts, setBankAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch company profile
                const companyResponse = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/company-profile`,
                    { withCredentials: true }
                );

                if (companyResponse.data.data) {
                    setCompanyInfo({
                        logo: companyResponse.data.data.logo || null,
                        name: companyResponse.data.data.name || "",
                        url: companyResponse.data.data.url || "",
                        phone: companyResponse.data.data.phone || "",
                        address: companyResponse.data.data.address || "",
                        ownerName: companyResponse.data.data.ownerName || "",
                    });
                }

                // Fetch bank accounts
                const bankResponse = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/bank-accounts`,
                    { withCredentials: true }
                );

                if (bankResponse.data.data) {
                    const formattedAccounts = bankResponse.data.data.map(account => ({
                        name: account.name,
                        number: account.number || account.noRekening,
                        id: account.id,
                    }));
                    setBankAccounts(formattedAccounts);
                } else {
                    setBankAccounts([]);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setError("Failed to load company profile or bank accounts. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <>
            <div className="h-10 fixed bg-white border-b w-full"></div>
            <div className="flex min-h-screen pt-10">
                {/* Sidebar Placeholder */}
                <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden"></div>

                <div className="flex flex-col flex-grow w-full md:pl-24">
                    <div className="p-4">
                        <div className="py-4 font-semibold">Setting</div>

                        {/* Separator 1: Company Info */}
                        <Card className="mb-6">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-medium">
                                    Informasi Perusahaan
                                </CardTitle>
                                <Link href="/admin/setting/edit/company">
                                    <Button variant="ghost" size="sm">
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div>Loading company profile...</div>
                                ) : error ? (
                                    <div className="text-red-500">{error}</div>
                                ) : (
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 rounded-md bg-gray-200 flex items-center justify-center">
                                            {companyInfo.logo ? (
                                                <img
                                                    src={`${process.env.NEXT_PUBLIC_API_URL}/asset/${companyInfo.logo}`}
                                                    alt="Company Logo"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-gray-500">Logo</span>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{companyInfo.name || "No name provided"}</p>
                                            <p className="text-sm text-muted-foreground">{companyInfo.url || "No URL provided"}</p>
                                            <p className="text-sm text-muted-foreground">{companyInfo.ownerName || "No owner name provided"}</p>
                                            {companyInfo.phone && <p className="text-sm text-muted-foreground">Phone: {companyInfo.phone}</p>}
                                            {companyInfo.address && <p className="text-sm text-muted-foreground">Address: {companyInfo.address}</p>}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Separator 2: Bank Accounts */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-medium">
                                    Rekening Bank
                                </CardTitle>
                                <Link href="/admin/setting/edit/bank-accounts">
                                    <Button variant="ghost" size="sm">
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div>Loading bank accounts...</div>
                                ) : error ? (
                                    <div className="text-red-500">{error}</div>
                                ) : bankAccounts.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">
                                        No bank accounts available.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {bankAccounts.map((account) => (
                                            <div
                                                key={account.id}
                                                className="flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">{account.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {account.number}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}