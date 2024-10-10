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
import { BiX } from "react-icons/bi";
import { schema } from '@/lib/validation'
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { getTema } from '@/lib/tema';
import { SelectValue } from '@radix-ui/react-select';

// Define the key for localStorage
const FORM_DATA_KEY = 'formData';

const formatDateTime = (datetime) => {
  if (!datetime) return '';
  const date = new Date(datetime);
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const Home = () => {
  const router = useRouter();

  const [mounted, setMounted] = useState(false); // Track if component is mounted
  // Set initial state for formData
  const [formData, setFormData] = useState(() => {
    // On first render, try to load form data from localStorage
    if (typeof window !== "undefined") {
      const savedFormData = localStorage.getItem(FORM_DATA_KEY);
      return savedFormData ? JSON.parse(savedFormData) : {
        name: '',
        nomorWa: '',
        namaLengkapPria: '',
        namaPanggilanPria: '',
        namaOrtuPria: '',
        tglLahirPria: '',
        namaLengkapWanita: '',
        namaPanggilanWanita: '',
        namaOrtuWanita: '',
        tglLahirWanita: '',
        datetimeAkad: '',
        datetimeResepsi: '',
        alamatAkad: "",
        alamatResepsi: "",
        opsiAkad: 'Wanita',
        opsiResepsi: 'Wanita',
        penempatanTulisan: 'Wanita',
        pilihanTema: 'Admin'
      };
    } else {
      return {}; // Fallback for server-side rendering
    }
  });

  const [images, setImages] = useState([]);

  const [errors, setErrors] = useState({});

  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [isLoadingImage, setIsLoadingImage] = useState(Array(images.length).fill(false)); // Initialize loading state for each image
  const [newFiles, setNewFiles] = useState([]);
  const [filePath, setFilePath] = useState([]);
  // const [displayedImages, setDisplayedImages] = useState([]);
  const [options, setOptions] = useState([]); // Store options for the Select component

  // Only run this after the component has mounted (client-side)
  useEffect(() => {
    setMounted(true); // Indicate that the component has mounted

    const savedFormData = localStorage.getItem(FORM_DATA_KEY);
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  // Save form data to localStorage whenever formData changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formData));
    }
  }, [formData, mounted]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = async (e) => {
    setIsLoading(true)
    setIsLoadingImage(true);
    const newFiles = Array.from(e.target.files);

    const nonImageFiles = newFiles.filter(file => !file.type.startsWith('image/'));

    if (nonImageFiles.length > 0) {
      setErrors({ ...errors, images: "Only image files are allowed" });
      setIsLoadingImage(false);
      setIsLoading(false)
      return;
    }

    // Limit to 20 images (including previously displayed images)
    if (images.length + newFiles.length > 20) {
      setErrors({ ...errors, images: "Maksimal upload adalah 20 foto" });
      setIsLoadingImage(false);
      setIsLoading(false)
      return;
    }

    // Add new files to displayed images
    setImages([...images, ...newFiles]);
    setNewFiles(newFiles); // Set newFiles for uploading
    setErrors({ ...errors, images: undefined });

    const fd = new FormData();
    newFiles.forEach((file) => {
      fd.append('files', file);
    });

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/forms-upload-temp`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Files uploaded successfully:', response);
      setFilePath(prevFilePaths => [...prevFilePaths, ...response.data.filePaths]);
      // Redirect to /[formId]/[phoneNumber]/success
      // router.push(`/${response.data.id}/${response.data.nomorWa}/success`);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsLoadingImage(false);
      setIsLoading(false)
      // e.target.value = '';
    }
  };


  const handleRemoveImage = (index) => {
    setIsLoadingImage(true);
    setImages(prev => {
      const updatedImages = [...prev]; // Create a copy of the current images
      updatedImages.splice(index, 1); // Remove the image at the specified index
      setErrors({ ...errors, images: undefined });
      return updatedImages;
    });
    setFilePath(prev => {
      const updatedFilePaths = [...prev];
      updatedFilePaths.splice(index, 1);
      return updatedFilePaths;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true)
    // console.log('Form submit triggered');
    try {
      schema.parse(formData);

      setErrors({}); // Changed from setErrors([]) to setErrors({}) to match the initial state structure

      const fd = new FormData();
      // Combine formData, images, and filePaths into a single object

      fd.append('data', JSON.stringify(formData))
      fd.append('images', JSON.stringify(filePath))

      // //   console.log("FormData:", formData);
      // // console.log("Images:", images);
      // console.log("FilePaths:", filePath);
      // // console.log("Combined Data:", combinedData);
      // // console.log("FormData object entries:");
      // for (let [key, value] of fd.entries()) {
      //   console.log(key, value);
      // }
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/forms`, fd, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          console.log('Files uploaded successfully:', response);
          //redirect to /[formId]/[phoneNumber]/success
          localStorage.removeItem('formData');
          // setFormData(null); // Update state to reflect the change
          router.push(`/${response.data.id}/${response.data.nomorWa}/success`)
          // setIsLoading(false)
        })
        .catch(error => {
          console.error('Error uploading files:', error);
          setIsLoading(false)
        });
    } catch (error) {
      setIsLoading(false)
      // } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach(err => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        const firstErrorField = document.querySelector(`[name="${error.errors[0].path[0]}"]`);
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        console.log(fieldErrors)
        // console.log(fieldErrors);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  };

  const handleRadioChange = (group, value) => {
    setFormData((prevValues) => ({
      ...prevValues,
      [group]: value,
    }));
  };

  const handleSelectChange = (value) => {
    setFormData({ ...formData, pilihanTema: value });
  };

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
    }));
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const data = await getTema();
        setOptions(data || []); // Ensure data is an array, even if it's undefined
      } catch (error) {
        console.error('Error fetching tema options:', error);
        setOptions([]); // Ensure options remains an array in case of error
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  // If the component is not mounted, don't render anything (prevent SSR mismatch)
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-6">SewaUndangan</h1>
        <form onSubmit={handleSubmit} encType='multipart/form-data'>
          <div className="mb-4">
            <label className="block text-gray-700">Nomor Whatsapp Anda<span className='text-red-500'>*</span></label>
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
            <label className="block text-gray-700">Nama Anda <span className='text-red-500'>*</span></label>
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
            <label className="block text-gray-700">Tanggal Lahir Mempelai Pria</label>
            <input
              type="date"
              name="tglLahirPria"
              value={formData.tglLahirPria}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
            {/* {errors.tglLahirPria && <p className="text-red-500 text-sm mt-1">{errors.tglLahirPria}</p>} */}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Alamat Mempelai Pria
              <br />
              Ex: Jl Jambu  Selatan No 123
            </label>
            <Input
              type="text"
              name="alamatPria"
              value={formData.alamatPria}
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
            {/* {errors.tempatLahirWanita && <p className="text-red-500 text-sm mt-1">{errors.tempatLahirWanita}</p>} */}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Tanggal Lahir Mempelai Wanita</label>
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
            <label className="block text-gray-700">Alamat Mempelai Wanita

            <br />
              Ex: Jl Jambu  Selatan No 123
            </label>
            <Input
              type="text"
              name="alamatWanita"
              value={formData.alamatWanita}
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
              type="datetime-local"
              name="datetimeAkad"
              value={formatDateTime(formData.datetimeAkad)}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
            {errors.datetimeAkad && <p className="text-red-500 text-sm mt-1">{errors.datetimeAkad}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Tanggal dan Jam Acara Resepsi
              <span className='text-red-500'>*</span>
            </label>
            <input
              type="datetime-local"
              name="datetimeResepsi"
              value={formatDateTime(formData.datetimeResepsi)}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
            {errors.datetimeResepsi && <p className="text-red-500 text-sm mt-1">{errors.datetimeResepsi}</p>}
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

            <RadioGroup defaultValue={formData.penempatanTulisan} name="penempatanTulisan" onChange={handleChange}>
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

          <div className="mb-4">
            <label className="block text-gray-700">Upload Foto Yang Ingin Di Tampilkan (Max. 20)</label>
            <input
              type="file"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
            {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {images.map((file, index) => (
              <div key={index} className="relative w-24 h-24">
                {isLoadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <ClipLoader size={20} color="#000" /> {/* Spinner */}
                  </div>
                )}
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  fill
                  className="rounded-lg border border-gray-300"
                  unoptimized
                  onError={() => setIsLoadingImage(false)} // Hide spinner on error
                  onLoad={() => setIsLoadingImage(true)} // Hide spinner when image loads
                  // onLoadingComplete={() => setIsLoadingImage(false)} // Hide spinner when image loads
                  quality={50}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <BiX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>




          {/* <div className="mb-4">
            <label className="block text-gray-700">Phone Number:</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Keterangan:</label>
            <Textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
            {errors.keterangan && <p className="text-red-500 text-sm mt-1">{errors.keterangan}</p>}
          </div> */}

          {/* <div className="flex flex-wrap gap-2 mb-4">
            {formData.images.map((file, index) => (
              <div key={index} className="relative w-24 h-24">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg border border-gray-300"
                  unoptimized
                />
              </div>
            ))}
          </div> */}

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
}

export default Home;