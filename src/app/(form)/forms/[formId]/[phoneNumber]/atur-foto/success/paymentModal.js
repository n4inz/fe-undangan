'use client';
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BiCheck, BiCopy, BiMoney, BiX } from 'react-icons/bi';
import { toast } from '@/components/ui/use-toast';
import { z } from 'zod';
import { paymentSchema } from '@/lib/validation';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import Image from 'next/image';
import placeholder from '/public/images/placeholder.png';

export default function PaymentModal({ formId, phoneNumber, buttonClassName, company, bankAccounts }) {
    const [formData, setFormData] = useState({
        name: '',
        paket: 'antri',
        file: null,
        tema: false,
        isMusic: false,
        isFont: false,
        revisi: false,
        totalPayment: 0,
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(false);

    const fileInputRef = useRef(null);

    console.log('PaymentModal props:', { formId, phoneNumber, company, bankAccounts });

    const safeBankAccounts = Array.isArray(bankAccounts) ? bankAccounts : [];

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            const file = files[0];
            const allowedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];

            if (file && !allowedTypes.includes(file.type)) {
                toast({
                    title: 'Image only',
                    description: 'Only jpeg, jpg, png, gif is accepted.',
                    variant: 'destructive',
                });
                setFormData((prev) => ({ ...prev, file: null }));
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            setFormData((prev) => ({ ...prev, file }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    };

    const handleRadioChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            paket: value,
        }));
    };

    const calculateTotal = () => {
        let total = 0;
        if (formData.paket === 'express') total += 55000;
        if (formData.paket === 'antri') total += 25000;
        if (formData.tema) total += 0;
        if (formData.isMusic) total += 5000;
        if (formData.isFont) total += 20000;
        setFormData((prev) => ({ ...prev, totalPayment: total }));
        return total;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!formId || !phoneNumber) {
            toast({
                title: 'Error',
                description: 'Invalid form ID or phone number. Please ensure all required fields are provided.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }

        try {
            const total = calculateTotal();
            const updatedFormData = { ...formData, totalPayment: total };
            console.log('Submitting formData:', updatedFormData);

            paymentSchema.parse(updatedFormData);
            setErrors({});
            console.log('Validation passed');

            const formDataToSend = new FormData();
            const jsonData = {
                name: updatedFormData.name,
                paket: updatedFormData.paket,
                isMusic: updatedFormData.isMusic,
                isFont: updatedFormData.isFont,
                totalPayment: updatedFormData.totalPayment,
            };
            formDataToSend.append('data', JSON.stringify(jsonData));

            if (updatedFormData.file) {
                console.log('File selected:', updatedFormData.file.name, updatedFormData.file.type);
                formDataToSend.append('payment', updatedFormData.file);
            } else {
                console.log('No file selected');
            }

            console.log('API request details:', { formId, phoneNumber });
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/upload-payment/${formId}/${phoneNumber}`,
                formDataToSend,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            console.log('API response:', response);

            if (response.status !== 200) {
                throw new Error(response.data?.error || 'Payment submission failed');
            }
            toast({
                title: 'Payment submitted successfully!',
                description: 'Your payment has been received and is being processed.',
            });

            setFormData({
                name: '',
                paket: 'antri',
                file: null,
                tema: true,
                isMusic: false,
                isFont: false,
                revisi: false,
                totalPayment: 0,
            });

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            await checkPayment();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors = {};
                error.errors.forEach(err => {
                    fieldErrors[err.path[0]] = err.message;
                });
                console.log('Zod validation errors:', fieldErrors);
                setErrors(fieldErrors);
                toast({
                    title: 'Validation Error',
                    description: 'Please check the form for errors.',
                    variant: 'destructive',
                });
                const firstErrorField = document.querySelector(`[name="${error.errors[0].path[0]}"]`);
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                console.error('Submission error:', error);
                toast({
                    title: 'Submission Error',
                    description: error.message || 'Failed to submit payment. Please try again.',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsLoading(false);
            console.log('isLoading reset to false');
        }
    };

    const handleCopy = (text, event) => {
        event.preventDefault();
        navigator.clipboard.writeText(text)
            .then(() => {
                toast({ title: 'Berhasil menyalin rekening.' });
            })
            .catch(() => {
                toast({ title: 'Gagal menyalin rekening.', variant: 'destructive' });
            });
    };

    const checkPayment = async () => {
        if (!formId || !phoneNumber) {
            toast({
                title: 'Error',
                description: 'Invalid form ID or phone number.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/payment/${formId}/${phoneNumber}`);
            console.log('checkPayment response:', response.data);
            if (response.data != null) {
                setFormData({
                    ...response.data,
                    totalPayment: response.data.totalPayment || 0,
                });
                setPaymentStatus(true);
            }
        } catch (error) {
            console.error('Error checking payment:', error);
            toast({
                title: 'Error',
                description: 'Failed to check payment status.',
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        if (formId && phoneNumber) {
            checkPayment();
        }
    }, [formId, phoneNumber]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className={`bg-green-700 hover:bg-green-900 text-white font-bold py-4 px-4 rounded-full flex items-center text-sm w-full justify-center ${buttonClassName}`}>
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
                                <p className="flex items-center">{formData.isMusic ? (<BiCheck className="mr-2 text-green-600" />) : (<BiX className="mr-2 text-red-600" />)} Custom Musik</p>
                                <p className='flex items-center'>{formData.isFont ? (<BiCheck className="mr-2 text-green-600" />) : (<BiX className="mr-2 text-red-600" />)} Custom Font</p>
                                <p className='flex items-center'><BiCheck className="mr-2 text-green-600" /> Thema</p>
                                <p className='flex items-center'><BiCheck className="mr-2 text-green-600" /> Revisi 5x</p>
                            </div>
                            <div className="mt-4">
                                <p className="font-bold">Total:</p>
                                <p>Rp. {formData.totalPayment.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="mt-4">
                                <p className='font-bold'>Screenshot:</p>
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_API_URL}/payment/${formData.file}`}
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
                                            <span>Paket Antri (1-3 Hari) - 25rb</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <RadioGroupItem value="express" />
                                            <span>Paket Express (3 Jam) - 55rb</span>
                                        </label>
                                    </RadioGroup>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="file">Upload Bukti TF</Label>
                                <Input
                                    type="file"
                                    id="file"
                                    name="file"
                                    accept="image/*"
                                    onChange={handleChange}
                                    ref={fileInputRef}
                                />
                                {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
                            </div>
                            <div>
                                <Label>Req dan Pembayaran:</Label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                        <Checkbox name="tema" disabled checked />
                                        <span>Thema = 25rb</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <Checkbox name="isMusic" checked={formData.isMusic} onCheckedChange={(checked) => setFormData({ ...formData, isMusic: checked })} />
                                        <span>Request Ganti Music = 5rb</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <Checkbox name="isFont" checked={formData.isFont} onCheckedChange={(checked) => setFormData({ ...formData, isFont: checked })} />
                                        <span>Custom Font/Thema = 20rb</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <Checkbox name="revisi" disabled checked />
                                        <span>Revisi 5x = 0</span>
                                    </label>
                                </div>
                            </div>
                            <div className="font-bold">Total: {formData.totalPayment.toLocaleString('id-ID')} IDR</div>
                            <div>
                                <Label>Metode Pembayaran</Label>
                                <ul className="text-sm">
                                    {safeBankAccounts.length > 0 ? (
                                        safeBankAccounts.map((account) => (
                                            <li key={account.id} className="flex items-center justify-between">
                                                {account.name}: {account.number}
                                                <Button type="button" variant="ghost" size="sm" onClick={(e) => handleCopy(account.number, e)}>
                                                    <BiCopy className="w-4 h-4" />
                                                </Button>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-red-500">No bank accounts available</li>
                                    )}
                                </ul>
                                <p className="text-sm mt-2">
                                    Atas nama {company?.ownerName || 'Unknown'}
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submit
                                    </>
                                ) : (
                                    'Submit'
                                )}
                            </Button>
                        </form>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}