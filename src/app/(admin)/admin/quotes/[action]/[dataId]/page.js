'use client';
import React, { useState, useEffect } from "react";
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { quoteSchema } from '@/lib/validation'
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

const FormQuote = ({ params }) => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    source: '',
    quote: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      quoteSchema.parse(formData);
      setErrors({});

      let response;

      switch (params.action) {
        case 'add':
          response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/quote`, formData, {
            withCredentials: true,
          });
          toast({
            title: "Quote Added",
          });
          break;

        case 'edit':
          response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/quote/${params.dataId}`, formData, {
            withCredentials: true,
          });
          toast({
            title: "Quote Updated",
          });
          break;

        default:
          throw new Error('Invalid action');
      }

      setIsLoading(false);
      router.push('/admin/quotes')
    } catch (error) {
      setIsLoading(false)
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
  }

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/quote/${params.dataId}`, {
        withCredentials: true,
      });
      setFormData(response.data.data);
    } catch (error) {
      console.error('Error fetching quote:', error);
    }
  };

  useEffect(() => {
    if (params.action === 'edit') {
      fetchData();
    }
  }, []);

  useEffect(() => {
    console.log(formData);
  }, [formData]);

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
          <h1 className="my-4">
            {params.action === 'edit' ? 'Edit Quote' : 'Add Quote'}
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">Source <span className='text-red-500'>*</span></label>
              <Input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
              />
              {errors.source && <p className="text-red-500 text-sm mt-1">{errors.source}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Quote <span className='text-red-500'>*</span></label>
              <Textarea
                name="quote"
                value={formData.quote}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                rows={5}
              />
              {errors.quote && <p className="text-red-500 text-sm mt-1">{errors.quote}</p>}
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

export default FormQuote;