'use client';
import React, { useState, useEffect } from "react";
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { assetSchema } from '@/lib/validation';
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const FormTema = ({ params }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [assetImage, setAssetImage] = useState(null); // State to hold selected cover image
  const [file, setFile] = useState(null); // State to hold the file for the asset image

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const { files } = e.target;
    const selectedFile = files[0];
    if (selectedFile) {
      setFile(selectedFile); // Save the selected file
      const imageUrl = URL.createObjectURL(selectedFile); // Preview the image
      setAssetImage(imageUrl); // Set cover image URL for preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate the form data
      assetSchema.parse(formData);
      setErrors({});

      const data = new FormData();
      data.append("name", formData.name);

      // Append the selected file if available
      if (file) {
        data.append("asset", file);
      }

      let response;
      switch (params.action) {
        case 'add':
          response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/add-asset`, data, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast({ title: "Asset Added" });
          break;
        case 'edit':
          response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/asset/${params.dataId}`, data, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast({ title: "Asset Updated" });
          break;
        default:
          throw new Error('Invalid action');
      }

      setIsLoading(false);
      router.push('/admin/asset');
    } catch (error) {
      setIsLoading(false);
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
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/asset/${params.dataId}`, {
        withCredentials: true,
      });
      const data = response.data.data;
      setFormData({ name: data.name });

      // If there's a file, set the image for preview in edit mode
      if (data.file) {
        setAssetImage(`${process.env.NEXT_PUBLIC_API_URL}/asset/${data.file}`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (params.action === 'edit') {
      fetchData();
    }
  }, [params.action, params.dataId]);

  return (
    <>
      <div className="h-10 bg-white border-b w-full"></div>
      <div className="flex min-h-screen mx-4">
        <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden"></div>
        <div className="flex flex-col flex-grow w-full md:pl-24">
          <h1 className="my-4">
            {params.action === 'edit' ? 'Edit Asset' : 'Tambah Asset'}
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">Nama Asset <span className='text-red-500'>*</span></label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Upload Aset</label>
              <Input
                type="file"
                name="asset"
                accept="image/*"
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                onChange={handleImageChange}
              />
            </div>
            {assetImage && (
              <div className="mt-4">
                <Image
                  src={assetImage}
                  alt="Selected Cover"
                  width={100}
                  height={100}
                  className="w-64 h-64 object-contain border mt-2 mb-4"
                />
              </div>
            )}
            <div className="flex justify-start">
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
                  'Submit'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default FormTema;
