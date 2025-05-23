'use client'
import { useEffect, useRef, useState } from 'react';
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
import { BiLeftArrowAlt, BiX } from "react-icons/bi";
import { mainSchema } from '@/lib/validation'
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { getTema } from '@/lib/tema';
import { SelectValue } from '@radix-ui/react-select';
import { getBankList } from '@/lib/bank';
import BankCombobox from '@/components/admin/BankComboBox';
import MusicCombobox from '@/components/admin/MusicComboBox';

const Edit = ({ params }) => {

    const router = useRouter();

    // Set initial state for formData
    const [formData, setFormData] = useState({});
    const [rekeningList, setRekeningList] = useState([]);
    const [musicList, setMusicList] = useState([]);

    const [errors, setErrors] = useState({});

    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);

    const [options, setOptions] = useState([]); // Store options for the Select component
    const [mounted, setMounted] = useState(false); // Track if component is mounted

    const [selectedFile, setSelectedFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false); // Track if upload is complete
    const [bankList, setBankList] = useState([]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0]; // Get only the first file
        if (file) {
            setSelectedFile(file);
            setFileName(file.name); // Set the file name to be displayed
            await handleUpload(file); // Automatically trigger upload
        }
    };

    // Handle input changes
    const handleChange = (e, index = null) => {
        const { name, value } = e.target;

        if (index !== null) {
            // Handle changes for rekening fields
            const updatedRekening = [...formData.rekening];
            updatedRekening[index] = { ...updatedRekening[index], [name]: value };
            setFormData({ ...formData, rekening: updatedRekening });
            setRekeningList(updatedRekening); // Update rekeningList state
        } else {
            // Handle changes for other fields
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validate the form data using your schema
            console.log("submitted formData: ", formData);
            mainSchema.parse(formData);
            setErrors({}); // Reset errors if validation passes

            // Send the form data as JSON
            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/form-edit/${params.formId}/${params.phoneNumber}`, formData);

            console.log('Form updated successfully:', response);
            router.push(`/forms/${params.formId}/${params.phoneNumber}/atur-foto/success/result`);
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
            setIsLoading(false); // Ensure this runs in both success and error cases
        }
    };

    const fetchMusicList = async (e) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/music-list`);
            setMusicList(response.data.data);
            // console.log("musicList", response.data.data);
        } catch (error) {
            console.error('Error fetching music list:', error);
        }
    }

    useEffect(() => {
        const fetchBankList = async () => {
            const data = await getBankList();
            setBankList(data.data);
            setIsLoading(false);
        };

        fetchBankList();
        fetchMusicList();
    }, []);

    const handleSelectBankChange = (value, index) => {
        const newRekeningList = [...rekeningList];
        newRekeningList[index].icon = value;

        const updatedRekening = [...formData.rekening];
        updatedRekening[index] = { ...updatedRekening[index], icon: value };

        setRekeningList(newRekeningList);
        setFormData({ ...formData, rekening: updatedRekening });
    };

    const handleSelectMusicChange = (value, index) => {
        setFormData((prevData) => ({
            ...prevData,
            idMusic: Number(value), // Convert to number
        }));

    };

    // const handleRekeningChange = (e, index) => {
    //     const { name, value } = e.target;
    //     const updatedRekening = [...formData.rekening];
    //     updatedRekening[index] = { ...updatedRekening[index], [name]: value };
    //     setFormData({ ...formData, rekening: updatedRekening });
    // };

    // Add new rekening entry
    const handleAddRekening = () => {
        setRekeningList([...rekeningList, { namaRekening: "", noRekening: "" }]);
    };

    const handleRemoveRekening = async (index, id) => {
        if (!id) {
            // If id is not set or null, simply update the rekeningList without making an API call
            setRekeningList((prevRekeningList) => {
                const updatedRekeningList = prevRekeningList.filter((_, i) => i !== index);
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    rekening: updatedRekeningList,
                }));
                return updatedRekeningList;
            });
            return;
        }

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/form-remove-rekening/${id}/${params.formId}/${params.phoneNumber}`);

            // Update rekeningList and formData.rekening simultaneously
            setRekeningList((prevRekeningList) => {
                const updatedRekeningList = prevRekeningList.filter((_, i) => i !== index);
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    rekening: updatedRekeningList,
                }));
                return updatedRekeningList;
            });
        } catch (error) {
            console.error('Error removing rekening:', error);
        }
    };


    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/form-data/${params.formId}/${params.phoneNumber}`);
            const fetchedFormData = response.data.form || {};

            // Initialize new formData based on fetched data
            let updatedFormData = { ...fetchedFormData };

            // Update opsiAkad if it's not 'Pria' or 'Wanita'
            if (fetchedFormData.opsiAkad !== 'Pria' && fetchedFormData.opsiAkad !== 'Wanita') {
                updatedFormData = {
                    ...updatedFormData,
                    opsiAkad: 'Lainnya',
                    LainnyaInputAkad: fetchedFormData.opsiAkad
                };
            }

            // Update opsiResepsi if it's not 'Pria' or 'Wanita'
            if (fetchedFormData.opsiResepsi !== 'Pria' && fetchedFormData.opsiResepsi !== 'Wanita') {
                updatedFormData = {
                    ...updatedFormData,
                    opsiResepsi: 'Lainnya',
                    LainnyaInputResepsi: fetchedFormData.opsiResepsi
                };
            }



            // Set the updated form data in a single setFormData call
            if (!updatedFormData.rekening) {
                updatedFormData.rekening = [];
            }
            setFormData(updatedFormData);
            setRekeningList(updatedFormData.rekening || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false); // Ensure loading is stopped
        }
    };


    useEffect(() => {
        setMounted(true); // Indicate that the component has mounted
    }, []);

    useEffect(() => {
        if (mounted) {
            const fetchDataAndOptions = async () => {
                await Promise.all([fetchData()]);
            };
            fetchDataAndOptions();
        }
    }, [mounted]);

    useEffect(() => {
        console.log("Updated formData: ", formData);
    }, [formData]);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center">
                    <ClipLoader size={50} color="#4A90E2" />
                    <p className="mt-4 text-gray-600">Loading, please wait...</p>
                </div>
            </div>
        );
    }




    return (
        <div className="flex items-center justify-center bg-gray-100">
            <div className="h-full min-h-screen bg-white rounded-lg shadow-lg max-w-xl w-full flex items-center flex-col relative">
                <div className="flex w-full px-4 py-2"> {/* Tambahkan w-full dan padding */}
                    <Button
                        onClick={() => {
                            router.push(`/forms/${params.formId}/${params.phoneNumber}/atur-foto/success/result`);
                        }}
                        className="cursor-pointer bg-white hover:bg-gray-50 rounded-full p-2" // Tambahkan styling hover
                    >
                        <BiLeftArrowAlt className='w-6 h-6 text-black' /> {/* Perbesar sedikit ikon */}
                    </Button>
                    <div className="p-2 ml-2 font-semibold text-lg"> {/* Tambahkan margin kiri */}
                        Edit Data Undangan
                    </div>
                </div>

                <form onSubmit={handleSubmit} className='m-4 lg:m-0'>
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
                    <div className="mb-4">
                        <label className="block text-gray-700">
                            Anak Ke Berapa (Mempelai Pria)
                            <br />
                            Ex: Pertama, Kedua, Bungsu, Sulung, dan lain-lain
                        </label>
                        <Input
                            type="text"
                            name="anakKeberapaPria"
                            value={formData.anakKeberapaPria}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
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
                    <div className="mb-4">
                        <label className="block text-gray-700">
                            Anak Ke Berapa (Mempelai Wanita)
                            <br />
                            Ex: Pertama, Kedua, Bungsu, Sulung, dan lain-lain
                        </label>
                        <Input
                            type="text"
                            name="anakKeberapaWanita"
                            value={formData.anakKeberapaWanita}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
                    </div>
                    {/* Acara */}
                    <div className="mb-4">
                        <label className="block text-gray-700">
                            Tanggal dan Jam Acara (Akad / Pemberkatan )
                            <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type="date"
                            name="datetimeAkad"
                            value={formData.datetimeAkad}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">
                            Jam Acara (Akad / Pemberkatan )
                            <span className='text-red-500'>*</span>
                            <br></br>
                            Ex: 12.00 WIB - Selesai
                        </label>
                        <input
                            type="text"
                            name="timeAkad"
                            value={formData.timeAkad}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">
                            Tanggal dan Jam Acara Resepsi
                            <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type="date"
                            name="datetimeResepsi"
                            value={formData.datetimeResepsi}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">
                            Jam Acara Resepsi
                            <span className='text-red-500'>*</span>
                            <br></br>
                            Ex: 12.00 WIB - Selesai
                        </label>
                        <input
                            type="text"
                            name="timeResepsi"
                            value={formData.timeResepsi}
                            onChange={handleChange}
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

                    <div className="mb-4">
                        <label className="block text-gray-700">
                            Mauskkan Nama Provinsi
                            <br></br>
                            Ex: DKI Jakarta
                        </label>
                        <Input
                            type="text"
                            name="provinsi"
                            value={formData.provinsi}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">
                            Mauskkan Nama Kota / Kabupaten
                            <br></br>
                            Ex: Jakarta Pusat
                        </label>
                        <Input
                            type="text"
                            name="kota"
                            value={formData.kota}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
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
                            Username Instagram (Pria)
                        </label>
                        <Input
                            type="text"
                            name="usernameIgPria"
                            value={formData.usernameIgPria}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">
                            Username Instagram (Wanita)
                        </label>
                        <Input
                            type="text"
                            name="usernameIgWanita"
                            value={formData.usernameIgWanita}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">
                            Pilih Model Rekening
                        </label>
                        <Select
                            value={formData.rekeningStyle}
                            onValueChange={(value) => setFormData((prevFormData) => ({ ...prevFormData, rekeningStyle: value }))}
                            className="w-full h-6 border border-gray-300 rounded-lg">
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Model Rekening" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="kartu">Kartu</SelectItem>
                                <SelectItem value="dropdown">Dropdown</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="mb-4">
                        {rekeningList.map((rekening, index) => (
                            <div
                                key={index}
                                className="mb-4 relative border border-gray-300 rounded-lg p-4"
                            >
                                {/* Show Close Button for Second Input and Beyond */}
                                {/* {index > 0 && ( */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRekening(index, rekening.id)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                    title="Hapus Rekening"
                                >
                                    ✖
                                </button>
                                {/* )} */}
                                <label className="block text-gray-700">
                                    Icon Bank {index + 1}
                                </label>
                                <BankCombobox
                                    value={rekening.icon || ''}
                                    onValueChange={(value) => handleSelectBankChange(value, index)}
                                    bankList={bankList}
                                    isLoading={isLoading}
                                />

                                <label className="block text-gray-700">
                                    Nama Rekening {index + 1}
                                </label>
                                <Input
                                    type="text"
                                    name="namaRekening"
                                    value={rekening.namaRekening}
                                    onChange={(e) => handleChange(e, index)}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                                    placeholder={`Nama Bank a/n Nasabah`}
                                />
                                <label className="block text-gray-700 mt-2">
                                    Nomor Rekening {index + 1}
                                </label>
                                <Input
                                    type="text"
                                    name="noRekening"
                                    value={rekening.noRekening}
                                    onChange={(e) => handleChange(e, index)}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                                    placeholder={`012345xxxx`}
                                />
                            </div>
                        ))}
                        <Button
                            type="button"
                            onClick={handleAddRekening}
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
                        >
                            + Tambah Rekening
                        </Button>
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
                        <div className="flex space-x-4">
                            <Input
                                type="text"
                                name="judulCeritaAwal"
                                value={formData.judulCeritaAwal}
                                onChange={handleChange}
                                className="flex-1"
                                placeholder="Judul Cerita Awal"
                            />
                            <Input
                                name="dateCeritaAwal"
                                type="month"
                                value={formData.dateCeritaAwal}
                                onChange={handleChange}
                                className="flex-1"
                            />
                        </div>
                        <Textarea
                            name="ceritaAwal"
                            value={formData.ceritaAwal}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Ceritakan awal jadian</label>
                        <div className="flex space-x-4">
                            <Input
                                type="text"
                                name="judulCeritaJadian"
                                value={formData.judulCeritaJadian}
                                onChange={handleChange}
                                className="flex-1"
                                placeholder="Judul Cerita Komitmen"
                            />
                            <Input
                                name="dateCeritaJadian"
                                type="month"
                                value={formData.dateCeritaJadian}
                                onChange={handleChange}
                                className="flex-1"
                            />
                        </div>
                        <Textarea
                            name="ceritaJadian"
                            value={formData.ceritaJadian}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Ceritakan awal lamaran</label>
                        <div className="flex space-x-4">
                            <Input
                                type="text"
                                name="judulCeritaLamaran"
                                value={formData.judulCeritaLamaran}
                                onChange={handleChange}
                                className="flex-1"
                                placeholder="Judul Cerita Lamaran"
                            />
                            <Input
                                name="dateCeritaLamaran"
                                type="month"
                                value={formData.dateCeritaLamaran}
                                onChange={handleChange}
                                className="flex-1"
                            />
                        </div>
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
                        <label className="block text-gray-700">Turut Mengundang</label>
                        <Textarea
                            name="turutMengundang"
                            value={formData.turutMengundang}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="mb-4 w-full max-w-full">
                        <label className="block text-gray-700">Pilih Musik</label>
                        <MusicCombobox
                            value={formData.idMusic || ''}
                            onValueChange={(value) => handleSelectMusicChange(value)}
                            list={musicList}
                            isLoading={isLoading}
                        />
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
    );
};

export default Edit;