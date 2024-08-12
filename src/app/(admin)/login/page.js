"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema } from '@/lib/validation'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import axios from 'axios'
import { ClipLoader } from 'react-spinners'

const Login = () => {

  const [formData, setFormData] = useState({ email: "", password: "" });
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true)
    console.log('Form submit triggered');
    try {
      loginSchema.parse(formData);

      setErrors({}); // Changed from setErrors([]) to setErrors({}) to match the initial state structure

      const response = axios.post(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        email: formData.email,
        password: formData.password
      })
        .then(response => {
          console.log('successfully:', response);
          router.push(`/admin/dashboard`)
          // setIsLoading(false)
        })
        .catch(error => {
          console.error('Error:', error);
          setIsLoading(false)
        });
    } catch (error) {
      setIsLoading(false)
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach(err => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        console.log(fieldErrors);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your email and password to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} encType='multipart/form-data'>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input name="email" id="email" type="email" placeholder="m@example.com" onChange={handleChange} />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input name="password" id="password" type="password" onChange={handleChange} />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
              <Button type="submit" className="w-full px-4 py-2 rounded-lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <ClipLoader size={20} color="#fff" className="inline-block mr-2" /> {/* Spinner */}
                Login
              </>
            ) : (
              'Login'
            )}
          </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login