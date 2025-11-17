"use client";

import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

export default function ChangePasswordModal({ open, onOpenChange }) {
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOldPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
    setErrorMsg("");
  };

  const handleSubmit = async () => {
    // validasi client-side → tampilkan inline, bukan toast
    if (!oldPassword || !newPassword || !confirmPassword) {
      return setErrorMsg("Semua field wajib diisi.");
    }
    if (newPassword !== confirmPassword) {
      return setErrorMsg("Konfirmasi password tidak cocok.");
    }
    if (newPassword.length < 6) {
      return setErrorMsg("Password baru minimal 6 karakter.");
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/change-password`,
        {
          oldPassword,
          newPassword,
          confirmPassword,
        },
        { withCredentials: true }
      );

      toast({
        title: "Berhasil!",
        description: res.data?.message || "Password berhasil diubah.",
      });

      resetForm();
      onOpenChange(false);

    } catch (err) {
      const msg = err.response?.data?.error || "Terjadi kesalahan";

      toast({
        title: "Gagal!",
        description: msg,
        variant: "destructive",
      });

      setErrorMsg(msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ubah Password</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* Error inline */}
          {errorMsg && (
            <p className="text-sm text-red-600">{errorMsg}</p>
          )}

          {/* Password Lama */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium">Password Lama</label>
            <div className="relative">
              <input
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                type={showOldPass ? "text" : "password"}
                className="border rounded-md px-3 py-2 text-sm w-full"
                placeholder="Masukkan password lama"
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password Baru */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium">Password Baru</label>
            <div className="relative">
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type={showNewPass ? "text" : "password"}
                className="border rounded-md px-3 py-2 text-sm w-full"
                placeholder="Masukkan password baru"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showConfirmPass ? "text" : "password"}
                className="border rounded-md px-3 py-2 text-sm w-full"
                placeholder="Ulangi password baru"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
            disabled={loading}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
