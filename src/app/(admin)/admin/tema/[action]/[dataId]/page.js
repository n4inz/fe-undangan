'use client';
import React, { useState, useEffect } from "react";
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { themeSchema } from '@/lib/validation';
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";

const FormTema = ({ params }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    loveStory: false, // Add loveStory with default value
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [coverImage, setCoverImage] = useState(null);
  const [subcoverImage, setSubcoverImage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value, // Handle checkbox value
    });
  };

  const handleImageChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      if (name === 'cover') {
        setCoverImage(imageUrl);
      } else if (name === 'subcover') {
        setSubcoverImage(imageUrl);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      themeSchema.parse(formData);
      setErrors({});

      const data = new FormData();
      data.append("name", formData.name);
      data.append("link", formData.link);
      data.append("loveStory", formData.loveStory); // Add loveStory to the form data
      data.append("totalWeddingPhoto", formData.totalWeddingPhoto);

      if (coverImage) data.append("cover", document.querySelector("input[name='cover']").files[0]);
      if (subcoverImage) data.append("subcover", document.querySelector("input[name='subcover']").files[0]);

      let response;
      switch (params.action) {
        case 'add':
          response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/add-tema`, data, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast({ title: "Theme Added" });
          break;
        case 'edit':
          response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/tema/${params.dataId}`, data, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast({ title: "Theme Updated" });
          break;
        default:
          throw new Error('Invalid action');
      }

      setIsLoading(false);
      router.push('/admin/tema');
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tema/${params.dataId}`, {
        withCredentials: true,
      });
      const data = response.data.data;

      setFormData({
        ...data,
        totalWeddingPhoto: String(data.totalWeddingPhoto),
        loveStory: data.loveStory || false, // Ensure loveStory is a boolean
      });

      if (data.ssCover) {
        setCoverImage(`${process.env.NEXT_PUBLIC_API_URL}/images/${data.ssCover}`);
      }
      if (data.ssSubcover) {
        setSubcoverImage(`${process.env.NEXT_PUBLIC_API_URL}/images/${data.ssSubcover}`);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (params.action === 'edit') {
      fetchData();
    }
  }, []);

  return (
    <>
      <div className="h-10 bg-white border-b w-full"></div>
      <div className="flex min-h-screen mx-4">
        <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden"></div>
        <div className="flex flex-col flex-grow w-full md:pl-24">
          <h1 className="my-4">
            {params.action === 'edit' ? 'Edit Tema' : 'Tambah Tema'}
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">Nama Tema <span className='text-red-500'>*</span></label>
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
              <label className="block text-gray-700">Link Tema <span className='text-red-500'>*</span></label>
              <Input
                type="text"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
              />
              {errors.link && <p className="text-red-500 text-sm mt-1">{errors.link}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Screenshot Cover</label>
              <Input
                type="file"
                name="cover"
                accept="image/*"
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                onChange={handleImageChange} // Handle cover image change
              />
            </div>
            {coverImage && (
              <div className="mt-4">
                <Image
                  src={coverImage}
                  alt="Selected Cover"
                  width={100}
                  height={100}
                  className="w-64 h-64 object-contain border mt-2 mb-4" />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700">Screenshot Subcover</label>
              <Input
                type="file"
                name="subcover"
                accept="image/*"
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                onChange={handleImageChange} // Handle subcover image change
              />
            </div>
            {subcoverImage && (
              <div className="mt-4">
                <Image src={subcoverImage}
                  alt="Selected Subcover"
                  width={100}
                  height={100}
                  className="w-64 h-64 object-contain border mt-2 mb-4" />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700">Jumlah Foto Mempelai</label>
              <RadioGroup value={formData.totalWeddingPhoto} name="totalWeddingPhoto" onValueChange={(value) => handleChange({ target: { name: 'totalWeddingPhoto', value } })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="1" />
                  <Label htmlFor="1">1 Foto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="2" />
                  <Label htmlFor="2">2 Foto</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Love Story Ada?</label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="loveStory"
                  name="loveStory"
                  checked={formData.loveStory === true}
                  onCheckedChange={(checked) => handleChange({ target: { name: 'loveStory', value: checked } })}
                />
                <label htmlFor="loveStory">Yes</label>
              </div>
            </div>
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
}

export default FormTema;
