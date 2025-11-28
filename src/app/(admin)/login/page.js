"use client"
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema } from '@/lib/validation'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import axios from 'axios'
import { ClipLoader } from 'react-spinners'
import Cookies from 'js-cookie'

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [turnstileToken, setTurnstileToken] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(false);

  // Load Turnstile script and register callbacks
  useEffect(() => {
    // add global callback functions that Turnstile can call
    window.onTurnstileSuccess = (token) => {
      setTurnstileToken(token);
    };
    window.onTurnstileExpired = () => {
      setTurnstileToken("");
    };

    // inject script if not already present
    if (!document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]')) {
      const s = document.createElement('script');
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    return () => {
      // cleanup (avoid leaking globals across navigations in dev)
      try {
        delete window.onTurnstileSuccess;
        delete window.onTurnstileExpired;
      } catch (e) {}
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      loginSchema.parse(formData);
      setErrors({});

      if (!turnstileToken) {
        setErrors({ turnstile: "Please complete the verification" });
        setIsLoading(false);
        return;
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        email: formData.email,
        password: formData.password,
        turnstileToken // kirim token ke server untuk divalidasi
      }, { withCredentials: true });

      if (response.status === 200) {
        Cookies.set('client_token', response.data.token, { expires: 7 });
        if(response.data.isAdmin == 1){
          router.push(`/admin/dashboard`);
        }else{
          router.push(`/admin/list`);
        }
      } else {
        setStatus(true);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach(err => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        setStatus(false)
      } else if (axios.isAxiosError && error.response) {
        // jika server mengembalikan error (mis. turnstile gagal)
        setStatus(true)
      } else {
        console.error('An unexpected error occurred:', error);
        setStatus(true)
      }
    } finally {
      setIsLoading(false)
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
                {status && <p className="text-red-500 text-sm mt-1">Wrong email or password</p>}
              </div>

              {/* Turnstile widget */}
              <div className="my-2">
                {/* Cloudflare will create a hidden input named "cf-turnstile-response" when widget succeeds.
                    We also set data-callback to call window.onTurnstileSuccess(token) */
                }
                <div
                  id="cf-turnstile"
                  className="cf-turnstile"
                  data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY}
                  data-callback="onTurnstileSuccess"
                  data-expired-callback="onTurnstileExpired"
                />
                {errors.turnstile && <p className="text-red-500 text-sm mt-1">{errors.turnstile}</p>}
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