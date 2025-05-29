"use client";
import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaTrash } from "react-icons/fa";
import { ro } from "date-fns/locale";
import { useRouter } from "next/navigation";

export default function BankAccountForm() {
    const router = useRouter();
    const [accounts, setAccounts] = useState([{ name: "", number: "" }]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBankAccounts = async () => {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/bank-accounts`,
                    { withCredentials: true }
                );

                if (response.data.data && response.data.data.length > 0) {
                    const formattedAccounts = response.data.data.map(account => ({
                        name: account.name,
                        number: account.number || account.noRekening,
                        id: account.id,
                    }));
                    setAccounts(formattedAccounts);
                } else {
                    setAccounts([{ name: "", number: "" }]);
                }
            } catch (error) {
                console.error("Failed to fetch bank accounts:", error);
                setAccounts([{ name: "", number: "" }]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBankAccounts();
    }, []);

    const handleChange = (index, field, value) => {
        const updated = accounts.map((acc, i) =>
            i === index ? { ...acc, [field]: value } : acc
        );
        setAccounts(updated);
    };

    const addAccount = () => {
        setAccounts([...accounts, { name: "", number: "" }]);
    };

    const removeAccount = async (index) => {
        const accountToRemove = accounts[index];

        if (accountToRemove.id) {
            try {
                await axios.delete(
                    `${process.env.NEXT_PUBLIC_API_URL}/bank-accounts/${accountToRemove.id}`,
                    { withCredentials: true }
                );
            } catch (error) {
                console.error("Failed to delete bank account:", error);
                alert('Failed to delete bank account');
                return;
            }
        }

        setAccounts(accounts.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Only send accounts without an ID (new accounts)
            const newAccounts = accounts.filter(acc => !acc.id);

            if (newAccounts.length === 0) {
                router.push("/admin/setting");
                return;
            }

            // Send each new account individually
            const createPromises = newAccounts.map(account =>
                axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/bank-accounts`,
                    { name: account.name, number: account.number },
                    { withCredentials: true }
                )
            );

            await Promise.all(createPromises);

            // alert('New bank accounts saved successfully!');
            router.push("/admin/setting");

            // Refresh the data after successful save
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/bank-accounts`,
                { withCredentials: true }
            );

            if (response.data.data && response.data.data.length > 0) {
                const formattedAccounts = response.data.data.map(account => ({
                    name: account.name,
                    number: account.number || account.noRekening,
                    id: account.id,
                }));
                setAccounts(formattedAccounts);
            } else {
                setAccounts([{ name: "", number: "" }]);
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to save bank accounts');
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mb-4 relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
            {accounts.map((account, idx) => (
                <div key={account.id || `new-${idx}`} className="flex items-end gap-4">
                    <div>
                        <Label htmlFor={`name-${idx}`}>Nama Rekening</Label>
                        <Input
                            id={`name-${idx}`}
                            value={account.name}
                            onChange={e => handleChange(idx, "name", e.target.value)}
                            placeholder="Nama Rekening"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor={`number-${idx}`}>Nomor Rekening</Label>
                        <Input
                            id={`number-${idx}`}
                            value={account.number}
                            onChange={e => handleChange(idx, "number", e.target.value)}
                            placeholder="Nomor Rekening"
                            required
                        />
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeAccount(idx)}
                        className="mb-2 flex items-center justify-center"
                        style={{ height: "40px", width: "40px" }}
                    >
                        <FaTrash />
                    </Button>
                </div>
            ))}
            <Button type="button" onClick={addAccount} disabled={isLoading}>
                Tambah Rekening
            </Button>
            <Button type="submit" className="ml-4" disabled={isLoading}>
                Simpan
            </Button>
        </form>
    );
}