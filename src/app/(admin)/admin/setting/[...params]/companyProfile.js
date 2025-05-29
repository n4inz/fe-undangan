"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CompanyProfileForm() {
    const Router = useRouter();
    const [form, setForm] = useState({
        companyName: "",
        logo: null,
        landingPageUrl: "",
        ownerName: "",
        phone: "",
        address: "",
        existingLogo: null, // Store the existing logo URL
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCompanyProfile = async () => {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/company-profile`,
                    { withCredentials: true }
                );

                if (response.data.data) {
                    setForm({
                        companyName: response.data.data.name || "",
                        logo: null,
                        landingPageUrl: response.data.data.url || "",
                        ownerName: response.data.data.ownerName || "",
                        phone: response.data.data.phone || "",
                        address: response.data.data.address || "",
                        existingLogo: response.data.data.logo || null,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch company profile:", error);
                setError("Failed to load company profile. You can still create a new one.");
            } finally {
                setIsFetching(false);
            }
        };

        fetchCompanyProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("name", form.companyName);
            formData.append("url", form.landingPageUrl);
            formData.append("ownerName", form.ownerName);
            formData.append("phone", form.phone);
            formData.append("address", form.address);
            // Only append logo if a new file is selected
            if (form.logo) {
                formData.append("logo", form.logo);
            }

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/company-profile`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            Router.push("/admin/setting");
            // Update form with the returned data
            setForm({
                companyName: response.data.data.name,
                logo: null, // Reset file input
                landingPageUrl: response.data.data.url,
                ownerName: response.data.data.ownerName,
                phone: response.data.data.phone || "",
                address: response.data.data.address || "",
                existingLogo: response.data.data.logo || null,
            });
        } catch (error) {
            console.error("Failed to save company profile:", error);
            setError(error.response?.data?.error || "Failed to save company profile");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div>Loading company profile...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-500">{error}</div>}
            <div>
                <Label htmlFor="companyName">Nama Perusahaan</Label>
                <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={form.companyName}
                    onChange={handleChange}
                    required
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor="logo">Logo (Image)</Label>
                {form.existingLogo && (
                    <div className="mt-2 mb-2">
                        <img
                            src={`${process.env.NEXT_PUBLIC_API_URL}/asset/${form.existingLogo}`}
                            alt="Current Logo"
                            className="w-32 h-32 object-contain"
                        />
                    </div>
                )}
                <Input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor="landingPageUrl">URL Landing Page</Label>
                <Input
                    id="landingPageUrl"
                    name="landingPageUrl"
                    type="text"
                    value={form.landingPageUrl}
                    onChange={handleChange}
                    required
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor="ownerName">Nama Owner</Label>
                <Input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    value={form.ownerName}
                    onChange={handleChange}
                    required
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                    id="phone"
                    name="phone"
                    type="text"
                    value={form.phone}
                    onChange={handleChange}
                    className="mt-2"
                />
            </div>
            <div>
                <Label htmlFor="address">Alamat</Label>
                <Input
                    id="address"
                    name="address"
                    type="text"
                    value={form.address}
                    onChange={handleChange}
                    className="mt-2"
                />
            </div>
            <Button
                type="submit"
                className="bg-blue-500 text-white px-4 py-1 rounded-lg"
                disabled={isLoading}
            >
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
    );
}