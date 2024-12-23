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

const formatDateTime = (datetime) => {
  if (!datetime) return '';
  const date = new Date(datetime);
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const FORM_DATA_KEY = "formData";

const isLocalStorageAccessible = () => {
  try {
    const testKey = "__test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn("LocalStorage is not accessible:", error);
    return false;
  }
};

const Home = () => {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1); // Track the current step
  const [mounted, setMounted] = useState(false); // Track if component is mounted
  const [formData, setFormData] = useState({}); // Default empty object
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLocalStorageAccessibleState, setIsLocalStorageAccessibleState] = useState(true);
  const [options, setOptions] = useState([]);
  const [selectedTema, setSelectedTema] = useState(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [maxStep, setMaxStep] = useState(14);

  useEffect(() => {
    setMounted(true);

    const localStorageAvailable = isLocalStorageAccessible();
    setIsLocalStorageAccessibleState(localStorageAvailable);

    if (localStorageAvailable) {
      try {
        const savedFormData = window.localStorage.getItem(FORM_DATA_KEY);
        setFormData(
          savedFormData
            ? JSON.parse(savedFormData)
            : {
              name: "",
              nomorWa: "",
              namaLengkapPria: "",
              namaPanggilanPria: "",
              namaOrtuPria: "",
              namaLengkapWanita: "",
              namaPanggilanWanita: "",
              namaOrtuWanita: "",
              tempatLahirPria: "",
              tempatLahirWanita: "",
              tglLahirPria: "",
              tglLahirWanita: "",
              datetimeAkad: "",
              datetimeResepsi: "",
              alamatAkad: "",
              alamatResepsi: "",
              opsiAkad: "Wanita",
              opsiResepsi: "Wanita",
              penempatanTulisan: "Wanita",
              pilihanTema: "Admin",
            }
        );
      } catch (error) {
        console.warn("Error reading from localStorage:", error);
      }
    } else {
      setFormData({
        name: "",
        nomorWa: "",
        namaLengkapPria: "",
        namaPanggilanPria: "",
        namaOrtuPria: "",
        namaLengkapWanita: "",
        namaPanggilanWanita: "",
        namaOrtuWanita: "",
        tempatLahirPria: "",
        tempatLahirWanita: "",
        tglLahirPria: "",
        tglLahirWanita: "",
        datetimeAkad: "",
        datetimeResepsi: "",
        alamatAkad: "",
        alamatResepsi: "",
        opsiAkad: "Wanita",
        opsiResepsi: "Wanita",
        penempatanTulisan: "Wanita",
        pilihanTema: "Admin",
      });
    }
  }, []);

  const [rekeningList, setRekeningList] = useState([
    { namaRekening: "", noRekening: "" },
  ]);

  useEffect(() => {
    if (mounted && isLocalStorageAccessibleState) {
      try {
        window.localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formData));
      } catch (error) {
        console.warn("Error writing to localStorage:", error);
      }
    }
  }, [formData, mounted, isLocalStorageAccessibleState]);

  const handleChange = (e, index = null) => {
    const { name, value } = e.target;

    if (index !== null) {
      // If index is provided, update the corresponding dynamic field in rekeningList
      setRekeningList((prevRekeningList) =>
        prevRekeningList.map((item, i) =>
          i === index ? { ...item, [name]: value } : item
        )
      );
    } else {
      // If index is not provided, update the static fields in formData
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAddRekening = () => {
    setRekeningList([...rekeningList, { namaRekening: "", noRekening: "" }]);
  };

  const handleRemoveRekening = (index) => {
    setRekeningList((prevRekeningList) =>
      prevRekeningList.filter((_, i) => i !== index)
    );
  };

  const validate = () => {
    const newErrors = {};
    // Add validation logic here
    if (!formData.nomorWa) newErrors.nomorWa = "Nomor WhatsApp is required";
    if (!formData.name) newErrors.name = "Nama is required";
    // Add validation for other fields similarly
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep < maxStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Validate `formData` using Zod schema
      schema.parse(formData);
      setErrors({});

      const fd = new FormData();
      fd.append("data", JSON.stringify(formData));
      fd.append("rekeningList", JSON.stringify(rekeningList)); // Add rekeningList to FormData

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/forms`, fd, {
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (isLocalStorageAccessibleState) {
            try {
              window.localStorage.removeItem(FORM_DATA_KEY);
            } catch (error) {
              console.warn("Error removing localStorage item:", error);
            }
          }
          router.push(`/${response.data.id}/${response.data.nomorWa}/success`);
        })
        .catch((error) => {
          console.error("Error uploading files:", error);
          setIsLoading(false);
        });
    } catch (error) {
      setIsLoading(false);
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        let lowestErrorStep = Infinity; // Track the lowest step with an error

        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
          const step = getStepFromFieldName(err.path[0]); // New function
          lowestErrorStep = Math.min(lowestErrorStep, step);
        });

        console.log("Validation errors:", fieldErrors);
        setErrors(fieldErrors);
        setCurrentStep(lowestErrorStep); // Jump to the step with the lowest error

        const firstErrorField = document.querySelector(
          `[name="${error.errors[0].path[0]}"]`
        );
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        console.error("An unexpected error occurred:", error);
      }
    }
  };


  const getStepFromFieldName = (fieldName) => {
    // Map field names to their corresponding steps.  Adjust this mapping to match your form structure.
    switch (fieldName) {
      case "nomorWa":
      case "name":
        return 1;
      case "namaLengkapPria":
      case "namaPanggilanPria":
      case "namaOrtuPria":
      case "tempatLahirPria":
      case "tglLahirPria":
      case "alamatPria":
        return 2;
      case "namaLengkapWanita":
      case "namaPanggilanWanita":
      case "namaOrtuWanita":
      case "tempatLahirWanita":
      case "tglLahirWanita":
      case "alamatWanita":
        return 3;
      case "provinsi":
      case "kota":
        return 4;
      case "datetimeAkad":
      case "datetimeResepsi":
      case "alamatAkad":
      case "alamatResepsi":
      case "opsiAkad":
      case "opsiResepsi":
      case "LainnyaInputAkad":
      case "LainnyaInputResepsi":
        return 5;
      // Add more cases for other fields and steps...
      case "liveYt":
      case "usernameIgPria":
      case "usernameIgWanita":
        return 6;
      // ...and so on for all your steps.
      case "pilihanTema":
        return 14;
      default:
        return 1; // Default to step 1 if field name is not found
    }
  };

  const handleSelectChange = (id, name) => {
    setSelectedTema({ id, name }); // Store the selected theme in selectedTema
    setFormData((prevData) => ({
      ...prevData,
      idTema: id, // Convert idTema to a string here
    }));
  };

  const handleRadioChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      pilihanTema: value,
    }));
    if (value !== "Lainnya") {
      setSelectedTema(null); // Clear selectedTema if "Lainnya" is not selected
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const data = await getTema();
        setOptions(data || []);

        // Set selectedTema after options are loaded
        if (formData.idTema) {
          const theme = data.find((option) => option.id === formData.idTema);
          if (theme) {
            setSelectedTema({ id: theme.id, name: theme.name });
          }
        }
      } catch (error) {
        console.error("Error fetching tema options:", error);
        setOptions([]); // Ensure options remains an array in case of error
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [formData.idTema]);

  if (!mounted) {
    return null;
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-2">SewaUndangan</h1>
        <h2 className="text-2xl font-medium mb-4"> {/* Add classes for size and alignment */}
          {currentStep}/{maxStep}  {/* Assuming 3 steps */}
        </h2>
        <form onSubmit={handleSubmit} encType='multipart/form-data'>
          {currentStep === 1 && (
            <>
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
            </>
          )}
          {currentStep === 2 && (
            <>
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
            </>
          )}
          {currentStep === 3 && (
            <>
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
                <label className="block text-gray-700">Tanggal Lahir Mempelai Wanita</label>
                <input
                  type="date"
                  name="tglLahirWanita"
                  value={formData.tglLahirWanita}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                />
                {/* {errors.tglLahirWanita && <p className="text-red-500 text-sm mt-1">{errors.tglLahirWanita}</p>} */}
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
            </>
          )}
          {currentStep === 4 && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">
                  Masukkan Nama Provinsi
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
                  Masukkan Nama Kota / Kabupaten
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
            </>
          )}
          {currentStep === 5 && (
            <>

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
            </>
          )}

          {currentStep === 6 && (
            <>
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
            </>
          )}
          {currentStep === 7 && (
            <>
              {/* Dynamic Fields */}
              <div className="mb-4">
                {rekeningList.map((rekening, index) => (
                  <div
                    key={index}
                    className="mb-4 relative border border-gray-300 rounded-lg p-4"
                  >
                    {/* Show Close Button for Second Input and Beyond */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRekening(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        title="Hapus Rekening"
                      >
                        ✖
                      </button>
                    )}
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
            </>
          )}

          {currentStep === 8 && (
            <>
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
            </>
          )}

          {currentStep === 9 && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">
                  Ceritakan awal bertemu
                </label>
                <div className="md:w-1/2">
                  <Input
                    name="dateCeritaAwal"
                    type="month"
                    id="month"
                    value={formData.dateCeritaAwal}
                    onChange={handleChange}
                  />
                </div>
                <Textarea
                  name="ceritaAwal"
                  value={formData.ceritaAwal}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}
          {currentStep === 10 && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">Ceritakan awal komitmen</label>
                <div className="md:w-1/2">
                  <Input
                    name="dateCeritaJadian"
                    type="month"
                    id="month"
                    value={formData.dateCeritaJadian}
                    onChange={handleChange}
                  />
                </div>
                <Textarea
                  name="ceritaJadian"
                  value={formData.ceritaJadian}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}
          {currentStep === 11 && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">Ceritakan awal lamaran</label>
                <div className="md:w-1/2">
                  <Input
                    name="dateCeritaLamaran"
                    type="month"
                    id="month"
                    value={formData.dateCeritaLamaran}
                    onChange={handleChange}
                  />
                </div>
                <Textarea
                  name="ceritaLamaran"
                  value={formData.ceritaLamaran}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}

          {currentStep === 12 && (
            <>
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
            </>
          )}
          {currentStep === 13 && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">Turut Mengundang</label>
                <Textarea
                  name="turutMengundang"
                  value={formData.turutMengundang}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}
          {currentStep === maxStep && (
            <>
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
                  onValueChange={(value) => handleRadioChange(value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Admin" id="PilihanAdmin" />
                    <Label htmlFor="PilihanAdmin">Admin Pilihkan</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Lainnya" id="LainnyaPilihanTema" />
                    <Label htmlFor="LainnyaPilihanTema">Lainnya</Label>

                    <Select
                      value={selectedTema ? selectedTema.id : ''}
                      onValueChange={(value) => {
                        const selectedOption = options.find((option) => option.id === value);
                        if (selectedOption) {
                          handleSelectChange(selectedOption.id, selectedOption.name);
                        }
                      }}
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
                            <SelectItem key={option.id} value={option.id}>
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
            </>
          )}
          <div className="flex justify-end"> {/* Use justify-end to align to the right */}
            {currentStep > 1 && (
              <button type="button" onClick={handlePrevious} className="px-4 py-2 bg-gray-300 rounded-md mr-2"> {/* Added margin for spacing */}
                Kembali
              </button>
            )}
            {currentStep < maxStep ? (
              <button type="button" onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white rounded-md">
                Selanjutnya
              </button>
            ) : (
              <Button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submit
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            )}
          </div>
          {Object.keys(errors).length > 0 && <p className="text-red-500 text-sm mt-1">Semua Form (<span className="text-lg">*</span>) harus diisi</p>}
        </form>
      </div>
    </div >
  );
}

export default Home;
