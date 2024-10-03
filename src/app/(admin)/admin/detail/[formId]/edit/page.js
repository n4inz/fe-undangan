"use client"
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { z } from 'zod';
// import LoadingSpinner from '../components/LoadingSpinner'; // Adjust the path as needed
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { ClipLoader } from 'react-spinners'; // Import the spinner
import { useRouter } from 'next/navigation';
// import { XMarkIcon } from '@heroicons/react/24/solid';
import { BiLeftArrow, BiLeftArrowAlt, BiX } from "react-icons/bi";
import { mainSchema } from '@/lib/validation'
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { getTema } from '@/lib/tema';
import { SelectValue } from '@radix-ui/react-select';
import { DropdownMenuItem } from '@radix-ui/react-dropdown-menu';
import { toast } from '@/components/ui/use-toast';

const formatDateTime = (datetime) => {
    if (!datetime) return '';
    const date = new Date(datetime);
    const pad = (num) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const EditDetail = ({ params }) => {

    const router = useRouter();

    // Set initial state for formData
    const [formData, setFormData] = useState({
    });

    const [errors, setErrors] = useState({});

    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);

    const [options, setOptions] = useState([]); // Store options for the Select component

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validate the form data using your schema
            console.log(formData);
            mainSchema.parse(formData);
            setErrors({}); // Reset errors if validation passes

            // Send the form data as JSON
            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/forms/${params.formId}`, formData, {
                withCredentials: true, // Add withCredentials to send cookies
            });

            console.log('Form updated successfully:', response);
            router.push(`/admin/detail/${response.data.id}?success=true`);
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Capture validation errors
                const fieldErrors = {};
                error.errors.forEach(err => {
                    fieldErrors[err.path[0]] = err.message;
                });
                setErrors(fieldErrors);

                // Scroll to the first error field
                const firstErrorField = document.querySelector(`[name="${error.errors[0].path[0]}"]`);
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                console.log(fieldErrors);
            } else {
                // Handle any other unexpected errors
                console.error('An unexpected error occurred:', error);
            }
        } finally {
            setIsLoading(false); // Ensure this runs in both success and error cases
        }
    };


    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/forms/${params.formId}`, {
                withCredentials: true
            });
            const fetchedFormData = response.data.form;

            // Initialize new formData based on fetched data
            let updatedFormData = { ...fetchedFormData };

            // Update opsiAkad if it's not 'Pria' or 'Wanita'
            if (fetchedFormData.opsiAkad !== 'Pria' && fetchedFormData.opsiAkad !== 'Wanita') {
                updatedFormData = {
                    ...updatedFormData,
                    opsiAkad: "Lainnya",
                    LainnyaInputAkad: fetchedFormData.opsiAkad
                };
            }

            // Update opsiResepsi if it's not 'Pria' or 'Wanita'
            if (fetchedFormData.opsiResepsi !== 'Pria' && fetchedFormData.opsiResepsi !== 'Wanita') {
                updatedFormData = {
                    ...updatedFormData,
                    opsiResepsi: "Lainnya",
                    LainnyaInputResepsi: fetchedFormData.opsiResepsi
                };
            }

            // Update pilihanTema if it's not 'Admin'
            if (fetchedFormData.pilihanTema !== 'Admin') {
                updatedFormData = {
                    ...updatedFormData,
                    pilihanTema: "Lainnya",
                    LainnyaPilihanTema: fetchedFormData.pilihanTema
                };
            }

            // Set the updated form data in a single setFormData call
            setFormData(updatedFormData);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false); // Ensure loading is stopped
        }
    };


    const fetchOptions = async () => {
        try {
            const data = await getTema();
            setOptions(data || []); // Ensure data is an array
        } catch (error) {
            console.error('Error fetching tema options:', error);
            setOptions([]); // Ensure options is an array in case of error
        } finally {
            setIsLoadingOptions(false); // Stop loading state for options
        }
    };

    useEffect(() => {
        fetchOptions();
        fetchData();
    }, []);

    return (
        <>
            <div className="h-10 bg-white border-b w-full"></div>
            <div className="flex min-h-screen mx-4">
                {/* Sidebar */}
                <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden">
                    {/* <Sidebar /> */}
                </div>

                {/* Main Content */}
                <div className="flex flex-col flex-grow w-full md:pl-24">
                    <div className="flex">
                        <Button
                            onClick={() => {
                                router.push(`/admin/detail/${params.formId}`);
                            }}
                            className="text-center cursor-pointer bg-white" // Add bg-white class
                        >
                            <BiLeftArrowAlt className='w-4 h-4 text-black' />
                        </Button>
                        <div className="p-2">
                            EDIT Detail : ID {params.formId}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700">Nomor Whatsapp Customer<span className='text-red-500'>*</span></label>
                            <Input
                                type="text"
                                name="nomorWa"
                                value={formData.nomorWa}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                                inputMode="numeric"
                            />
                            {errors.nomorWa && <p className="text-red-500 text-sm mt-1">{errors.nomorWa}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Nama Customer <span className='text-red-500'>*</span></label>
                            <Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>
                        {/* Mempelai Pria */}
                        <div className="mb-4">
                            <label className="block text-gray-700">Nama Lengkap Mempelai Pria
                                <span className='text-red-500'>*</span></label>
                            <Input
                                type="text"
                                name="namaLengkapPria"
                                value={formData.namaLengkapPria}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.namaLengkapPria && <p className="text-red-500 text-sm mt-1">{errors.namaLengkapPria}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Nama Panggilan Mempelai Pria
                                <span className='text-red-500'>*</span></label>
                            <Input
                                type="text"
                                name="namaPanggilanPria"
                                value={formData.namaPanggilanPria}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.namaPanggilanPria && <p className="text-red-500 text-sm mt-1">{errors.namaPanggilanPria}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Nama Orang Tua Mempelai Pria<span className='text-red-500'>*</span>
                                <br></br>Ex: Bapak Rozan Dan Ibu Marlina
                            </label>
                            <Input
                                type="text"
                                name="namaOrtuPria"
                                value={formData.namaOrtuPria}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.namaOrtuPria && <p className="text-red-500 text-sm mt-1">{errors.namaOrtuPria}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Tempat Lahir Mempelai Pria
                                <span className='text-red-500'>*</span></label>
                            <Input
                                type="text"
                                name="tempatLahirPria"
                                value={formData.tempatLahirPria}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.tempatLahirPria && <p className="text-red-500 text-sm mt-1">{errors.tempatLahirPria}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Tanggal Lahir Mempelai Pria <span className='text-red-500'>*</span></label>
                            <input
                                type="date"
                                name="tglLahirPria"
                                value={formData.tglLahirPria}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.tglLahirPria && <p className="text-red-500 text-sm mt-1">{errors.tglLahirPria}</p>}
                        </div>
                        {/* Mempelai Wanita */}
                        <div className="mb-4">
                            <label className="block text-gray-700">Nama Lengkap Mempelai Wanita
                                <span className='text-red-500'>*</span></label>
                            <Input
                                type="text"
                                name="namaLengkapWanita"
                                value={formData.namaLengkapWanita}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.namaLengkapWanita && <p className="text-red-500 text-sm mt-1">{errors.namaLengkapWanita}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Nama Panggilan Mempelai Wanita
                                <span className='text-red-500'>*</span></label>
                            <Input
                                type="text"
                                name="namaPanggilanWanita"
                                value={formData.namaPanggilanWanita}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.namaPanggilanWanita && <p className="text-red-500 text-sm mt-1">{errors.namaPanggilanWanita}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Nama Orang Tua Mempelai Wanita<span className='text-red-500'>*</span>
                                <br></br>Ex: Bapak Rozan Dan Ibu Marlina
                            </label>
                            <Input
                                type="text"
                                name="namaOrtuWanita"
                                value={formData.namaOrtuWanita}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.namaOrtuWanita && <p className="text-red-500 text-sm mt-1">{errors.namaOrtuWanita}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Tempat Lahir Mempelai Wanita
                                <span className='text-red-500'>*</span></label>
                            <Input
                                type="text"
                                name="tempatLahirWanita"
                                value={formData.tempatLahirWanita}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.tempatLahirWanita && <p className="text-red-500 text-sm mt-1">{errors.tempatLahirWanita}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Tanggal Lahir Mempelai Wanita <span className='text-red-500'>*</span></label>
                            <input
                                type="date"
                                name="tglLahirWanita"
                                value={formData.tglLahirWanita}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.tglLahirWanita && <p className="text-red-500 text-sm mt-1">{errors.tglLahirWanita}</p>}
                        </div>
                        {/* Acara */}
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Tanggal dan Jam Acara (Akad / Pemberkatan )
                                <span className='text-red-500'>*</span>
                            </label>
                            <input
                                type="datetime-local"
                                name="datetimeAkad"
                                value={formData.datetimeAkad}

                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Tanggal dan Jam Acara Resepsi
                                <span className='text-red-500'>*</span>
                            </label>
                            <input
                                type="datetime-local"
                                name="datetimeResepsi"
                                value={formData.datetimeResepsi}

                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Alamat Acara Akad/Pemberkatan (Alamat)<span className='text-red-500'>*</span>
                                <br></br>
                                Ex: Jl Jambu  Selatan No 123
                            </label>
                            <Input
                                type="text"
                                name="alamatAkad"
                                value={formData.alamatAkad}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.alamatAkad && <p className="text-red-500 text-sm mt-1">{errors.alamatAkad}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Alamat Acara Resepsi (Alamat)<span className='text-red-500'>*</span>
                                <br></br>
                                Ex: Jl Jambu  Selatan No 123
                            </label>
                            <Input
                                type="text"
                                name="alamatResepsi"
                                value={formData.alamatResepsi}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                            {errors.alamatResepsi && <p className="text-red-500 text-sm mt-1">{errors.alamatResepsi}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Tempat Acara Akad/Pemberkatan
                                <span className='text-red-500'>*</span>
                            </label>
                            <RadioGroup value={formData.opsiAkad} name="opsiAkad" onValueChange={(value) => handleChange({ target: { name: 'opsiAkad', value } })}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Wanita" id="WanitaAkad" />
                                    <Label htmlFor="WanitaAkad">Rumah Mempelai Wanita</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Pria" id="PriaAkad" />
                                    <Label htmlFor="PriaAkad">Rumah Mempelai Pria</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Lainnya" id="LainnyaAkad" />
                                    <Label htmlFor="LainnyaAkad">Lainnya</Label>
                                    <Input
                                        type="text"
                                        name="LainnyaInputAkad"
                                        value={formData.LainnyaInputAkad || ''}
                                        onChange={handleChange}
                                        className="w-full h-6 border border-gray-300 rounded-lg smaller-input"
                                        disabled={formData.opsiAkad !== "Lainnya"}
                                    />
                                </div>
                            </RadioGroup>

                            {/* {errors.alamatResepsi && <p className="text-red-500 text-sm mt-1">{errors.alamatResepsi}</p>} */}
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Tempat Acara Resepsi
                                <span className='text-red-500'>*</span>
                            </label>

                            <RadioGroup value={formData.opsiResepsi} name="opsiResepsi" onValueChange={(value) => handleChange({ target: { name: 'opsiResepsi', value } })}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Wanita" id="WanitaResepsi" />
                                    <Label htmlFor="WanitaResepsi">Rumah Mempelai Wanita</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Pria" id="PriaResepsi" />
                                    <Label htmlFor="PriaResepsi">Rumah Mempelai Pria</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Lainnya" id="LainnyaResepsi" />
                                    <Label htmlFor="LainnyaResepsi">Lainnya</Label>
                                    <Input
                                        type="text"
                                        name="LainnyaInputResepsi"
                                        value={formData.LainnyaInputResepsi || ''}
                                        onChange={handleChange}
                                        className="w-full h-6 border border-gray-300 rounded-lg smaller-input"
                                        disabled={formData.opsiResepsi !== "Lainnya"}
                                    />
                                </div>
                            </RadioGroup>

                            {/* {errors.alamatResepsi && <p className="text-red-500 text-sm mt-1">{errors.alamatResepsi}</p>} */}
                        </div>

                        {/* OPTIONAL */}
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Link Live streaming (YT)
                            </label>
                            <Input
                                type="text"
                                name="liveYt"
                                value={formData.liveYt}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />

                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Username Instagram (Pria & Wanita)
                            </label>
                            <Input
                                type="text"
                                name="usernameIg"
                                value={formData.usernameIg}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Nomor Rekening Jika ada tamu ingin kirim hadiah (Nama Bank Dan atas nama rekening)
                            </label>
                            <Input
                                type="text"
                                name="noRek"
                                value={formData.noRek}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Alamat Rumah Jika ada Pengiriman Hadiah Dari tamu Undangan
                            </label>
                            <Input
                                type="text"
                                name="alamatHadiah"
                                value={formData.alamatHadiah}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Ceritakan awal bertemu</label>
                            <Textarea
                                name="ceritaAwal"
                                value={formData.ceritaAwal}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Ceritakan awal jadian</label>
                            <Textarea
                                name="ceritaJadian"
                                value={formData.ceritaJadian}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Ceritakan awal lamaran</label>
                            <Textarea
                                name="ceritaLamaran"
                                value={formData.ceritaLamaran}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Link Maps / Sharelok lokasi acara (Akad/Pemberkatan)
                            </label>
                            <Input
                                type="text"
                                name="linkSherlokAkad"
                                value={formData.linkSherlokAkad}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Link Maps / Sharelok lokasi acara Resepsi
                            </label>
                            <Input
                                type="text"
                                name="linkSherlokResepsi"
                                value={formData.linkSherlokResepsi}
                                onChange={handleChange}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Posisi Nama Penempatan Tulisan Untuk Mempelai
                                <span className='text-red-500'>*</span>
                            </label>

                            <RadioGroup value={formData.penempatanTulisan} name="penempatanTulisan" onValueChange={(value) => handleChange({ target: { name: 'penempatanTulisan', value } })}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Wanita" id="WanitaDulu" />
                                    <Label htmlFor="WanitaDulu"> Wanita Dulu</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Pria" id="PriaDulu" />
                                    <Label htmlFor="PriaDulu">Pria Dulu</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">
                                Pilihan Thema Ceknya di{' '}
                                <a href='https://sewaundangan.com/#chat_me' target='_blank' rel='noopener noreferrer' className="text-blue-500 hover:underline">
                                    Sewaundangan.com
                                </a>
                                <span className='text-red-500'>*</span>
                            </label>

                            <RadioGroup
                                value={formData.pilihanTema}
                                name="pilihanTema"
                                onValueChange={(value) => handleChange({ target: { name: 'pilihanTema', value } })}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Admin" id="PilihanAdmin" />
                                    <Label htmlFor="PilihanAdmin">Admin Pilihkan</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Lainnya" id="LainnyaPilihanTema" />
                                    <Label htmlFor="LainnyaPilihanTema">Lainnya</Label>

                                    <Select
                                        value={formData.LainnyaPilihanTema || ''} // Add a value binding to ensure controlled input
                                        name='LainnyaPilihanTema'
                                        onValueChange={(value) => handleChange({ target: { name: 'LainnyaPilihanTema', value } })} // Update the value in formData when changed
                                        disabled={formData.pilihanTema !== "Lainnya"}
                                        className="w-full h-6 border border-gray-300 rounded-lg"
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Tema" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {isLoadingOptions ? (
                                                <SelectItem value="loading" disabled>Loading...</SelectItem>
                                            ) : options.length > 0 ? (
                                                options.map((option) => (
                                                    <SelectItem key={option.id} value={option.name}>
                                                        {option.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-options" disabled>No options available</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </RadioGroup>

                            {/* {errors.alamatResepsi && <p className="text-red-500 text-sm mt-1">{errors.alamatResepsi}</p>} */}
                        </div>



                        <Button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    {/* <ClipLoader size={20} color="#fff" className="inline-block mr-2" /> */}
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submit
                                </>
                            ) : (
                                'Submit'
                            )}
                        </Button>
                        {Object.keys(errors).length > 0 && <p className="text-red-500 text-sm mt-1">Semua Form (<span className="text-lg">*</span>) harus diisi</p>}
                    </form>

                </div>
            </div>
        </>
    );


}

export default EditDetail;