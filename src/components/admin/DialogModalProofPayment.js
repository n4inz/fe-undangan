'use client';
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BiCheck, BiInfoSquare, BiX } from 'react-icons/bi';
import { toast } from '@/components/ui/use-toast';
import { z } from 'zod';
import { paymentSchema } from '@/lib/validation';
import { Loader2 } from 'lucide-react';
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

    const fileInputRef = useRef(null);

    const checkPayment = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/payment/${formId}/${phoneNumber}`
            );
            if (response.data) {
                setFormData(response.data);
                setPaymentStatus(true);
            }
        } catch (error) {
            console.error('Error fetching payment:', error);
        }
    };

    useEffect(() => {
        checkPayment();
    }, [formId, phoneNumber]); // Only depend on formId and phoneNumber

    return (
        <Dialog>
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
                            {formData.isMusic ? (
                                <BiCheck className="mr-2 text-green-600" />
                            ) : (
                                <BiX className="mr-2 text-red-600" />
                            )}{' '}
                            Custom Musik
                        </p>
                        <p className="flex items-center">
                            {formData.isFont ? (
                                <BiCheck className="mr-2 text-green-600" />
                            ) : (
                                <BiX className="mr-2 text-red-600" />
                            )}{' '}
                            Custom Font
                        </p>
                        <p className="flex items-center">
                            {formData.tema ? (
                                <BiCheck className="mr-2 text-green-600" />
                            ) : (
                                <BiX className="mr-2 text-red-600" />
                            )}{' '}
                            Thema
                        </p>
                        <p className="flex items-center">
                            {formData.revisi ? (
                                <BiCheck className="mr-2 text-green-600" />
                            ) : (
                                <BiX className="mr-2 text-red-600" />
                            )}{' '}
                            Revisi 5x
                        </p>
                    </div>
                    <div className="mt-4">
                        <p className="font-bold">Total:</p>
                        <p>Rp. {formData.totalPayment.toLocaleString('id-ID')}</p>
                    </div>
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
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}