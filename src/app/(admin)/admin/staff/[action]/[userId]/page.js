'use client';
import React, { useState, useEffect } from "react";
import { z } from 'zod';
// import LoadingSpinner from '../components/LoadingSpinner'; // Adjust the path as needed
import { Input } from '@/components/ui/input';
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { staffSchema } from '@/lib/validation'
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

// import { BiX } from "react-icons/bi";

const FormStaff = ({ params }) => {

  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // console.log(formData.datetimeAkad)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      staffSchema.parse(formData);
      setErrors({});

      let response;

      switch (params.action) {
        case 'add':
          response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/register`, formData, {
            withCredentials: true,
          });
          toast({
            title: "Staff Added",
          });
          break;
        
        case 'edit':
          response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/${params.userId}`, formData, {
            withCredentials: true,
          });
          toast({
            title: "Staff Updated",
          });
          break;

        default:
          throw new Error('Invalid action');
      }

      setIsLoading(false);
      router.push('/admin/staff')
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
        // console.log(fieldErrors);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  }

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${params.userId}`, {
        withCredentials: true, // Correct way to include credentials
      });
      setFormData(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    if (params.action === 'edit') {
      fetchUser();
    }
  }, []); // Include params.action and params.userId as dependencies

  useEffect(() => {
    console.log(formData); // Log formData whenever it changes
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
          {params.action === 'edit' ? 'Edit Staff' : 'Tambah Staff'}
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">Alamat Email <span className='text-red-500'>*</span></label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Nama Staff <span className='text-red-500'>*</span></label>
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
              <label className="block text-gray-700">Password <span className='text-red-500'>*</span></label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
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

export default FormStaff;