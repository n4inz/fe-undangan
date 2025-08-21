'use client';
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BiCheck, BiInfoSquare, BiX } from 'react-icons/bi';
import axios from 'axios';
import Image from 'next/image';

export default function DialogModalProofPayment({ formId, phoneNumber }) {
    const [formData, setFormData] = useState({
        name: '',
        paket: 'antri',
        file: null,
        tema: false,
        isMusic: false,
        isFont: false,
        revisi: false,
        total: 0,
        totalPayment: 0,
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // Track modal open state

    const fileInputRef = useRef(null);

    const checkPayment = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/payment/${formId}/${phoneNumber}`
            );
            if (response.data) {
                setFormData(response.data);
                setPaymentStatus(true);
            }
        } catch (error) {
            console.error('Error fetching payment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (open) => {
        setIsOpen(open);
        if (open) {
            await checkPayment(); // Fetch data only when modal opens
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button className="rounded-full">
                    <BiInfoSquare className="mr-2 h-4 w-4 text-slate-600" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full p-4 h-[100dvh] flex flex-col">
                <DialogTitle>
                    <h2 className="text-xl font-bold">Pembayaran ID: {formId}</h2>
                </DialogTitle>
                <ScrollArea className="flex-1 p-2">
                    {isLoading ? (
                        <p>Loading payment data...</p>
                    ) : (
                        <>
                            <div className="mt-4">
                                <p className="font-bold">Nama Rekening:</p>
                                <p>{formData.name}</p>
                            </div>
                            {/* Rest of your content here */}
                            <div className="mt-4">
                                <p className="font-bold">Screenshot:</p>
                                {formData.file ? (
                                    <Image
                                        src={`${process.env.NEXT_PUBLIC_API_URL}/payment/${formData.file}`}
                                        alt="Payment"
                                        width={400}
                                        height={400}
                                        className="rounded-lg"
                                    />
                                ) : (
                                    <p>No screenshot available</p>
                                )}
                            </div>
                        </>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}