"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { z } from "zod";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import Cookies from "js-cookie";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [turnstileToken, setTurnstileToken] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(false);
  const widgetIdRef = useRef(null);

  // tsState: "loading" = show "Preparing verification…"
  // "ready" = widget rendered (hide placeholder)
  // "error" = hide placeholder and show error text
  const [tsState, setTsState] = useState("loading");

  // reset widget: clear token + show loading while widget resets,
  // then mark ready after small delay (widget UI settles)
  const resetTurnstile = () => {
    try {
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.reset(widgetIdRef.current);
      }
    } catch (err) {
      console.warn("turnstile reset failed", err);
    } finally {
      setTurnstileToken("");
      setTsState("loading");
      // small delay to allow visual widget to re-appear before hiding placeholder
      setTimeout(() => setTsState("ready"), 300);
    }
  };

  // Render widget safely after script loads
  const safeRenderTurnstile = () => {
    if (!window.turnstile) return;
    if (widgetIdRef.current) return;

    try {
      widgetIdRef.current = window.turnstile.render("#cf-turnstile", {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY,
        callback: (token) => {
          setTurnstileToken(token);
        },
        "expired-callback": () => setTurnstileToken(""),
      });

      // widget rendered successfully — hide the "preparing" placeholder
      setTsState("ready");
    } catch (err) {
      console.error("turnstile render failed", err);
      // keep placeholder hidden and show error so user sees message
      setTsState("error");
      setErrors(prev => ({ ...prev, turnstile: "Verification is unavailable." }));
    }
  };

  // load script + ensure render always happens
  useEffect(() => {
    const scriptSelector =
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]';
    const existingScript = document.querySelector(scriptSelector);

    if (!existingScript) {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = () => {
        const interval = setInterval(() => {
          if (window.turnstile) {
            safeRenderTurnstile();
            clearInterval(interval);
          }
        }, 50);
      };
      s.onerror = () => {
        // if script can't load, mark error so "preparing" doesn't hang
        setTsState("error");
        setErrors(prev => ({ ...prev, turnstile: "Verification failed to load." }));
      };
      document.head.appendChild(s);
    } else {
      // script already exists — wait for turnstile API
      const interval = setInterval(() => {
        if (window.turnstile) {
          safeRenderTurnstile();
          clearInterval(interval);
        }
      }, 50);
    }

    return () => {
      try {
        if (window.turnstile && widgetIdRef.current) {
          if (typeof window.turnstile.remove === "function") {
            window.turnstile.remove(widgetIdRef.current);
          }
        }
      } catch (err) {}
      widgetIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!turnstileToken) {
      // no token -> reset and show validation message, hide preparing placeholder
      resetTurnstile();
      setErrors({ turnstile: "Please complete the verification" });
      setTsState("error");
      setIsLoading(false);
      return;
    }

    try {
      loginSchema.parse(formData);
      setErrors({});

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/login`,
        {
          email: formData.email,
          password: formData.password,
          turnstileToken,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        Cookies.set("client_token", response.data.token, { expires: 7 });

        if (response.data.isAdmin == 1) {
          router.push("/admin/dashboard");
        } else {
          router.push("/admin/list");
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        setTsState("error");
      } else if (axios.isAxiosError(error) && error.response) {
        const statusCode = error.response.status;

        if (statusCode === 401) {
          setStatus(true);
          // wrong credentials — reset widget visually, but hide "preparing"
          resetTurnstile();
          setTsState("error");
        } else if (statusCode === 403) {
          setErrors({ turnstile: "Verification failed — try again" });
          // verification failure — reset widget visually, but hide preparing text
          resetTurnstile();
          setTsState("error");
        } else {
          setErrors({ turnstile: "Server error — please try again later." });
          setTsState("error");
        }
      } else {
        console.error("Unexpected error:", error);
        setErrors({ turnstile: "Unexpected error occurred." });
        setTsState("error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-1 py-4">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription className="text-sm">Enter your email and password</CardDescription>
        </CardHeader>

        <CardContent className="py-3">
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm">Email</Label>
                <Input name="email" type="email" onChange={handleChange} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-sm">Password</Label>
                <Input name="password" type="password" onChange={handleChange} />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
                {status && <p className="text-red-500 text-xs mt-1">Wrong email or password</p>}
              </div>

              {/* Turnstile placeholder: only show "Preparing..." while tsState === "loading" */}
              <div className="my-1">
                <div
                  id="cf-turnstile"
                  className="h-[150px] md:h-[140px] w-full flex items-center justify-center overflow-hidden bg-transparent rounded"
                  aria-hidden={tsState !== "ready"}
                >
                  {tsState === "loading" && (
                    <div className="animate-pulse text-gray-400 text-xs">
                      Preparing verification…
                    </div>
                  )}

                  {/* show specific verification error message if any and state is "error" */}
                  {tsState === "error" && errors.turnstile && (
                    <div className="text-xs text-yellow-600 text-center px-2">
                      {errors.turnstile}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full py-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <ClipLoader size={16} color="#fff" className="mr-2" />
                      Login
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
