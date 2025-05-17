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

const FormMusic = ({ params }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null); // State to hold the file for the asset music
  const [musicUrl, setMusicUrl] = useState(null); // State to hold the URL for the selected music

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleMusicChange = (e) => {
    const { files } = e.target;
    const selectedFile = files[0];
    if (selectedFile) {
      // Hapus URL lama sebelum membuat yang baru
      if (musicUrl) {
        URL.revokeObjectURL(musicUrl);
      }

      setFile(selectedFile);
      const newMusicUrl = URL.createObjectURL(selectedFile);
      setMusicUrl(newMusicUrl);
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
        data.append("music", file);
      }

      let response;
      switch (params.action) {
        case 'add':
          response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/add-music`, data, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast({ title: "Music Added" });
          break;
        case 'edit':
          response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/music/${params.dataId}`, data, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast({ title: "Music Updated" });
          break;
        default:
          throw new Error('Invalid action');
      }

      setIsLoading(false);
      router.push('/admin/music');
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/music/${params.dataId}`, {
        withCredentials: true,
      });
      const data = response.data.data;
      setFormData({ name: data.name });

      // If there's a file, set the music URL for preview in edit mode
      if (data.file) {
        setMusicUrl(`${process.env.NEXT_PUBLIC_API_URL}/music/${data.file}`);
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
            {params.action === 'edit' ? 'Edit Music' : 'Add Music'}
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">Music Name <span className='text-red-500'>*</span></label>
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
              <label className="block text-gray-700">Upload Music</label>
              <Input
                type="file"
                name="music"
                accept="audio/*"
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                onChange={handleMusicChange}
              />
            </div>
            {musicUrl && (
              <div className="my-4">
                <audio
                  controls
                  key={musicUrl} // Force re-render when URL changes
                >
                  <source src={musicUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
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

export default FormMusic;